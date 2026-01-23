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
            const isHigh = session.port.packageType === 'High';
            const httpPort = isHigh ? (session.port.upstreamPort || session.port.port) : (session.port.localPort || session.port.port);
            const socksPort = isHigh ? (session.port.upstreamPort || session.port.port) : ((session.port.localPort || session.port.port) + 5000);
            const host = isHigh ? (session.port.upstreamHost || session.port.host) : session.port.host;
            const user = session.proxyUser;
            const pass = session.proxyPass;
            const protocol = session.port.protocol || 'HTTP';

            console.log(`\n🔹 ${session.port.packageType} Tier - ${session.port.country} (Protocol: ${protocol})`);
            console.log(`   User: ${user}`);
            console.log(`   Host: ${host}`);
            console.log(`   HTTP Port: ${httpPort}`);
            console.log(`   SOCKS5 Port: ${socksPort}`);
            if (isHigh) {
                console.log(`   ⚠️  High Tier: Direct connection to NovProxy`);
            }

            // Test HTTP
            console.log(`   🔍 Testing HTTP (Upstream Protocol: ${protocol})...`);
            try {
                const httpResult = execSync(
                    `curl -s --max-time 10 -x http://${user}:${pass}@${host}:${httpPort} http://api.ipify.org`,
                    { encoding: 'utf-8', stdio: 'pipe' }
                );
                const ip = httpResult.trim();
                if (ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
                    console.log(`   ✅ HTTP OK: IP = ${ip}`);
                } else {
                    console.log(`   ⚠️  HTTP Response: ${ip.substring(0, 50)}`);
                }
            } catch (err) {
                const errorMsg = err.message || err.stderr?.toString() || 'Unknown error';
                console.log(`   ❌ HTTP FAILED: ${errorMsg.split('\n')[0].substring(0, 100)}`);
            }

            // Test SOCKS5 (only for shared ports or if upstream supports SOCKS5)
            if (!isHigh || protocol === 'SOCKS5') {
                console.log(`   🔍 Testing SOCKS5...`);
                try {
                    const socksResult = execSync(
                        `curl -s --max-time 10 --socks5 ${user}:${pass}@${host}:${socksPort} http://api.ipify.org`,
                        { encoding: 'utf-8', stdio: 'pipe' }
                    );
                    const ip = socksResult.trim();
                    if (ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
                        console.log(`   ✅ SOCKS5 OK: IP = ${ip}`);
                    } else if (socksResult.includes('auth fail') || socksResult.includes('Authentication failed')) {
                        console.log(`   ❌ SOCKS5 FAILED: Authentication failed`);
                    } else {
                        console.log(`   ⚠️  SOCKS5 Response: ${ip.substring(0, 50)}`);
                    }
                } catch (err) {
                    const errorMsg = err.message || err.stderr?.toString() || 'Unknown error';
                    if (errorMsg.includes('auth fail') || errorMsg.includes('Authentication failed')) {
                        console.log(`   ❌ SOCKS5 FAILED: Authentication failed`);
                    } else {
                        console.log(`   ❌ SOCKS5 FAILED: ${errorMsg.split('\n')[0].substring(0, 100)}`);
                    }
                }
            } else {
                console.log(`   ⚠️  SOCKS5 test skipped (High tier with HTTP upstream)`);
            }

            console.log('-'.repeat(80));
        }

        console.log('\n📊 Summary:');
        console.log(`   Total Sessions: ${sessions.length}`);
        
        const highTierCount = sessions.filter(s => s.port.packageType === 'High').length;
        const sharedTierCount = sessions.length - highTierCount;
        const httpProtocolCount = sessions.filter(s => s.port.protocol === 'HTTP').length;
        const socks5ProtocolCount = sessions.filter(s => s.port.protocol === 'SOCKS5').length;
        
        console.log(`   High Tier (Direct): ${highTierCount}`);
        console.log(`   Shared Tier (VPS Chain): ${sharedTierCount}`);
        console.log(`   HTTP Protocol: ${httpProtocolCount}`);
        console.log(`   SOCKS5 Protocol: ${socks5ProtocolCount}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testAllPorts();
