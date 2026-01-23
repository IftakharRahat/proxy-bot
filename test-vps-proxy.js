const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function testVpsProxy() {
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
        const vpsHost = session.port.host; // This is the VPS IP
        const user = session.proxyUser;
        const pass = session.proxyPass;
        const protocol = session.port.protocol || 'HTTP';

        console.log('📋 VPS Proxy Test Details:');
        console.log(`   Tier: ${session.port.packageType}`);
        console.log(`   Protocol: ${protocol}`);
        console.log(`   Country: ${session.port.country}`);
        console.log(`   VPS Host: ${vpsHost}`);
        console.log(`   User: ${user}`);
        console.log(`   HTTP Port: ${httpPort}`);
        console.log(`   SOCKS5 Port: ${socksPort}`);
        console.log('');

        // Test HTTP via VPS
        console.log('🔍 Testing HTTP Proxy via VPS...');
        console.log(`   Command: curl -x http://${user}:${pass}@${vpsHost}:${httpPort} http://api.ipify.org`);
        try {
            const httpResult = execSync(
                `curl -s --max-time 15 -x http://${user}:${pass}@${vpsHost}:${httpPort} http://api.ipify.org`,
                { encoding: 'utf-8', stdio: 'pipe' }
            );
            const ip = httpResult.trim();
            if (ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
                console.log(`   ✅ HTTP OK: External IP = ${ip}`);
                
                // Get more details
                try {
                    const details = execSync(
                        `curl -s --max-time 15 -x http://${user}:${pass}@${vpsHost}:${httpPort} http://ip-api.com/json`,
                        { encoding: 'utf-8', stdio: 'pipe' }
                    );
                    const info = JSON.parse(details);
                    console.log(`   📍 Location: ${info.country || 'N/A'}, ${info.city || 'N/A'}`);
                    console.log(`   🌐 ISP: ${info.isp || 'N/A'}`);
                } catch (e) {
                    // Ignore details fetch error
                }
            } else {
                console.log(`   ⚠️  HTTP Response: ${ip.substring(0, 100)}`);
            }
        } catch (err) {
            const errorMsg = err.message || err.stderr?.toString() || 'Unknown error';
            console.log(`   ❌ HTTP FAILED: ${errorMsg.split('\n')[0].substring(0, 150)}`);
        }

        console.log('');

        // Test SOCKS5 via VPS
        if (!isHigh || protocol === 'SOCKS5') {
            console.log('🔍 Testing SOCKS5 Proxy via VPS...');
            console.log(`   Command: curl --socks5 ${user}:${pass}@${vpsHost}:${socksPort} http://api.ipify.org`);
            try {
                const socksResult = execSync(
                    `curl -s --max-time 15 --socks5 ${user}:${pass}@${vpsHost}:${socksPort} http://api.ipify.org`,
                    { encoding: 'utf-8', stdio: 'pipe' }
                );
                const ip = socksResult.trim();
                if (ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
                    console.log(`   ✅ SOCKS5 OK: External IP = ${ip}`);
                    
                    // Get more details
                    try {
                        const details = execSync(
                            `curl -s --max-time 15 --socks5 ${user}:${pass}@${vpsHost}:${socksPort} http://ip-api.com/json`,
                            { encoding: 'utf-8', stdio: 'pipe' }
                        );
                        const info = JSON.parse(details);
                        console.log(`   📍 Location: ${info.country || 'N/A'}, ${info.city || 'N/A'}`);
                        console.log(`   🌐 ISP: ${info.isp || 'N/A'}`);
                    } catch (e) {
                        // Ignore details fetch error
                    }
                } else if (socksResult.includes('auth fail') || socksResult.includes('Authentication failed')) {
                    console.log(`   ❌ SOCKS5 FAILED: Authentication failed`);
                } else {
                    console.log(`   ⚠️  SOCKS5 Response: ${ip.substring(0, 100)}`);
                }
            } catch (err) {
                const errorMsg = err.message || err.stderr?.toString() || 'Unknown error';
                if (errorMsg.includes('auth fail') || errorMsg.includes('Authentication failed')) {
                    console.log(`   ❌ SOCKS5 FAILED: Authentication failed`);
                } else {
                    console.log(`   ❌ SOCKS5 FAILED: ${errorMsg.split('\n')[0].substring(0, 150)}`);
                }
            }
        } else {
            console.log('⚠️  SOCKS5 test skipped (High tier with HTTP upstream)');
        }

        console.log('');
        console.log('📝 Connection Details for VPN Apps:');
        console.log(`   HTTP Proxy: ${vpsHost}:${httpPort}`);
        console.log(`   SOCKS5 Proxy: ${vpsHost}:${socksPort}`);
        console.log(`   Username: ${user}`);
        console.log(`   Password: ${pass}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testVpsProxy();
