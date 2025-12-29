import { ConfigService } from '@nestjs/config';
export declare class UddoktaPayService {
    private configService;
    private readonly logger;
    private readonly baseUrl;
    private readonly apiKey;
    constructor(configService: ConfigService);
    createCharge(amount: number, fullName: string, email: string, metadata: any): Promise<{
        payment_url: any;
        invoice_id: any;
    }>;
    verifyPayment(invoiceId: string): Promise<any>;
}
