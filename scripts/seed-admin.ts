import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const adminUsername = 'admin';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminTelegramId = 'admin_placeholder';

    console.log('Seeding admin user...');

    // Upsert using the UNIQUE field: telegramId
    const user = await prisma.user.upsert({
        where: { telegramId: adminTelegramId },
        update: {
            username: adminUsername,
            password: hashedPassword,
            role: UserRole.ADMIN,
        },
        create: {
            telegramId: adminTelegramId,
            username: adminUsername,
            password: hashedPassword,
            role: UserRole.ADMIN,
        },
    });

    console.log(`Admin user successfully seeded/updated.`);
    console.log(`Username: ${adminUsername}`);
    console.log(`Password: ${adminPassword}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
