const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const session = await prisma.proxySession.findFirst({
            where: {
                status: 'ACTIVE',
                port: { localPort: 30004 }
            },
            include: { port: true }
        });

        if (session) {
            console.log('--- Session Details (Port 30004) ---');
            console.log('ID:', session.id);
            console.log('User:', session.proxyUser); // To match screenshot
            console.log('Session Host:', session.host);
            console.log('Session Tier (Purchased):', session.packageType); // This field might handle "High" vs "Normal"
            console.log('Port PackageType:', session.port.packageType);
            console.log('Upstream Host:', session.port.upstreamHost);
            console.log('-----------------------');

            if (session.port.packageType === 'High') {
                console.log('INFO: Port IS High. Display should use Upstream Host.');
            } else {
                console.log('INFO: Port is NOT High (' + session.port.packageType + '). Display will use VPS Host.');
            }
        } else {
            console.log('❌ No active session found for Port 30004');
        }

    } catch (e) {
        console.error('❌ ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
