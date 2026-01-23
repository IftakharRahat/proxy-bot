const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function testProxies() {
    try {
        const session = await prisma.proxySession.findFirst({
            where: { status: 'ACTIVE' },
            include: { port: true }
        });

        if (!session) {
            console.log('❌ No active sessions found');
            return;
        }

        const httpPort = session.port.localPort || session.port.port;
        const socksPort = httpPort + 5000 + (session.id % 1000);
        const host = session.port.host;
        const user = session.proxyUser;
        const pass = session.proxyPass;

        console.log('📋 Session Details:');
        console.log(`   User: ${user}`);
        console.log(`   Host: ${host}`);
        console.log(`   HTTP Port: ${httpPort}`);
        console.log(`   SOCKS5 Port (per-user): ${socksPort}`);
        console.log('');

        // Test HTTP
        console.log('🔍 Testing HTTP Proxy...');
        try {
            const httpResult = execSync(
                `curl -s --max-time 10 -x http://${user}:${pass}@${host}:${httpPort} http://api.ipify.org`,
                { encoding: 'utf-8', stdio: 'pipe' }
            );
            console.log(`✅ HTTP OK: ${httpResult.trim()}`);
        } catch (err) {
            console.log(`❌ HTTP FAILED: ${err.message}`);
        }

        console.log('');

        // Test SOCKS5
        console.log('🔍 Testing SOCKS5 Proxy (Per-User Port)...');
        try {
            const socksResult = execSync(
                `curl -s --max-time 10 --socks5 ${user}:${pass}@${host}:${socksPort} http://api.ipify.org`,
                { encoding: 'utf-8', stdio: 'pipe' }
            );
            console.log(`✅ SOCKS5 OK: ${socksResult.trim()}`);
        } catch (err) {
            console.log(`❌ SOCKS5 FAILED: ${err.message}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testProxies();
