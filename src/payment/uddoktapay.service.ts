import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class UddoktaPayService {
    private readonly logger = new Logger(UddoktaPayService.name);
    private readonly baseUrl: string;
    private readonly apiKey: string;

    constructor(private configService: ConfigService) {
        this.baseUrl = this.configService.get<string>('UDDOKTAPAY_BASE_URL') || '';
        this.apiKey = this.configService.get<string>('UDDOKTAPAY_API_KEY') || '';

        if (!this.baseUrl || !this.apiKey) {
            this.logger.warn('UddoktaPay configuration missing. Payment features will fail.');
        }
    }

    /**
     * Create a payment charge
     * @param amount Amount in BDT
     * @param fullName User's full name (or Telegram Name)
     * @param email User's email (optional, use dummy if needed)
     * @param metadata Custom metadata (userId, etc.)
     */
    async createCharge(amount: number, fullName: string, email: string, metadata: any) {
        try {
            // Backend URL (for callbacks)
            // In production, this must be your actual public domain
            // For local dev, we might need a tunneling service or just manual verification
            const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';

            const payload = {
                full_name: fullName,
                email: email || 'customer@example.com',
                amount: amount,
                metadata: metadata,
                redirect_url: `${appUrl}/payment/uddoktapay/success`,
                cancel_url: `${appUrl}/payment/uddoktapay/cancel`,
                webhook_url: `${appUrl}/payment/uddoktapay/webhook`, // Critical for auto-confirm
            };

            const response = await axios.post(`${this.baseUrl}/api/checkout-v2`, payload, {
                headers: {
                    'RT-UDDOKTAPAY-API-KEY': this.apiKey,
                    'Content-Type': 'application/json',
                },
            });

            if (response.data && response.data.status === true) {
                return {
                    payment_url: response.data.payment_url,
                    invoice_id: response.data.invoice_id
                };
            } else {
                throw new Error(response.data.message || 'Failed to create charge');
            }

        } catch (error) {
            this.logger.error(`Create Charge Failed: ${error.message}`, error.response?.data);
            throw new BadRequestException('Payment initialization failed');
        }
    }

    /**
     * Verify a payment using Invoice ID
     */
    async verifyPayment(invoiceId: string) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/verify-payment`,
                { invoice_id: invoiceId },
                {
                    headers: {
                        'RT-UDDOKTAPAY-API-KEY': this.apiKey,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data; // Should contain status, amount, metadata
        } catch (error) {
            this.logger.error(`Verification Failed: ${error.message}`, error.response?.data);
            throw new BadRequestException('Payment verification failed');
        }
    }
}
