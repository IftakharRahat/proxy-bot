const axios = require('axios');

const proxies = [
    "107.150.109.40:4301:UguzLVQZLaME:bMjKp863dvHh",
    "45.43.58.27:4001:user0p7710geheqhm0:passmjymvivggeheqhm0",
    "107.150.109.40:4281:user0p7710geheqhm0:passmjymvivggeheqhm0",
    "45.43.58.27:4162:user0p7710geheqhm0:passmjymvivggeheqhm0",
    "45.43.58.27:4455:user0p7710geheqhm0:passmjymvivggeheqhm0",
    "45.43.58.27:4411:user0p7710geheqhm0:passmjymvivggeheqhm0",
    "107.150.109.40:4200:user0p7710geheqhm0:passmjymvivggeheqhm0"
];

async function checkProxy(proxyStr, index) {
    const [host, port, user, pass] = proxyStr.split(':');

    // Config for Axios to use this specific proxy
    const config = {
        proxy: {
            protocol: 'http',
            host: host,
            port: parseInt(port),
            auth: {
                username: user,
                password: pass
            }
        },
        timeout: 10000 // 10 second timeout
    };

    console.log(`[${index + 1}/7] Testing ${host}:${port}...`);

    try {
        const start = Date.now();
        // Request IP check service
        const response = await axios.get('http://httpbin.org/ip', config);
        const duration = Date.now() - start;

        console.log(`   ✅ Success (${duration}ms)`);
        console.log(`      Result IP: ${response.data.origin}`);
    } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        if (error.response) {
            console.log(`      Status: ${error.response.status}`);
        }
    }
    console.log('------------------------------------------------');
}

async function run() {
    console.log("Starting Direct Upstream Connectivity Test...\n");
    for (let i = 0; i < proxies.length; i++) {
        await checkProxy(proxies[i], i);
    }
}

run();
