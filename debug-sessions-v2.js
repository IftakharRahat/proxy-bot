const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const port = await prisma.port.findFirst({
        where: { localPort: 30004 }
    });

    if (!port) {
        console.log('Port 30004 not found');
        return;
    }

    console.log('PORT INFO:', { id: port.id, currentUsers: port.currentUsers, maxUsers: port.maxUsers });

    const sessions = await prisma.proxySession.findMany({
        where: { portId: port.id },
        include: { user: true }
    });

    console.log('\n--- ALL SESSIONS FOR PORT 30004 ---');
    sessions.forEach(s => {
        console.log(`ID: ${s.id} | User: @${s.user?.username} (${s.user?.telegramId}) | Status: ${s.status} | Expires: ${s.expiresAt}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
