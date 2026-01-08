const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
    try {
        const ports = await prisma.port.findMany({
            where: { localPort: { in: [30012, 30013, 30014, 30015] } },
            orderBy: { localPort: 'asc' }
        });
        console.log('--- DATABASE PORTS AUDIT ---');
        ports.forEach(p => {
            console.log(`LocalPort: ${p.localPort} | ID: ${p.id} | Active: ${p.isActive} | Upstream: ${p.upstreamHost}:${p.upstreamPort}`);
        });
        console.log('---------------------------');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

audit();
