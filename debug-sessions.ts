import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const portId = 4; // Based on localPort 30004 usually matching index or similar
        // Search by upstream port as seen in image
        const ports = await prisma.port.findMany({
            where: { upstreamPort: 4281 }
        });

        console.log('--- PORTS ---');
        console.dir(ports, { depth: null });

        for (const port of ports) {
            const sessions = await prisma.proxySession.findMany({
                where: { portId: port.id },
                include: { user: true }
            });
            console.log(`\n--- SESSIONS FOR PORT ${port.id} ---`);
            console.dir(sessions, { depth: null });
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
