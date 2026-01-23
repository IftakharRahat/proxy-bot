import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as util from 'util';

const execAsync = util.promisify(exec);

@Injectable()
export class ProxyChainService implements OnModuleInit {
    private readonly logger = new Logger(ProxyChainService.name);
    private readonly configPath: string;
    private readonly reloadCommand: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {
        this.configPath =
            this.configService.get<string>('PROXY_CONFIG_PATH') ??
            '/etc/3proxy/3proxy.cfg';

        // Hard restart is safer than reload for 3proxy
        this.reloadCommand =
            this.configService.get<string>('PROXY_RELOAD_COMMAND') ??
            'systemctl restart 3proxy';
    }

    async onModuleInit() {
        this.logger.log('ProxyChainService initialized. Building config...');
        await this.rebuildConfig();
    }

    /**
     * Build 3proxy config from DB state
     * - Global users declared once
     * - No flush
     * - Per-port allow lists
     */
    async rebuildConfig() {
        this.logger.log('Rebuilding 3proxy config (GLOBAL USERS, NO FLUSH, MONITOR ENABLED)');

        const ports = await this.prisma.port.findMany({
            where: {
                isActive: true,
                host: { not: '' },
            },
            include: {
                sessions: {
                    where: { status: 'ACTIVE' },
                },
            },
        });

        /* ─────────────────────────────────────────────
           1️⃣ GLOBAL USER REGISTRY (DECLARED ONCE)
        ───────────────────────────────────────────── */

        const globalUsers = new Map<string, string>();

        // Diagnostic user
        globalUsers.set('test', 'test');

        for (const port of ports) {
            for (const s of port.sessions) {
                globalUsers.set(s.proxyUser, s.proxyPass);
            }
        }

        const usersLines = [...globalUsers.entries()]
            .map(([u, p]) => `users ${u}:CL:${p}`)
            .join('\n');

        /* ───────────── 3️⃣ CONFIG CONSTRUCTION ───────────── */
        let config = `
daemon
maxconn 500
monitor ${this.configPath}

log /var/log/3proxy.log D
logformat "L%t.%. %N.%p %E %U %C:%c %R:%r %O %I %h %T"

nserver 1.1.1.1
nserver 8.8.8.8
nscache 65536
timeouts 1 5 30 60 180 1800 15 60

${usersLines}

# ===== DIAGNOSTIC PORT =====
auth strong
flush
allow test 0.0.0.0/0
proxy -p30000
`;

        /* ───────────── PER PORT SERVICES ───────────── */
        for (const port of ports) {
            if (!port.localPort || !port.upstreamHost || !port.upstreamPort) continue;

            const allowedUsers = ['test', ...port.sessions.map(s => s.proxyUser)];
            const sharedSocksPort = port.localPort + 5000;

            const allowLines = allowedUsers.map(u => `allow ${u} 0.0.0.0/0`).join('\n');
            
            // Support both HTTP and SOCKS5 upstream protocols
            const upstreamProtocol = port.protocol === 'SOCKS5' ? 'socks' : 'http';
            const parentHTTP = port.upstreamUser
                ? `parent 1000 ${upstreamProtocol} ${port.upstreamHost} ${port.upstreamPort} ${port.upstreamUser} ${port.upstreamPass}`
                : `parent 1000 ${upstreamProtocol} ${port.upstreamHost} ${port.upstreamPort}`;
            const parentSOCKS = port.upstreamUser
                ? `parent 1000 ${upstreamProtocol} ${port.upstreamHost} ${port.upstreamPort} ${port.upstreamUser} ${port.upstreamPass}`
                : `parent 1000 ${upstreamProtocol} ${port.upstreamHost} ${port.upstreamPort}`;

            // Bandwidth Limiting (Traffic Shaping in bits per second)
            let bandlim = '';
            const type = port.packageType.toLowerCase();
            if (type === 'normal') {
                bandlim = 'bandlimin 1000000 *\nbandlimout 1000000 *\n';
            } else if (type === 'medium') {
                bandlim = 'bandlimin 3000000 *\nbandlimout 3000000 *\n';
            }
            // 'high' (Premium) gets no bandlim -> Unlimited speed

            // HTTP Proxy (Shared - all users can use)
            config += `
# ===== PORT ${port.localPort} (${port.country ?? 'N/A'}) - HTTP (${port.packageType}) =====
auth strong
flush
${allowLines}
${bandlim}${parentHTTP}
proxy -p${port.localPort}
`;

            // SOCKS5 Proxy - PER USER PORTS for individual bandwidth control
            // Each user gets their own SOCKS5 port for proper authentication and bandwidth limiting
            for (const session of port.sessions) {
                // Generate consistent port: basePort + 5000 + (session.id % 1000)
                // This ensures same user always gets same port and stays within reasonable range
                const userSocksPort = port.localPort + 5000 + (session.id % 1000);
                
                // SOCKS5 per-user port - try auth without 'strong' for SOCKS5
                config += `
# ===== PORT ${userSocksPort} - SOCKS5 for ${session.proxyUser} (${port.country ?? 'N/A'}, ${port.packageType}) =====
allow ${session.proxyUser} 0.0.0.0/0
auth
${bandlim}${parentSOCKS}
socks -p${userSocksPort}
`;
            }

            // Also create a shared SOCKS5 port for test user and backward compatibility
            config += `
# ===== PORT ${sharedSocksPort} - SOCKS5 Shared (${port.country ?? 'N/A'}, ${port.packageType}) =====
auth strong
flush
allow test 0.0.0.0/0
${bandlim}${parentSOCKS}
socks -p${sharedSocksPort}
`;
        }

        config += `\ndeny *\n`;

        /* ───────────── 4️⃣ WRITE & NOTIFY ───────────── */
        try {
            if (process.platform !== 'win32') {
                // Ensure Linux-style line endings (LF) to prevent 407 auth errors
                const finalConfig = config.trim().replace(/\r\n/g, '\n') + '\n';
                await fs.promises.writeFile(this.configPath, finalConfig);
                this.logger.log('3proxy config written successfully (Isolated Services + LF Endings)');

                // 2️⃣ APPLY CONFIG (System Restart)
                try {
                    await execAsync(this.reloadCommand);
                    this.logger.log(`3proxy service restarted successfully: ${this.reloadCommand}`);
                } catch (execErr) {
                    this.logger.error(`Failed to restart 3proxy: ${execErr.message}`);
                    this.logger.warn(`Please manually run: ${this.reloadCommand}`);
                }
            } else {
                this.logger.warn('Windows detected: config generation only (dry run)');
            }
        } catch (err) {
            this.logger.error('3proxy rebuild failed', err.stack);
        }
    }
}
