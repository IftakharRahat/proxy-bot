const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
    try {
        const ports = await prisma.port.findMany({
            where: {
                localPort: { gte: 30012, lte: 30014 }
            },
            orderBy: { localPort: 'asc' }
        });

        console.log('--- Port Audit ---');
        for (const p of ports) {
            console.log(`Port: ${p.localPort} | ID: ${p.id} | Type: ${p.packageType} | Upstream: ${p.upstreamHost}:${p.upstreamPort}`);
        }
        console.log('------------------');

    } catch (e) {
        console.error('❌ ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

audit();
