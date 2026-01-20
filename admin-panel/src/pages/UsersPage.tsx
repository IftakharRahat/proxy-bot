import { useEffect, useState } from 'react';
import { getUsers, adjustUserBalance, api } from '../api/client';
import { User, DollarSign, Shield, Calendar, Terminal, X, Plus, Minus, Package } from 'lucide-react';

interface BalanceModalProps {
    user: any;
    onClose: () => void;
    onSuccess: () => void;
}

const BalanceModal = ({ user, onClose, onSuccess }: BalanceModalProps) => {
    const [amount, setAmount] = useState('');
    const [operation, setOperation] = useState<'add' | 'subtract'>('add');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await adjustUserBalance(user.id, numAmount, operation, reason);
            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError(result.message || 'Operation failed');
            }
        } catch (e: any) {
            setError(e.response?.data?.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="glass-card rounded-3xl p-8 w-full max-w-md border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-white">Adjust Balance</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X className="text-slate-400" size={20} />
                    </button>
                </div>

                <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">User</p>
                    <p className="text-white font-bold">@{user.username || 'unknown'}</p>
                    <p className="text-sm text-slate-400">Current Balance: <span className="text-blue-400 font-bold">৳{user.balance}</span></p>
                </div>

                <div className="space-y-4">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setOperation('add')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${operation === 'add'
                                ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            <Plus size={16} /> Add
                        </button>
                        <button
                            type="button"
                            onClick={() => setOperation('subtract')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${operation === 'subtract'
                                ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            <Minus size={16} /> Subtract
                        </button>
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Amount (৳)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Reason (Optional)</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Bonus, Refund, Correction..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">{error}</p>
                    )}

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${operation === 'add'
                            ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/30'
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                    >
                        {loading ? 'Processing...' : `${operation === 'add' ? 'Add' : 'Subtract'} ৳${amount || '0'}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface AssignPackageModalProps {
    user: any;
    onClose: () => void;
    onSuccess: () => void;
}

const AssignPackageModal = ({ user, onClose, onSuccess }: AssignPackageModalProps) => {
    const [ports, setPorts] = useState<any[]>([]);
    const [selectedPort, setSelectedPort] = useState<number | null>(null);
    const [durationHours, setDurationHours] = useState('24');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPorts = async () => {
            try {
                const res = await api.get('/admin/proxies');
                // Filter ports with available capacity
                const available = res.data.filter((p: any) => p.isActive && p.currentUsers < p.maxUsers);
                setPorts(available);
            } catch (e) {
                console.error('Failed to fetch ports', e);
            }
        };
        fetchPorts();
    }, []);

    const handleSubmit = async () => {
        if (!selectedPort) {
            setError('Please select a port');
            return;
        }
        const hours = parseInt(durationHours);
        if (isNaN(hours) || hours <= 0) {
            setError('Please enter valid duration hours');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await api.post('/admin/assign-package', {
                userId: user.id,
                portId: selectedPort,
                durationHours: hours
            });
            if (res.data.success) {
                alert(res.data.message);
                onSuccess();
                onClose();
            } else {
                setError(res.data.message || 'Assignment failed');
            }
        } catch (e: any) {
            setError(e.response?.data?.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="glass-card rounded-3xl p-8 w-full max-w-md border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-white">Manual Package Assign</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X className="text-slate-400" size={20} />
                    </button>
                </div>

                <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Assigning To</p>
                    <p className="text-white font-bold">@{user.username || 'unknown'}</p>
                    <p className="text-sm text-slate-400">Balance: <span className="text-blue-400 font-bold">৳{user.balance}</span></p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Select Port</label>
                        <select
                            value={selectedPort || ''}
                            onChange={(e) => setSelectedPort(parseInt(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        >
                            <option value="">-- Select a Port --</option>
                            {ports.map(port => (
                                <option key={port.id} value={port.id}>
                                    Port {port.port} ({port.packageType}) - {port.country} [{port.currentUsers}/{port.maxUsers}]
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Duration (Hours)</label>
                        <input
                            type="number"
                            value={durationHours}
                            onChange={(e) => setDurationHours(e.target.value)}
                            placeholder="e.g. 24, 72, 168..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">24h=1day, 72h=3days, 168h=7days, 720h=30days</p>
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">{error}</p>
                    )}

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/30 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                    >
                        {loading ? 'Assigning...' : 'Assign Package'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const UsersPage = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [assignUser, setAssignUser] = useState<any>(null);

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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
                                        <div className="flex justify-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedUser(user)}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 leading-none"
                                            >
                                                <DollarSign size={14} />
                                                Balance
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAssignUser(user)}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 leading-none"
                                            >
                                                <Package size={14} />
                                                Assign
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

            {selectedUser && (
                <BalanceModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onSuccess={fetchUsers}
                />
            )}

            {assignUser && (
                <AssignPackageModal
                    user={assignUser}
                    onClose={() => setAssignUser(null)}
                    onSuccess={fetchUsers}
                />
            )}
        </div>
    );
};
