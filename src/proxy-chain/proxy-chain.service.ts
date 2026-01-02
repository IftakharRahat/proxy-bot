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

        const usersLine =
            'users ' +
            [...globalUsers.entries()]
                .map(([u, p]) => `${u}:CL:${p}`)
                .join(' ');

        /* ───────────── 3️⃣ CONFIG CONSTRUCTION ───────────── */
        let config = `
daemon
maxconn 2000
monitor ${this.configPath}

log /var/log/3proxy.log D
logformat "L%t.%. %N.%p %E %U %C:%c %R:%r %O %I %h %T"

nserver 1.1.1.1
nserver 8.8.8.8
nscache 65536
timeouts 1 5 30 60 180 1800 15 60

${usersLine}

# ===== DIAGNOSTIC PORT =====
auth strong
allow test 0.0.0.0/0
proxy -p30000
`;

        /* ───────────── PER PORT SERVICES ───────────── */
        for (const port of ports) {
            if (!port.localPort || !port.upstreamHost || !port.upstreamPort) continue;

            const allowedUsers = ['test', ...port.sessions.map(s => s.proxyUser)];
            const socksPort = port.localPort + 5000;

            const parent = port.upstreamUser
                ? `parent 1000 http ${port.upstreamHost} ${port.upstreamPort} ${port.upstreamUser} ${port.upstreamPass}`
                : `parent 1000 http ${port.upstreamHost} ${port.upstreamPort}`;

            config += `
# ===== PORT ${port.localPort} (${port.country ?? 'N/A'}) =====
auth strong
`;
            // One user per 'allow' line (Safe for 3proxy ACL engine)
            for (const u of allowedUsers) {
                config += `allow ${u} 0.0.0.0/0\n`;
            }

            config += `
${parent}
proxy -p${port.localPort}
socks -p${socksPort}
`;
        }

        config += `\ndeny *\n`;

        /* ───────────── 4️⃣ WRITE & NOTIFY ───────────── */
        try {
            if (process.platform !== 'win32') {
                await fs.promises.writeFile(this.configPath, config.trim() + '\n');
                this.logger.log('3proxy config written successfully (Explicit ACL Pattern applied)');
            } else {
                this.logger.warn('Windows detected: config generation only (dry run)');
            }
        } catch (err) {
            this.logger.error('3proxy rebuild failed', err.stack);
        }
    }
}
