import { Controller, Get, Patch, Body, Post, Param, UseGuards, Query, Delete } from '@nestjs/common';
import { AdminService } from './admin.service';
import { HealthService } from './health.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly healthService: HealthService,
    ) { }

    @Get('health')
    async getHealth() {
        return this.healthService.getSystemHealth();
    }

    @Get('stats')
    async getStats() {
        return this.adminService.getDashboardStats();
    }

    @Get('users')
    async getUsers() {
        return this.adminService.getAllUsers();
    }

    @Patch('users/:id/balance')
    async adjustUserBalance(
        @Param('id') id: string,
        @Body() body: { amount: number; operation: 'add' | 'subtract'; reason?: string }
    ) {
        return this.adminService.adjustUserBalance(parseInt(id, 10), body.amount, body.operation, body.reason);
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
        @Body() body: { maxUsers?: number; autoBuyEnabled?: boolean; autoBuyDuration?: number },
    ) {
        return this.adminService.updatePackageConfig(name, body);
    }

    @Get('purchases')
    async getPurchases() {
        return this.adminService.getPurchaseLogs();
    }

    @Post('refill')
    async refill(@Body() body: { packageType: string; duration: string; quantity: number; country?: string; rotation?: number }) {
        return this.adminService.manualRefill(
            body.packageType,
            body.duration,
            body.quantity,
            body.country || 'Random',
            body.rotation || 30
        );
    }

    @Get('estimate')
    async getEstimate(
        @Query('tier') tier: string,
        @Query('duration') duration: string,
        @Query('quantity') quantity: string,
    ) {
        return this.adminService.getProcurementEstimate(tier, duration, parseInt(quantity, 10));
    }

    @Patch('proxies/:id/change-country')
    async changeCountry(@Param('id') id: string, @Body() body: { newCountry: string }) {
        return this.adminService.changeCountry(parseInt(id, 10), body.newCountry);
    }

    @Patch('proxies/:id/change-tier')
    async changeTier(@Param('id') id: string, @Body() body: { newTier: string }) {
        return this.adminService.changePortTier(parseInt(id, 10), body.newTier);
    }

    @Get('transactions')
    async getTransactions() {
        return this.adminService.getAllTransactions();
    }

    @Post('sync-inventory')
    async syncInventory(@Body() body: { packageType?: string } = {}) {
        return this.adminService.syncProviderInventory(body?.packageType || 'Normal');
    }

    @Get('preview-provider')
    async previewProvider() {
        return this.adminService.previewProviderPorts();
    }

    @Post('import-ports')
    async importPorts(@Body() body: { portIds: number[]; packageType: string }) {
        return this.adminService.importSelectedPorts(body.portIds, body.packageType);
    }

    @Post('sync-config')
    async syncConfig() {
        return this.adminService.syncProxyConfig();
    }

    // ========== BOT PRICING ENDPOINTS ==========

    @Get('bot-pricing')
    async getBotPricing() {
        return this.adminService.getBotPricing();
    }

    @Patch('bot-pricing')
    async updateBotPricing(@Body() body: { prices: { tier: string; duration: string; price: number }[] }) {
        return this.adminService.updateAllBotPricing(body.prices);
    }

    // ========== BALANCE PRESETS (BOT BUTTONS) ==========

    @Get('balance-presets')
    async getBalancePresets() {
        return this.adminService.getBalancePresets();
    }

    @Post('balance-presets')
    async addBalancePreset(@Body() body: { amount: number }) {
        return this.adminService.addBalancePreset(body.amount);
    }

    @Delete('balance-presets/:id')
    async deleteBalancePreset(@Param('id') id: string) {
        return this.adminService.deleteBalancePreset(parseInt(id, 10));
    }
}
