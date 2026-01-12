const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();
const FormData = require('form-data');
require('dotenv').config();

async function forceCleanup() {
    try {
        console.log('--- STARTING FORCE CLEANUP ---');
        console.log('1. Fetching DB Ports...');
        const dbPorts = await prisma.port.findMany();
        console.log(`DB has ${dbPorts.length} ports.`);

        console.log('2. Fetching Novproxy API Ports...');
        const apiKey = process.env.NOVPROXY_API_KEY;
        const form = new FormData();
        form.append('key', apiKey);
        form.append('page', '1');
        form.append('page_size', '100');

        const res = await axios.post('https://api.novproxy.com/port/get_list', form, {
            headers: form.getHeaders()
        });

        if (res.data.code !== 0) {
            console.error('Novproxy Error:', res.data);
            return;
        }

        const apiPorts = res.data.data.list;
        const apiIds = new Set(apiPorts.map(p => p.id));
        console.log(`Novproxy returned ${apiPorts.length} ports.`);

        console.log('3. Identifying Expired Ports...');
        const expired = dbPorts.filter(p => !apiIds.has(p.id));

        if (expired.length === 0) {
            console.log('✅ No expired ports found. Database is in sync.');
        } else {
            console.log(`⚠️ Found ${expired.length} expired ports. DELETING NOW...`);

            for (const p of expired) {
                console.log(` - Deleting Port ID: ${p.id} (Local: ${p.localPort})`);

                // Delete sessions first
                const deletedSessions = await prisma.proxySession.deleteMany({
                    where: { portId: p.id }
                });
                console.log(`   Detailed ${deletedSessions.count} sessions.`);

                // Delete port
                await prisma.port.delete({
                    where: { id: p.id }
                });
                console.log(`   Deleted port ${p.id} successfully.`);
            }
            console.log('\n✅ Cleanup Complete! Expired ports removed.');
        }

    } catch (e) {
        console.error('Cleanup Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

forceCleanup();
