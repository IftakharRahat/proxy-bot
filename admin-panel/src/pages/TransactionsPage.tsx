import React, { useEffect, useState } from 'react';
import client from '../api/client';
import type { Transaction } from '../api/client';
import clsx from 'clsx';
import {
    ArrowsRightLeftIcon,
    ArrowDownLeftIcon
} from '@heroicons/react/24/outline';

export const TransactionsPage: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await client.get('/admin/transactions');
            setTransactions(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-white">Loading transactions...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight mb-2">Transactions</h1>
                <p className="text-slate-400">View all deposit and manual fund history.</p>
            </div>

            {/* Transactions Table */}
            <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gateway</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trx ID</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transactions.map((trx) => (
                                <tr key={trx.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-slate-400 font-mono text-xs">#{trx.id}</td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-white font-medium text-sm">
                                                {trx.user?.username || `User ${trx.userId}`}
                                            </span>
                                            <span className="text-slate-500 text-xs font-mono">
                                                ID: {trx.user?.telegramId}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {trx.gateway === 'MANUAL' ? (
                                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                    <ArrowsRightLeftIcon className="w-4 h-4" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                    <ArrowDownLeftIcon className="w-4 h-4" />
                                                </div>
                                            )}
                                            <span className="text-slate-300 text-sm font-medium">
                                                {trx.gateway === 'MANUAL' ? 'Adjustment' : 'Deposit'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-white font-bold font-mono">
                                        ৳{Number(trx.amount).toFixed(2)}
                                    </td>
                                    <td className="p-4 text-slate-400 text-sm">{trx.gateway}</td>
                                    <td className="p-4 text-slate-500 font-mono text-xs">{trx.trxId}</td>
                                    <td className="p-4">
                                        <span className={clsx(
                                            "px-2 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wide",
                                            trx.status === 'COMPLETED' ? "bg-emerald-500/20 text-emerald-400" :
                                                trx.status === 'PENDING' ? "bg-amber-500/20 text-amber-400" :
                                                    "bg-red-500/20 text-red-400"
                                        )}>
                                            {trx.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-500 text-xs">
                                        {new Date(trx.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-500">
                                        No transactions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
