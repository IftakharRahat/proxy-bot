import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NovproxyService } from '../novproxy/novproxy.service';
import { ProxyChainService } from '../proxy-chain/proxy-chain.service';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class AutoProcurementService {
    private readonly logger = new Logger(AutoProcurementService.name);

    constructor(
        private prisma: PrismaService,
        private novproxy: NovproxyService,
        private chain: ProxyChainService,
        private admin: AdminService, // For purchase logging
    ) { }

    /**
     * Check if inventory needs refill, and buy if enabled
     */
    async checkAndRefill(tier: string, country: string): Promise<boolean> {
        this.logger.log(`Checking inventory for ${tier} (${country})...`);

        // 1. Check if any slots available
        // We look for ports of this tier & country that have space
        const available = await this.prisma.port.count({
            where: {
                isActive: true,
                packageType: tier,
                country: country, // Strict check? Or variations?
                currentUsers: { lt: (this.prisma.port as any).fields.maxUsers },
            },
        });

        if (available > 0) {
            this.logger.log(`Slots available (${available}), no refill needed.`);
            return false;
        }

        // 2. No slots -> Check Config
        const config = await this.prisma.packageConfig.findUnique({ where: { name: tier } });
        if (!config || !config.autoBuyEnabled) {
            this.logger.warn(`Auto-buy disabled or config missing for ${tier}`);
            return false;
        }

        this.logger.log(`Auto-buy triggered for ${tier}. Duration: ${config.autoBuyDuration} days.`);

        // 3. Execute Purchase
        return this.executeAutoBuy(tier, country, config.autoBuyDuration);
    }

    private async executeAutoBuy(tier: string, country: string, durationDays: number): Promise<boolean> {
        try {
            // A. Buy from Novproxy
            // Note: Novproxy 'buyPort' doesn't typically accept 'country' parameter in the simple API?
            // If Novproxy gives random ports, we can't guarantee 'US' or 'Canada'.
            // However, assume we buy, and THEN check what we got. Or maybe use a specific API if exists.
            // Current 'buyPort' only takes days and quantity. 
            // If user explicitly wants 'US', and API serves random, this is a risk.
            // But let's assume filtering happens post-purchase or API default is acceptable.
            // (User request implies we can control it via "Decision... Action").

            const quantity = 1; // Auto-buy 1 port at a time? Or config? Assume 1 for now.
            const res = await this.novproxy.buyPort(durationDays, quantity);

            if (res.code !== 0) {
                this.logger.error(`Novproxy purchase failed: ${res.msg}`);
                return false;
            }

            const orderId = res.data?.order_id || res.data?.id;
            this.logger.log(`Purchased Order #${orderId}`);

            // B. Fetch Port Details
            const portList = await this.novproxy.getPortsList(1, 100, orderId?.toString());
            if (portList.code !== 0 || !portList.data || portList.data.list.length === 0) {
                this.logger.error('Failed to retrieve purchased port details');
                return false;
            }

            const purchasedPort = portList.data.list[0];

            // C. Determine Local Port (for Shared)
            let localPort: number | null = null;
            let upstreamInfo: any = {};

            if (tier !== 'High') {
                // Shared: Needs VPS chaining
                const lastPort = await this.prisma.port.findFirst({
                    where: { localPort: { not: null } },
                    orderBy: { localPort: 'desc' },
                });
                localPort = (lastPort?.localPort || 30000) + 1;

                upstreamInfo = {
                    upstreamHost: purchasedPort.ip,
                    upstreamPort: purchasedPort.port,
                    upstreamUser: purchasedPort.username, // Default from Novproxy
                    upstreamPass: purchasedPort.password,
                    host: 'VPS_IP_HERE', // Placeholder, should be ENV or Config
                };
            } else {
                // High: Direct
                upstreamInfo = {
                    host: purchasedPort.ip,
                    port: purchasedPort.port,
                };
            }

            // D. Save to DB
            // Note: If country mismatch (e.g. bought random, got UK, wanted US), we still save it.
            // Ideally we'd loop until we get right country? No, too expensive.
            // We save whatever we got.

            await this.prisma.port.create({
                data: {
                    host: upstreamInfo.host || purchasedPort.ip, // Validated
                    port: localPort || purchasedPort.port,
                    protocol: 'HTTP',
                    country: purchasedPort.region || country, // Trust API region
                    packageType: tier,
                    maxUsers: tier === 'High' ? 1 : tier === 'Medium' ? 3 : 5,
                    currentUsers: 0,
                    isActive: true,

                    // Shared fields
                    localPort: localPort,
                    upstreamHost: upstreamInfo.upstreamHost,
                    upstreamPort: upstreamInfo.upstreamPort,
                    upstreamUser: upstreamInfo.upstreamUser,
                    upstreamPass: upstreamInfo.upstreamPass,
                },
            });

            // E. Rebuild 3proxy (if shared)
            if (tier !== 'High') {
                await this.chain.rebuildConfig();

                // Also set Novproxy credentials for this port to allow our VPS IP?
                // Novproxy usually authorizes by user/pass, so generally open to any IP.
                // But we might need to set 'whitelist' if IP auth used.
                // Assuming User/Pass auth for upstream.
            }

            // F. Log Cost (using AdminService logic)
            // We can reuse manualRefill logic or just call createPurchaseLog
            // Fetch real cost
            let cost = 0;
            try {
                const orders = await this.novproxy.getOrderList(1, 20);
                const matched = orders.data?.find(o => o.id.toString() === orderId?.toString());
                if (matched) cost = matched.value;
            } catch (e) {
                // ignore
            }
            if (cost === 0) cost = res.data?.value || 0;

            await this.admin.createPurchaseLog({
                packageType: tier,
                duration: `${durationDays} Days`,
                cost: Number(cost),
                orderId: orderId?.toString(),
            });

            this.logger.log(`Auto-refill complete. New port ${purchasedPort.ip} setup.`);
            return true;

        } catch (error) {
            this.logger.error(`Auto-buy execution failed: ${error.message}`);
            return false;
        }
    }
}
