const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const port = await prisma.port.findUnique({
            where: { id: 7710 }
        });

        if (port) {
            console.log('--- Database Record for Port 7710 ---');
            console.log('localPort (VPS):', port.localPort);
            console.log('port (Novproxy Management?):', port.port);
            console.log('upstreamPort (Novproxy Protocol):', port.upstreamPort);
            console.log('packageType:', port.packageType);
            console.log('-----------------------------------');
        } else {
            console.log('❌ Port 7710 not found');
        }

    } catch (e) {
        console.error('❌ ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
