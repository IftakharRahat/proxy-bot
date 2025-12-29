import axios from 'axios';

async function testProxy() {
    const proxyConfig = {
        protocol: 'http', // or 'https'
        host: '107.150.109.40',
        port: 4126,
        auth: {
            username: 'user1_p7570_y4g32ofj',
            password: 'pass_mjms4gza_y4g32ofj', // Extracted from your screenshot
        },
    };

    console.log('Testing proxy:', `${proxyConfig.host}:${proxyConfig.port}`);

    try {
        // 1. Test against http site
        console.log('Fetching http://ip-api.com/json ...');
        const response = await axios.get('http://ip-api.com/json', {
            proxy: proxyConfig,
            timeout: 10000,
        });

        console.log('\n✅ Proxy Verification Successful!');
        console.log('returned IP:', response.data.query);
        console.log('Full Response:', response.data);

    } catch (error) {
        console.error('\n❌ Proxy Test Failed');
        console.error('Error:', error.message);
        if (axios.isAxiosError(error)) {
            console.error('Code:', error.code);
            console.error('Response:', error.response?.data);
        }
    }
}

testProxy();
