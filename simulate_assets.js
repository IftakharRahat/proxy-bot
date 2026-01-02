const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulate() {
    try {
        // Fetch ACTIVE sessions for Port 30005
        const sessions = await prisma.proxySession.findMany({
            where: {
                status: 'ACTIVE',
                port: { localPort: 30005 }
            },
            include: { port: true }
        });

        console.log(`Found ${sessions.length} active sessions for Port 30005.`);

        for (const session of sessions) {
            console.log(`\n--- Simulating My Assets for Session ${session.id} ---`);
            console.log(`DB PackageType: ${session.port.packageType}`);

            // Exact logic from bot-update.service.ts
            const isHigh = session.port.packageType === 'High';
            const displayHost = isHigh ? session.port.upstreamHost : session.port.host;
            const displayPort = isHigh ? session.port.port : (session.port.localPort || session.port.port);
            const displaySocksPort = isHigh ? session.port.port : ((session.port.localPort || session.port.port) + 5000);

            console.log(`isHigh: ${isHigh}`);
            console.log(`Display Host: ${displayHost} (Should be Novproxy if High)`);
            console.log(`Display Port: ${displayPort}`);
            console.log(`Display SOCKS: ${displaySocksPort}`);

            if (isHigh && displayHost === session.port.host) {
                console.log('❌ FAIL: Is High but showing VPS Host!');
            } else if (isHigh && displayHost === session.port.upstreamHost) {
                console.log('✅ PASS: Logic correctly selects Upstream Host.');
            }
        }

    } catch (e) {
        console.error('❌ ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

simulate();
