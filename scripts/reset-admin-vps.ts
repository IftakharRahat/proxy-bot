
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
    console.log('--- Admin User Debug Info ---');

    // 1. Find the admin user
    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    });

    if (!admin) {
        console.error('❌ ERROR: No ADMIN user found in database!');
        return;
    }

    console.log(`✅ Found Admin User:`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Username: '${admin.username}'`);
    console.log(`   Current Hash: ${(admin.password || '').substring(0, 10)}...`);

    // 2. Force reset password
    const newPassword = 'Sumit@399180';
    console.log(`\n🔄 Resetting password to: '${newPassword}'...`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: admin.id },
        data: { password: hashedPassword }
    });

    console.log('✅ Password updated successfully!');
    console.log('👉 Try logging in with:');
    console.log(`   Username: ${admin.username}`);
    console.log(`   Password: ${newPassword}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
