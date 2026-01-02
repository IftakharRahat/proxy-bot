const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    try {
        // Determine the Port ID for localPort 30004
        const port = await prisma.port.findFirst({
            where: { localPort: 30004 }
        });

        if (!port) {
            console.log('❌ Port 30004 not found');
            return;
        }

        console.log(`Found Port ID ${port.id} (Current Type: ${port.packageType})`);

        // Update to High
        await prisma.port.update({
            where: { id: port.id },
            data: { packageType: 'High' }
        });

        console.log('✅ Port 30004 updated to packageType: HIGH');
        console.log('User should now see Novproxy IP in My Assets.');

    } catch (e) {
        console.error('❌ ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

fix();
