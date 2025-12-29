import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const adminUsername = 'admin';
    const adminPassword = 'adminpassword'; // Change this in production
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const existingAdmin = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
    });

    if (!existingAdmin) {
        console.log('Seeding default admin user...');
        await prisma.user.create({
            data: {
                telegramId: 'admin_placeholder', // Placeholder since it's required and unique
                username: adminUsername,
                // password: hashedPassword, // User model doesn't have password yet!
                role: UserRole.ADMIN,
            },
        });
        console.log('Admin seeded. Note: User model needs password field!');
    } else {
        console.log('Admin already exists.');
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
