const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function debugAuth() {
    try {
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
        const pass = session.proxyPass;
        const host = session.port.host;

        console.log('📋 Session Info:');
        console.log(`   User: ${user}`);
        console.log(`   Pass: ${pass}`);
        console.log(`   SOCKS5 Port: ${socksPort}`);
        console.log('');

        // Read config
        const configPath = '/etc/3proxy/3proxy.cfg';
        const config = fs.readFileSync(configPath, 'utf-8');

        // Find SOCKS5 section
        const lines = config.split('\n');
        let socksSectionStart = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(`PORT ${socksPort}`) || lines[i].includes(`-p${socksPort}`)) {
                socksSectionStart = Math.max(0, i - 3);
                break;
            }
        }

        if (socksSectionStart >= 0) {
            console.log('🔍 SOCKS5 Config Section:');
            console.log('---');
            for (let i = socksSectionStart; i < Math.min(lines.length, socksSectionStart + 15); i++) {
                console.log(`${i + 1}: ${lines[i]}`);
            }
            console.log('---');
        }

        console.log('');
        console.log('🔍 Checking 3proxy logs for auth errors:');
        try {
            const logs = execSync('tail -50 /var/log/3proxy.log 2>/dev/null || tail -50 /tmp/3proxy.log 2>/dev/null || echo "No logs found"', { encoding: 'utf-8' });
            const logLines = logs.split('\n').filter(l => 
                l.includes('auth') || 
                l.includes('35060') || 
                l.includes(user) ||
                l.includes('SOCKS') ||
                l.includes('fail')
            );
            if (logLines.length > 0) {
                console.log('Relevant log entries:');
                logLines.slice(-10).forEach(l => console.log(`   ${l}`));
            } else {
                console.log('   No relevant log entries found');
            }
        } catch (e) {
            console.log(`   Could not read logs: ${e.message}`);
        }

        console.log('');
        console.log('🧪 Testing with verbose curl:');
        try {
            execSync(
                `curl -v --max-time 5 --socks5 ${user}:${pass}@${host}:${socksPort} http://api.ipify.org 2>&1 | head -30`,
                { encoding: 'utf-8', stdio: 'inherit' }
            );
        } catch (err) {
            // Error is expected, we just want to see the output
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

debugAuth();
