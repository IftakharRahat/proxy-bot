"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
async function testProxy() {
    const proxyConfig = {
        protocol: 'http',
        host: '107.150.109.40',
        port: 4126,
        auth: {
            username: 'user1_p7570_y4g32ofj',
            password: 'pass_mjms4gza_y4g32ofj',
        },
    };
    console.log('Testing proxy:', `${proxyConfig.host}:${proxyConfig.port}`);
    try {
        console.log('Fetching http://ip-api.com/json ...');
        const response = await axios_1.default.get('http://ip-api.com/json', {
            proxy: proxyConfig,
            timeout: 10000,
        });
        console.log('\n✅ Proxy Verification Successful!');
        console.log('returned IP:', response.data.query);
        console.log('Full Response:', response.data);
    }
    catch (error) {
        console.error('\n❌ Proxy Test Failed');
        console.error('Error:', error.message);
        if (axios_1.default.isAxiosError(error)) {
            console.error('Code:', error.code);
            console.error('Response:', error.response?.data);
        }
    }
}
testProxy();
//# sourceMappingURL=verify-proxy.js.map