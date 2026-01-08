const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const ports = await prisma.port.findMany({
        where: { localPort: { in: [30012, 30013, 30014] } }
    });
    console.log(JSON.stringify(ports, null, 2));
    await prisma.$disconnect();
}
check();
