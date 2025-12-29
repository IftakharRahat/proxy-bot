import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { History, TrendingDown, Clock, ShieldCheck, ExternalLink, Filter } from 'lucide-react';

interface PurchaseLog {
    id: number;
    timestamp: string;
    packageType: string;
    duration: string;
    cost: number;
    orderId?: string;
    status: string;
}

export const PurchaseHistory: React.FC = () => {
    const [logs, setLogs] = useState<PurchaseLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get('/admin/purchases');
                setLogs(res.data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch logs', err);
            }
        };
        fetchLogs();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-purple-500 rounded-full animate-spin" />
                <p className="text-slate-400 font-bold animate-pulse">Decrypting Audit Logs...</p>
            </div>
        </div>
    );

    const totalSpending = logs.reduce((sum, log) => sum + Number(log.cost), 0);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <header>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <History className="text-purple-500" size={32} />
                        Financial Audit & Cost Logs
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium italic text-sm">Historical record of automated and manual procurement expenses.</p>
                </header>

                <div className="glass-card px-8 py-4 rounded-3xl border border-blue-500/20 glow-blue flex items-center gap-6">
                    <div className="p-3 rounded-2xl bg-blue-500/10">
                        <TrendingDown className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total API Outlay</p>
                        <h2 className="text-2xl font-black text-white italic">
                            ${totalSpending.toFixed(2)}
                        </h2>
                    </div>
                </div>
            </div>

            <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
                <div className="px-8 py-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="text-green-400" size={18} />
                        <span className="font-bold text-slate-200">Verified Transactions</span>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        <Filter size={14} />
                        Filter Logs
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                <th className="px-8 py-5">Timestamp</th>
                                <th className="px-8 py-5">Resource Type</th>
                                <th className="px-8 py-5">Lease</th>
                                <th className="px-8 py-5">Debit Amount</th>
                                <th className="px-8 py-5">Reference ID</th>
                                <th className="px-8 py-5 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-500">
                                            <div className="p-4 rounded-full bg-white/5">
                                                <History size={40} className="opacity-20" />
                                            </div>
                                            <p className="italic font-medium">Clearance required: No historical data detected in current node.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/[0.01] transition-all group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                                    <Clock size={14} className="text-slate-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-200">{new Date(log.timestamp).toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${log.packageType === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                log.packageType === 'Medium' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                }`}>
                                                {log.packageType}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-sm font-bold text-slate-300">{log.duration}</span>
                                        </td>
                                        <td className="px-8 py-5 font-black text-rose-500">
                                            -${Number(log.cost).toFixed(2)}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-slate-500 bg-white/5 px-2 py-1 rounded">
                                                    {log.orderId ? log.orderId.slice(0, 8) + '...' : 'N/A'}
                                                </span>
                                                {log.orderId && <ExternalLink size={12} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-center">
                                                <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_12px_rgba(34,197,94,0.1)]">
                                                    {log.status}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-8 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-slate-500">
                    <p className="text-xs italic font-medium">Showing {logs.length} transactional records found in persistent storage.</p>
                </div>
            </div>
        </div>
    );
};
