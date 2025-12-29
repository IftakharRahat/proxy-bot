import { Controller, Get, Patch, Body, Post, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('users')
    async getUsers() {
        return this.adminService.getAllUsers();
    }

    @Get('proxies')
    async getProxies() {
        return this.adminService.getAllProxies();
    }

    @Get('packages')
    async getPackages() {
        return this.adminService.getPackageConfigs();
    }

    @Patch('packages/:name')
    async updatePackage(
        @Param('name') name: string,
        @Body() body: { maxUsers?: number; autoBuyEnabled?: boolean; autoBuyDuration?: string },
    ) {
        return this.adminService.updatePackageConfig(name, body);
    }

    @Get('purchases')
    async getPurchases() {
        return this.adminService.getPurchaseLogs();
    }

    @Post('refill')
    async refill(@Body() body: { packageType: string; duration: string; quantity: number }) {
        return this.adminService.manualRefill(body.packageType, body.duration, body.quantity);
    }

    @Patch('proxies/:id/change-country')
    async changeCountry(@Param('id') id: string, @Body() body: { newCountry: string }) {
        return this.adminService.changeCountry(parseInt(id, 10), body.newCountry);
    }
}
