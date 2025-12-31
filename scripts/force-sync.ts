
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AdminService } from '../src/admin/admin.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const adminService = app.get(AdminService);
    const logger = new Logger('ForceSyncScript');

    logger.log('Starting Force Sync of Provider Inventory...');

    try {
        const result = await adminService.syncProviderInventory();
        logger.log('Sync Complete!');
        logger.log(`Synced: ${result.synced}`);
        logger.log(`New Added: ${result.newPorts}`);
    } catch (error) {
        logger.error('Sync Failed', error);
    }

    await app.close();
}

bootstrap();
