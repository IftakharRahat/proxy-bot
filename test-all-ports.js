const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function testAllPorts() {
    try {
        const sessions = await prisma.proxySession.findMany({
            where: { status: 'ACTIVE' },
            include: { port: true },
            orderBy: { createdAt: 'desc' }
        });

        if (sessions.length === 0) {
            console.log('❌ No active sessions found');
            return;
        }

        console.log(`📋 Found ${sessions.length} active sessions\n`);
        console.log('='.repeat(80));

        for (const session of sessions) {
            const httpPort = session.port.localPort || session.port.port;
            const socksPort = httpPort + 5000 + (session.id % 1000);
            const host = session.port.host;
            const user = session.proxyUser;
            const pass = session.proxyPass;

            console.log(`\n🔹 Port ${httpPort} (${session.port.country}) - User: ${user}`);
            console.log(`   HTTP Port: ${httpPort}`);
            console.log(`   SOCKS5 Port: ${socksPort}`);

            // Test HTTP
            console.log(`   Testing HTTP...`);
            try {
                const httpResult = execSync(
                    `curl -s --max-time 5 -x http://${user}:${pass}@${host}:${httpPort} http://api.ipify.org`,
                    { encoding: 'utf-8', stdio: 'pipe' }
                );
                console.log(`   ✅ HTTP OK: ${httpResult.trim()}`);
            } catch (err) {
                console.log(`   ❌ HTTP FAILED: ${err.message.split('\n')[0]}`);
            }

            // Test SOCKS5
            console.log(`   Testing SOCKS5...`);
            try {
                const socksResult = execSync(
                    `curl -s --max-time 5 --socks5 ${user}:${pass}@${host}:${socksPort} http://api.ipify.org`,
                    { encoding: 'utf-8', stdio: 'pipe' }
                );
                if (socksResult.includes('auth fail')) {
                    console.log(`   ❌ SOCKS5 FAILED: auth fail`);
                } else {
                    console.log(`   ✅ SOCKS5 OK: ${socksResult.trim()}`);
                }
            } catch (err) {
                const errorMsg = err.message || err.stderr?.toString() || 'Unknown error';
                if (errorMsg.includes('auth fail')) {
                    console.log(`   ❌ SOCKS5 FAILED: auth fail`);
                } else {
                    console.log(`   ❌ SOCKS5 FAILED: ${errorMsg.split('\n')[0]}`);
                }
            }

            console.log('-'.repeat(80));
        }

        console.log('\n📊 Summary:');
        console.log(`   Total Sessions: ${sessions.length}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testAllPorts();
