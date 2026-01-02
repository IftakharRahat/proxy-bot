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

        console.log(`Found Session ID ${session.id} for Port ${session.port.id} (30005)`);
        console.log(`User: ${session.proxyUser}`);
        console.log(`Pass: ${session.proxyPass}`);

        // 2. Call Novproxy API Manually
        const form = new FormData();
        form.append('lang', 'en');
        form.append('key', process.env.NOVPROXY_API_KEY);
        form.append('ids', session.portId.toString()); // Novproxy ID (7710)
        form.append('username', session.proxyUser);
        form.append('password', session.proxyPass);
        form.append('region', session.port.country || 'Random');
        form.append('minute', '1440'); // Try 24 hours (1440 mins) or whatever the port supports
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
