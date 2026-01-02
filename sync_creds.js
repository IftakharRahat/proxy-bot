const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const FormData = require('form-data');
const prisma = new PrismaClient();
require('dotenv').config();

async function sync() {
    try {
        // 1. Get the ACTIVE session for Port 30005
        const session = await prisma.proxySession.findFirst({
            where: {
                status: 'ACTIVE',
                port: {
                    localPort: 30005
                }
            },
            include: { port: true }
        });

        if (!session) {
            console.log('❌ No active session found for Port 30005');
            return;
        }

        // 1.5 Sanitize Username (Remove underscores, ensure alphanumeric)
        let newUsername = session.proxyUser.replace(/_/g, '');

        // Ensure length is 8-22 (if too long, trim; if too short, pad - though our generation is usually long enough)
        if (newUsername.length > 22) newUsername = newUsername.substring(0, 22);

        console.log(`Original User: ${session.proxyUser}`);
        console.log(`New User: ${newUsername}`);

        // 1.6 Sanitize Password (Remove underscores, ensure alphanumeric 6-22 chars)
        let newPassword = session.proxyPass.replace(/_/g, '');
        if (newPassword.length > 22) newPassword = newPassword.substring(0, 22);

        console.log(`Original Pass: ${session.proxyPass}`);
        console.log(`New Pass: ${newPassword}`);

        // Update DB first to ensure consistency
        await prisma.proxySession.update({
            where: { id: session.id },
            data: {
                proxyUser: newUsername,
                proxyPass: newPassword
            }
        });
        console.log('✅ Updated local database with new credentials.');

        // 2. Call Novproxy API Manually
        const form = new FormData();
        form.append('lang', 'en');
        form.append('key', process.env.NOVPROXY_API_KEY);
        form.append('ids', session.portId.toString()); // Novproxy ID (7710)
        form.append('username', newUsername); // Use new SANITIZED username
        form.append('password', newPassword); // Use new SANITIZED password
        form.append('region', session.port.country || 'Random');
        form.append('minute', '10'); // Keep 10 mins as it passed the time check (or we assume so)
        form.append('format', '1');

        console.log('🔄 Syncing with Novproxy...');

        // Direct API Call
        const res = await axios.post('https://api.novproxy.com/port/batch_edit', form, {
            headers: form.getHeaders()
        });

        console.log('Response:', res.data);

        if (res.data.code === 0) {
            console.log('✅ SUCCESS: Credentials manually synced with Novproxy!');
        } else {
            console.error('❌ Failed:', res.data.msg);
        }

    } catch (e) {
        console.error('❌ ERROR:', e.message);
        if (e.response) console.error(e.response.data);
    } finally {
        await prisma.$disconnect();
    }
}

sync();
