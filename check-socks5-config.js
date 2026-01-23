const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function checkConfig() {
    try {
        // Get active session
        const session = await prisma.proxySession.findFirst({
            where: { status: 'ACTIVE' },
            include: { port: true }
        });

        if (!session) {
            console.log('❌ No active sessions found');
            return;
        }

        const httpPort = session.port.localPort || session.port.port;
        const socksPort = httpPort + 5000 + (session.id % 1000);
        const user = session.proxyUser;

        console.log('📋 Session Info:');
        console.log(`   User: ${user}`);
        console.log(`   HTTP Port: ${httpPort}`);
        console.log(`   SOCKS5 Port: ${socksPort}`);
        console.log('');

        // Read config file
        const configPath = '/etc/3proxy/3proxy.cfg';
        if (!fs.existsSync(configPath)) {
            console.log(`❌ Config file not found: ${configPath}`);
            return;
        }

        const config = fs.readFileSync(configPath, 'utf-8');

        // Check if user is in global users list
        console.log('🔍 Checking Global Users List:');
        const userLine = config.split('\n').find(line => line.includes(`users ${user}:CL:`));
        if (userLine) {
            console.log(`✅ User found in global users: ${userLine.trim()}`);
        } else {
            console.log(`❌ User NOT found in global users list!`);
        }
        console.log('');

        // Check SOCKS5 port config
        console.log(`🔍 Checking SOCKS5 Port ${socksPort} Config:`);
        const socksSection = config.split('\n').reduce((acc, line, idx, arr) => {
            if (line.includes(`PORT ${socksPort}`) || line.includes(`-p${socksPort}`)) {
                // Find the section starting from a few lines before
                const start = Math.max(0, idx - 5);
                const end = Math.min(arr.length, idx + 10);
                return arr.slice(start, end).join('\n');
            }
            return acc;
        }, '');

        if (socksSection) {
            console.log('Found SOCKS5 section:');
            console.log('---');
            console.log(socksSection);
            console.log('---');
            
            // Check for auth strong
            if (socksSection.includes('auth strong')) {
                console.log('✅ auth strong found');
            } else {
                console.log('❌ auth strong NOT found');
            }

            // Check for allow user
            if (socksSection.includes(`allow ${user}`)) {
                console.log(`✅ allow ${user} found`);
            } else {
                console.log(`❌ allow ${user} NOT found`);
            }

            // Check for socks directive
            if (socksSection.includes(`socks -p${socksPort}`)) {
                console.log(`✅ socks -p${socksPort} found`);
            } else {
                console.log(`❌ socks -p${socksPort} NOT found`);
            }
        } else {
            console.log(`❌ SOCKS5 port ${socksPort} section NOT found in config!`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkConfig();
