const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
    try {
        const session = await prisma.proxySession.findFirst({
            where: { id: 6 },
            include: { port: true }
        });

        if (session) {
            console.log('--- Display Logic Debug (Session 6) ---');
            console.log('Port PackageType:', session.port.packageType);
            console.log('Port Host:', session.port.host);
            console.log('Port Port (p.port):', session.port.port);
            console.log('Port LocalPort:', session.port.localPort);
            console.log('Port UpstreamHost:', session.port.upstreamHost);
            console.log('Port UpstreamPort:', session.port.upstreamPort);

            const isHigh = session.port.packageType === 'High';
            const displayHost = isHigh ? session.port.upstreamHost : session.port.host;
            const displayPort = isHigh ? (session.port.upstreamPort || session.port.port) : (session.port.localPort || session.port.port);

            console.log('--- Results ---');
            console.log('isHigh:', isHigh);
            console.log('Calculated Display Host:', displayHost);
            console.log('Calculated Display Port:', displayPort);
            console.log('---------------------------------------');
        } else {
            console.log('❌ Session 6 not found');
        }

    } catch (e) {
        console.error('❌ ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
