import { CheckCircle } from 'lucide-react';

export const PaymentSuccess = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4">
            <div className="glass-card p-8 rounded-3xl border border-emerald-500/20 max-w-md w-full text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full" />

                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                        <CheckCircle className="text-emerald-400 w-10 h-10" />
                    </div>
                </div>

                <h1 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2">
                    Payment Successful!
                </h1>

                <p className="text-slate-400 font-medium text-sm mb-8">
                    Your balance has been updated. You can now close this window and return to the bot.
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
