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

        const isHigh = session.port.packageType === 'High';
        const httpPort = isHigh ? (session.port.upstreamPort || session.port.port) : (session.port.localPort || session.port.port);
        const socksPort = isHigh ? (session.port.upstreamPort || session.port.port) : ((session.port.localPort || session.port.port) + 5000);
        const host = isHigh ? (session.port.upstreamHost || session.port.host) : session.port.host;
        const user = session.proxyUser;
        const pass = session.proxyPass;
        const protocol = session.port.protocol || 'HTTP';

        console.log('📋 Session Details:');
        console.log(`   Tier: ${session.port.packageType}`);
        console.log(`   Protocol: ${protocol}`);
        console.log(`   Country: ${session.port.country}`);
        console.log(`   User: ${user}`);
        console.log(`   Host: ${host}`);
        console.log(`   HTTP Port: ${httpPort}`);
        console.log(`   SOCKS5 Port: ${socksPort}`);
        if (isHigh) {
            console.log(`   ⚠️  High Tier: Direct connection to NovProxy`);
        }
        console.log('');

        // Test HTTP
        console.log(`🔍 Testing HTTP Proxy (Upstream Protocol: ${protocol})...`);
        try {
            const httpResult = execSync(
                `curl -s --max-time 10 -x http://${user}:${pass}@${host}:${httpPort} http://api.ipify.org`,
                { encoding: 'utf-8', stdio: 'pipe' }
            );
            const ip = httpResult.trim();
            if (ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
                console.log(`✅ HTTP OK: IP = ${ip}`);
            } else {
                console.log(`⚠️  HTTP Response: ${ip.substring(0, 50)}`);
            }
        } catch (err) {
            console.log(`❌ HTTP FAILED: ${err.message.split('\n')[0]}`);
        }

        console.log('');

        // Test SOCKS5 (only for shared ports or if upstream supports SOCKS5)
        if (!isHigh || protocol === 'SOCKS5') {
            console.log('🔍 Testing SOCKS5 Proxy...');
            try {
                const socksResult = execSync(
                    `curl -s --max-time 10 --socks5 ${user}:${pass}@${host}:${socksPort} http://api.ipify.org`,
                    { encoding: 'utf-8', stdio: 'pipe' }
                );
                const ip = socksResult.trim();
                if (ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
                    console.log(`✅ SOCKS5 OK: IP = ${ip}`);
                } else if (socksResult.includes('auth fail') || socksResult.includes('Authentication failed')) {
                    console.log(`❌ SOCKS5 FAILED: Authentication failed`);
                } else {
                    console.log(`⚠️  SOCKS5 Response: ${ip.substring(0, 50)}`);
                }
            } catch (err) {
                const errorMsg = err.message || err.stderr?.toString() || 'Unknown error';
                if (errorMsg.includes('auth fail') || errorMsg.includes('Authentication failed')) {
                    console.log(`❌ SOCKS5 FAILED: Authentication failed`);
                } else {
                    console.log(`❌ SOCKS5 FAILED: ${errorMsg.split('\n')[0]}`);
                }
            }
        } else {
            console.log('⚠️  SOCKS5 test skipped (High tier with HTTP upstream)');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testProxies();
