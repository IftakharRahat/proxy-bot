const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const sessions = await prisma.proxySession.findMany({
            where: { status: 'ACTIVE' },
            include: { port: true, user: true }
        });

        console.log('--- Active Sessions Audit ---');
        for (const s of sessions) {
            console.log(`ID: ${s.id} | User: ${s.user.telegramId} | Port: ${s.port.localPort} | Type: ${s.port.packageType}`);
        }
        console.log('-----------------------------');

    } catch (e) {
        console.error('❌ ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
