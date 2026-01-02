const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const sessions = await prisma.proxySession.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
            user: true,
            port: true
        }
    });

    console.log('\n--- 10 MOST RECENT SESSIONS ---');
    sessions.forEach(s => {
        console.log(`[${s.createdAt.toISOString()}] ID: ${s.id} | User: @${s.user?.username} (${s.user?.telegramId}) | Port: ${s.port?.port} (Local: ${s.port?.localPort}) | Status: ${s.status}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
