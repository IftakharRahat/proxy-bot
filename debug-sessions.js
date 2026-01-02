const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const port = await prisma.port.findFirst({
        where: { upstreamPort: 4281 }
    });

    if (!port) {
        console.log('Port not found');
        return;
    }

    console.log('--- PORT INFO ---');
    console.log(JSON.stringify(port, null, 2));

    const sessions = await prisma.proxySession.findMany({
        where: { portId: port.id },
        include: { user: true }
    });

    console.log('\n--- ALL SESSIONS (ANY STATUS) ---');
    console.log(JSON.stringify(sessions, null, 2));
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
