import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Searching for ports with country "Random"...');

    const result = await prisma.port.updateMany({
        where: {
            country: 'Random',
        },
        data: {
            country: 'US',
        },
    });

    console.log(`✅ Success! Updated ${result.count} ports to "US".`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
