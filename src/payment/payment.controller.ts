import { Controller, Post, Get, Body, Param, UseGuards, Logger } from '@nestjs/common';
import { PaymentService, PaymentGateway } from './payment.service';
import { UddoktaPayService } from './uddoktapay.service';

// DTO for payment submission
class SubmitPaymentDto {
    userId: number;
    amount: number;
    gateway: PaymentGateway;
    trxId: string;
}

// DTO for admin verification
class VerifyPaymentDto {
    transactionId: number;
}

@Controller('payment')
export class PaymentController {
    private readonly logger = new Logger(PaymentController.name);

    constructor(
        private paymentService: PaymentService,
        private uddoktaPayService: UddoktaPayService
    ) { }

    /**
     * User submits a payment transaction
     */
    @Post('submit')
    async submitPayment(@Body() dto: SubmitPaymentDto) {
        const transaction = await this.paymentService.createTransaction(
            dto.userId,
            dto.amount,
            dto.gateway,
            dto.trxId,
        );

        return {
            success: true,
            message: 'Payment submitted for verification',
            transactionId: transaction.id,
        };
    }

    /**
     * Get pending transactions (admin)
     */
    @Get('pending')
    async getPendingTransactions() {
        const transactions = await this.paymentService.getPendingTransactions();
        return { success: true, transactions };
    }

    /**
     * Verify/approve a transaction (admin)
     */
    @Post('verify/:id')
    async verifyPayment(@Param('id') id: string) {
        await this.paymentService.verifyTransaction(parseInt(id, 10));
        return { success: true, message: 'Payment verified and balance credited' };
    }

    /**
     * Reject a transaction (admin)
     */
    @Post('reject/:id')
    async rejectPayment(@Param('id') id: string, @Body() body: { reason?: string }) {
        await this.paymentService.rejectTransaction(parseInt(id, 10), body.reason);
        return { success: true, message: 'Payment rejected' };
    }

    /**
     * Webhook endpoint for payment gateway callbacks
     * This will be customized based on specific gateway requirements
     */
    @Post('webhook/:gateway')
    async handleWebhook(@Param('gateway') gateway: string, @Body() payload: any) {
        this.logger.log(`Webhook received from ${gateway}:`, JSON.stringify(payload));

        // Gateway-specific processing would go here
        // For now, just acknowledge receipt
        return { success: true, received: true };
    }

    /**
     * Initialize UddoktaPay payment
     */
    @Post('uddoktapay/init')
    async initUddoktaPayPayment(@Body() body: { userId: number; amount: number; fullName: string; email: string }) {
        return this.uddoktaPayService.createCharge(
            body.amount,
            body.fullName,
            body.email,
            { userId: body.userId }
        );
    }

    /**
     * Webhook endpoint for UddoktaPay IPN
     */
    @Post('uddoktapay/webhook')
    async handleUddoktaPayWebhook(@Body() payload: any) {
        // payload generally contains { status: 'COMPLETED', invoice_id: '...', metadata: { userId: ... }, amount: ... }
        this.logger.log(`UddoktaPay Webhook: ${JSON.stringify(payload)}`);

        // Verify secret if provided in headers (skipped for now as headers not passed in decorator)

        if (payload.status === 'COMPLETED') {
            // Check if transaction already processed
            // Note: In a real app, use the 'transaction_id' from payload as unique identifier
            const trxId = payload.transaction_id || payload.invoice_id;

            try {
                // We create a completed transaction directly
                // PaymentGateway.NAGAD is used as placeholder, we might want to dynamically set it based on 'payment_method' if available
                await this.paymentService.createTransaction(
                    payload.metadata.userId,
                    Number(payload.amount),
                    PaymentGateway.BKASH, // Defaulting to one, ideally map payload.payment_method
                    trxId
                );

                // Then verify it immediately to credit balance
                // Find it first (createTransaction returns it)
                const trx = await this.paymentService.getUserTransactions(payload.metadata.userId);
                const recentTrx = trx.find(t => t.trxId === trxId);

                if (recentTrx) {
                    await this.paymentService.verifyTransaction(recentTrx.id);
                }

            } catch (e) {
                if (e.message !== 'Transaction ID already exists') {
                    this.logger.error(`Failed to process webhook: ${e.message}`);
                } else {
                    this.logger.log('Transaction already processed (idempotency check)');
                }
            }
        }

        return { status: 'ok' };
    }

    /**
     * Success Callback (User redirected here after payment)
     */
    @Get('uddoktapay/success')
    async uddoktaPaySuccess(@Body() body: any) {
        return "Payment Successful! You can close this window and check your bot balance.";
    }

    /**
     * Cancel Callback
     */
    @Get('uddoktapay/cancel')
    async uddoktaPayCancel() {
        return "Payment Cancelled.";
    }

    /**
     * Get user transaction history
     */
    @Get('history/:userId')
    async getUserHistory(@Param('userId') userId: string) {
        const transactions = await this.paymentService.getUserTransactions(parseInt(userId, 10));
        return { success: true, transactions };
    }
}
