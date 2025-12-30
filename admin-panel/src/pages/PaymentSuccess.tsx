import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { useSearchParams } from 'react-router-dom';

export const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying payment details...');

    useEffect(() => {
        const invoiceId = searchParams.get('invoice_id');
        if (invoiceId) {
            verifyPayment(invoiceId);
        } else {
            // If no invoice_id, assume simple success message (or webhook handled it)
            setStatus('success');
            setMessage('Your balance has been updated. You can now close this window.');
        }
    }, [searchParams]);

    const verifyPayment = async (invoiceId: string) => {
        try {
            await api.post('/payment/uddoktapay/verify-invoice', { invoice_id: invoiceId });
            setStatus('success');
            setMessage('Payment verified! Your balance has been updated.');
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage('Verification failed, but don\'t worry! If money was deducted, it will be added shortly via webhook.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4">
            <div className="glass-card p-8 rounded-3xl border border-white/5 max-w-md w-full text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full" />

                <div className="flex justify-center mb-6">
                    {status === 'verifying' && (
                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                            <Loader2 className="text-blue-400 w-10 h-10 animate-spin" />
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                            <CheckCircle className="text-emerald-400 w-10 h-10" />
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                            <XCircle className="text-red-400 w-10 h-10" />
                        </div>
                    )}
                </div>

                <h1 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2">
                    {status === 'verifying' ? 'Verifying Payment...' : status === 'success' ? 'Payment Successful!' : 'Check Status'}
                </h1>

                <p className="text-slate-400 font-medium text-sm mb-8">
                    {message}
                </p>

                <button
                    onClick={() => window.close()}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all border border-white/5 hover:border-white/10"
                >
                    Close Window
                </button>
            </div>
        </div>
    );
};
