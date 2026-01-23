const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function testVPNConnection() {
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

        console.log('\n╔════════════════════════════════════════════════════════════════╗');
        console.log('║           VPN/PROXY CONNECTION TEST DETAILS                    ║');
        console.log('╚════════════════════════════════════════════════════════════════╝\n');

        console.log('📋 Session Information:');
        console.log(`   Tier: ${session.port.packageType}`);
        console.log(`   Protocol: ${protocol}`);
        console.log(`   Country: ${session.port.country}`);
        console.log(`   Connection Type: ${isHigh ? 'Direct to NovProxy' : 'Via VPS 3proxy Chain'}\n`);

        console.log('🔐 Credentials:');
        console.log(`   Username: ${user}`);
        console.log(`   Password: ${pass}\n`);

        console.log('🌐 Connection Details:\n');
        console.log('   ┌─────────────────────────────────────────────────────────┐');
        console.log('   │ HTTP Proxy Configuration                                │');
        console.log('   ├─────────────────────────────────────────────────────────┤');
        console.log(`   │ Host:     ${host.padEnd(45)}│`);
        console.log(`   │ Port:     ${httpPort.toString().padEnd(45)}│`);
        console.log(`   │ Username: ${user.padEnd(45)}│`);
        console.log(`   │ Password: ${pass.padEnd(45)}│`);
        console.log('   └─────────────────────────────────────────────────────────┘\n');

        console.log('   ┌─────────────────────────────────────────────────────────┐');
        console.log('   │ SOCKS5 Proxy Configuration                               │');
        console.log('   ├─────────────────────────────────────────────────────────┤');
        console.log(`   │ Host:     ${host.padEnd(45)}│`);
        console.log(`   │ Port:     ${socksPort.toString().padEnd(45)}│`);
        console.log(`   │ Username: ${user.padEnd(45)}│`);
        console.log(`   │ Password: ${pass.padEnd(45)}│`);
        console.log('   └─────────────────────────────────────────────────────────┘\n');

        console.log('🧪 Testing HTTP Proxy Connection...\n');
        try {
            const httpResult = execSync(
                `curl -s --max-time 15 -x http://${user}:${pass}@${host}:${httpPort} http://api.ipify.org?format=json`,
                { encoding: 'utf-8', stdio: 'pipe' }
            );
            const httpData = JSON.parse(httpResult.trim());
            console.log(`   ✅ HTTP Proxy: SUCCESS`);
            console.log(`   📍 Your IP: ${httpData.ip}`);
            console.log(`   🌍 Country: ${httpData.country || 'N/A'}`);
            console.log(`   🏙️  City: ${httpData.city || 'N/A'}\n`);
        } catch (err) {
            console.log(`   ❌ HTTP Proxy: FAILED`);
            console.log(`   Error: ${err.message.split('\n')[0]}\n`);
        }

        console.log('🧪 Testing SOCKS5 Proxy Connection...\n');
        try {
            const socksResult = execSync(
                `curl -s --max-time 15 --socks5 ${user}:${pass}@${host}:${socksPort} http://api.ipify.org?format=json`,
                { encoding: 'utf-8', stdio: 'pipe' }
            );
            const socksData = JSON.parse(socksResult.trim());
            console.log(`   ✅ SOCKS5 Proxy: SUCCESS`);
            console.log(`   📍 Your IP: ${socksData.ip}`);
            console.log(`   🌍 Country: ${socksData.country || 'N/A'}`);
            console.log(`   🏙️  City: ${socksData.city || 'N/A'}\n`);
        } catch (err) {
            console.log(`   ❌ SOCKS5 Proxy: FAILED`);
            console.log(`   Error: ${err.message.split('\n')[0]}\n`);
        }

        console.log('╔════════════════════════════════════════════════════════════════╗');
        console.log('║           VPN APP CONFIGURATION GUIDE                        ║');
        console.log('╚════════════════════════════════════════════════════════════════╝\n');

        console.log('📱 For HTTP Proxy Apps (HTTP Proxy, ProxyDroid, etc.):');
        console.log(`   Server: ${host}`);
        console.log(`   Port: ${httpPort}`);
        console.log(`   Username: ${user}`);
        console.log(`   Password: ${pass}\n`);

        console.log('📱 For SOCKS5 Proxy Apps (SOCKS5 Proxy, Shadowsocks, etc.):');
        console.log(`   Server: ${host}`);
        console.log(`   Port: ${socksPort}`);
        console.log(`   Username: ${user}`);
        console.log(`   Password: ${pass}\n`);

        console.log('📱 For VPN Apps that support both:');
        console.log('   Protocol: HTTP or SOCKS5');
        console.log(`   Server: ${host}`);
        console.log(`   HTTP Port: ${httpPort}`);
        console.log(`   SOCKS5 Port: ${socksPort}`);
        console.log(`   Username: ${user}`);
        console.log(`   Password: ${pass}\n`);

        console.log('🔗 Quick Test URLs (use with proxy enabled):');
        console.log('   http://api.ipify.org?format=json');
        console.log('   http://ip-api.com/json');
        console.log('   http://httpbin.org/ip\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testVPNConnection();
