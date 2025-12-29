"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const novproxy_service_1 = require("../novproxy/novproxy.service");
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_1.Logger('SeedPorts');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    try {
        const novproxy = app.get(novproxy_service_1.NovproxyService);
        const prisma = app.get(prisma_service_1.PrismaService);
        logger.log('Fetching ports from Novproxy...');
        const response = await novproxy.getPortsList(1, 100);
        if (response.code !== 0 || !response.data?.list) {
            logger.error('Failed to fetch ports', response);
            return;
        }
        const ports = response.data.list;
        logger.log(`Found ${ports.length} ports. Syncing to database...`);
        for (const port of ports) {
            await prisma.port.upsert({
                where: { id: port.id },
                create: {
                    id: port.id,
                    host: port.ip,
                    port: port.port,
                    country: port.region || 'Unknown',
                    protocol: 'HTTP',
                    maxUsers: 50,
                    isActive: true,
                },
                update: {
                    host: port.ip,
                    port: port.port,
                    country: port.region,
                    isActive: true,
                },
            });
        }
        logger.log('Ports synced successfully!');
    }
    catch (error) {
        logger.error('Error syncing ports', error);
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=seed-ports.js.map