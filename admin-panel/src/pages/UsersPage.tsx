import { useEffect, useState } from 'react';
import { getUsers } from '../api/client';
import { User, DollarSign, Shield, Calendar, Terminal } from 'lucide-react';

export const UsersPage = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await getUsers();
                setUsers(data);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
                <p className="text-slate-400 font-bold animate-pulse">Syncing User Registry...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <User className="text-blue-500" size={32} />
                    User Directory & Custodianship
                </h1>
                <p className="text-slate-500 mt-1 font-medium italic text-sm">Manage user identities, balances, and terminal access credentials.</p>
            </header>

            <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
                <div className="px-8 py-6 bg-white/[0.02] border-b border-white/5 flex items-center gap-3">
                    <Terminal className="text-blue-400" size={18} />
                    <span className="font-bold text-slate-200 uppercase tracking-widest text-xs">Node Population Registry</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                <th className="px-8 py-5">Global ID</th>
                                <th className="px-8 py-5">Identity Hash</th>
                                <th className="px-8 py-5">Codename</th>
                                <th className="px-8 py-5">Substrate Balance</th>
                                <th className="px-8 py-5">Deployment Date</th>
                                <th className="px-8 py-5 text-center">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/[0.01] transition-all group">
                                    <td className="px-8 py-6">
                                        <span className="text-sm font-black text-slate-500 tabular-nums">#{user.id.toString().padStart(4, '0')}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <Shield size={14} className="text-blue-500/50" />
                                            <span className="text-xs font-mono text-slate-300 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                                {user.telegramId}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/5 shadow-inner">
                                                <User size={18} className="text-blue-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">@{user.username || 'unknown_node'}</span>
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active User</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-1">
                                            <span className="text-lg font-black text-white italic">৳{user.balance}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar size={14} />
                                            <span className="text-xs font-bold">{new Date(user.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center">
                                            <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 leading-none">
                                                <DollarSign size={14} />
                                                Inject Fund
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-8 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-slate-500">
                    <p className="text-xs italic font-medium">Total registered nodes: {users.length}</p>
                </div>
            </div>
        </div>
    );
};
