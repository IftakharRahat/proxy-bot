const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function expire() {
    try {
        console.log('⏳ Expiring session 5 and resetting port 8213 (30006)...');

        // Expire session 5
        await prisma.proxySession.update({
            where: { id: 5 },
            data: { status: 'EXPIRED' }
        });

        // Reset Port 8213 (30006)
        await prisma.port.update({
            where: { id: 8213 },
            data: {
                currentUsers: 0,
                packageType: 'Normal'
            }
        });

        console.log('✅ SUCCESS: Session 5 expired. Port 30006 is now free.');
    } catch (e) {
        console.error('❌ ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

expire();
