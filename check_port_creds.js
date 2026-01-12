const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const ports = await prisma.port.findMany({
        where: { localPort: { in: [30020, 30021, 30022] } },
        select: {
            id: true,
            localPort: true,
            upstreamHost: true,
            upstreamPort: true,
            upstreamUser: true,
            upstreamPass: true,
            isActive: true
        }
    });

    console.log('=== Port 30020, 30021, 30022 Database Check ===');
    for (const p of ports) {
        console.log(`\nLocal Port: ${p.localPort}`);
        console.log(`  Upstream: ${p.upstreamHost}:${p.upstreamPort}`);
        console.log(`  User: ${p.upstreamUser}`);
        console.log(`  Pass: ${p.upstreamPass}`);
        console.log(`  Active: ${p.isActive}`);
    }

    await prisma.$disconnect();
}

check().catch(console.error);
