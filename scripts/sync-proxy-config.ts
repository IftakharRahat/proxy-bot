import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function syncProxyConfig() {
    console.log('🔄 Fetching active sessions from database...');

    const sessions = await prisma.proxySession.findMany({
        where: { status: 'ACTIVE' },
        include: {
            port: true,
            user: { select: { username: true } }
        }
    });

    console.log(`📊 Found ${sessions.length} active sessions`);

    // Group sessions by port for proper config generation
    const portSessions = new Map<number, typeof sessions>();
    sessions.forEach(s => {
        const key = s.port.localPort || s.port.port;
        if (!portSessions.has(key)) {
            portSessions.set(key, []);
        }
        portSessions.get(key)!.push(s);
    });

    // Build 3proxy config
    let config = `# 3proxy Auto-Generated Config
# Generated: ${new Date().toISOString()}
# Active Sessions: ${sessions.length}

nserver 8.8.8.8
nserver 1.1.1.1
nscache 65536
timeouts 1 5 30 60 180 1800 15 60
log /var/log/3proxy/3proxy.log D
logformat "- +_L%t.%. %N.%p %E %U %C:%c %O %I %R %r"

`;

    // Build user list for all sessions
    const allUsers = ['test:CL:test'];
    sessions.forEach(s => {
        allUsers.push(`${s.proxyUser}:CL:${s.proxyPass}`);
    });
    config += `users ${allUsers.join(' ')}\n\n`;

    // Global auth
    config += `auth strong\n`;

    // Allow list
    const allowList = ['test', ...sessions.map(s => s.proxyUser)];
    config += `allow ${allowList.join(' ')}\n\n`;

    // Generate port blocks
    portSessions.forEach((portSessions, localPort) => {
        const port = portSessions[0].port;

        config += `# Port ${localPort} - ${port.country || 'Unknown'}\n`;
        config += `parent 1000 http ${port.upstreamHost} ${port.upstreamPort} ${port.upstreamUser || ''} ${port.upstreamPass || ''}\n`;
        config += `proxy -p${localPort}\n`;
        config += `socks -p${localPort + 5000}\n\n`;
    });

    // Write config
    const configPath = process.env.PROXY_CONFIG_PATH || '/etc/3proxy/3proxy.cfg';
    fs.writeFileSync(configPath, config);
    console.log(`✅ Config written to ${configPath}`);

    // Reload 3proxy
    try {
        execSync('killall -9 3proxy || true', { stdio: 'inherit' });
        execSync('systemctl restart 3proxy', { stdio: 'inherit' });
        console.log('✅ 3proxy restarted successfully');
    } catch (err) {
        console.error('⚠️ Failed to restart 3proxy:', err);
    }

    // Show summary
    console.log('\n📋 Active Credentials:');
    sessions.forEach(s => {
        console.log(`   Port ${s.port.localPort || s.port.port}: ${s.proxyUser} / ${s.proxyPass} (@${s.user?.username || 'unknown'})`);
    });

    await prisma.$disconnect();
}

syncProxyConfig().catch(console.error);
