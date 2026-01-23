import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { NovproxyService } from '../novproxy/novproxy.service';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const logger = new Logger('SeedPorts');
    const app = await NestFactory.createApplicationContext(AppModule);

    try {
        const novproxy = app.get(NovproxyService);
        const prisma = app.get(PrismaService);

        logger.log('Fetching ports from Novproxy...');
        const response = await novproxy.getPortsList(1, 100); // Fetch first 100

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
                    host: port.ip, // Novproxy 'ip' field is the host
                    port: port.port,
                    country: port.region || 'Unknown', // Map region to country
                    protocol: 'HTTP', // Default to HTTP, assuming standard support
                    maxUsers: 50, // Default capacity
                    isActive: true,
                },
                update: {
                    host: port.ip,
                    port: port.port,
                    country: port.region,
                    // PRESERVE existing isActive status - don't reactivate disabled ports
                    // isActive is not included in update, so it will remain unchanged
                },
            });
        }

        logger.log('Ports synced successfully!');
    } catch (error) {
        logger.error('Error syncing ports', error);
    } finally {
        await app.close();
    }
}

bootstrap();
