import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const ports = await prisma.port.findMany({
            where: {
                localPort: { in: [30012, 30013, 30014] }
            }
        });

        console.log('--- DB TRACE ---');
        ports.forEach(p => {
            console.log(`Port: ${p.localPort} | Upstream: ${p.upstreamHost}:${p.upstreamPort} | User: ${p.upstreamUser} | Pass: ${p.upstreamPass}`);
        });
        console.log('----------------');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
