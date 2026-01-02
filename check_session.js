const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const session = await prisma.proxySession.findFirst({
            where: {
                status: 'ACTIVE',
                port: { localPort: 30005 }
            },
            include: { port: true }
        });

        if (session) {
            console.log('--- Session Details ---');
            console.log('ID:', session.id);
            console.log('Session Host:', session.host);
            console.log('Session Tier (Purchased):', session.packageType);
            console.log('Port PackageType:', session.port.packageType);
            console.log('Upstream Host:', session.port.upstreamHost);
            console.log('-----------------------');

            if (session.host !== session.port.upstreamHost && session.port.packageType === 'High') {
                console.log('⚠️ MISMATCH: Port is High but Session Host uses VPS IP.');
            }
        } else {
            console.log('❌ No active session found for Port 30005');
        }

    } catch (e) {
        console.error('❌ ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
