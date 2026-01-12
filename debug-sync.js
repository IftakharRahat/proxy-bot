const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();
const FormData = require('form-data');

// Load env vars
require('dotenv').config();

async function debugSync() {
    try {
        console.log('--- STARTING DEBUG SYNC ---');

        // 1. Fetch DB Ports
        const dbPorts = await prisma.port.findMany();
        console.log(`\nDB has ${dbPorts.length} ports:`);
        dbPorts.forEach(p => console.log(` - ID: ${p.id} (Local: ${p.localPort})`));

        // 2. Fetch Novproxy Ports manually
        const apiKey = process.env.NOVPROXY_API_KEY;
        const form = new FormData();
        form.append('key', apiKey);
        form.append('page', '1');
        form.append('page_size', '100');

        console.log('\nFetching Novproxy ports...');
        const res = await axios.post('https://api.novproxy.com/port/get_list', form, {
            headers: form.getHeaders()
        });

        if (res.data.code !== 0) {
            console.error('Novproxy API Error:', res.data);
            return;
        }

        const apiPorts = res.data.data.list;
        console.log(`\nNovproxy API returned ${apiPorts.length} ports:`);
        apiPorts.forEach(p => console.log(` - ID: ${p.id} (IP: ${p.ip}:${p.port})`));

        // 3. Compare
        const apiIds = new Set(apiPorts.map(p => p.id));
        const expired = dbPorts.filter(p => !apiIds.has(p.id));

        console.log(`\n--- ANALYSIS ---`);
        if (expired.length === 0) {
            console.log('✅ NO expired ports found! All DB ports exist in API response.');
            console.log('If you see a port in Admin Panel that shouldn\'t be there, check if it matches one of the API IDs above.');
        } else {
            console.log(`❌ Found ${expired.length} EXPIRED ports (In DB but not in API):`);
            expired.forEach(p => console.log(` - DELETE CANDIDATE: ID ${p.id} (Local: ${p.localPort})`));
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

debugSync();
