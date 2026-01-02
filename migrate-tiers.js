const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const result = await prisma.port.updateMany({
        where: { packageType: 'Normal' },
        data: { maxUsers: 3 }
    });
    console.log(`Updated ${result.count} Normal ports to 3 users limit.`);

    const configs = await prisma.packageConfig.updateMany({
        where: { name: 'Normal' },
        data: { maxUsers: 3 }
    });
    console.log(`Updated Normal package config to 3 users.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
