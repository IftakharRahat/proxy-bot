import { useState, useEffect } from 'react';
import { Users, Server, BadgeDollarSign, Activity, TrendingUp, ArrowUpRight, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const StatCard = ({ title, value, subtext, icon: Icon, color, glow, loading }: any) => (
    <div className="glass-card p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
        <div className={clsx("absolute -top-10 -right-10 w-32 h-32 opacity-10 blur-2xl transition-opacity group-hover:opacity-20", glow)} />

        <div className="flex items-start justify-between relative z-10">
            <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    {loading ? (
                        <div className="h-8 w-24 bg-white/5 animate-pulse rounded-lg mt-2" />
                    ) : (
                        <h3 className="text-3xl font-black text-white italic tracking-tight">{value}</h3>
                    )}
                    {!loading && subtext.includes('+') && <span className="text-[10px] font-bold text-green-400 flex items-center gap-0.5"><TrendingUp size={10} />{subtext.split(' ')[0]}</span>}
                </div>
            </div>
            <div className={clsx("p-4 rounded-2xl bg-opacity-20 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", color, glow.replace('glow-', 'shadow-'))}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
        </div>
        <p className="text-slate-500 text-[10px] mt-6 font-medium italic border-t border-white/5 pt-4">{subtext}</p>
    </div>
);

export const Dashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [health, setHealth] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [statsRes, healthRes, transRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/health'),
                api.get('/admin/transactions'),
            ]);
            setStats(statsRes.data);
            setHealth(healthRes.data);
            setTransactions(transRes.data.slice(0, 5));
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const healthItems = [
        { key: 'database', label: 'PostgreSQL Substrate' },
        { key: 'redis', label: 'Redis Cache Cluster' },
        { key: 'telegramBot', label: 'Telegram Interface' },
        { key: 'novproxyApi', label: 'Novproxy API Bridge' },
        { key: 'proxyServer', label: '3proxy Service Node' },
    ];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Executive Overview</h1>
                    <p className="text-slate-500 mt-1 font-medium italic text-sm">Real-time heuristics and node performance analytics.</p>
                </div>
                <div className="flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mt-2" />
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest leading-none">Live Data Stream</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                    title="Total Population"
                    value={stats?.totalUsers?.toLocaleString()}
                    subtext="Growth monitored hourly"
                    icon={Users}
                    color="bg-blue-500"
                    glow="glow-blue"
                    loading={loading}
                />
                <StatCard
                    title="Active Node Links"
                    value={stats?.activePorts}
                    subtext="Concurrent relay connections"
                    icon={Server}
                    color="bg-green-500"
                    glow="glow-green"
                    loading={loading}
                />
                <StatCard
                    title="Gross Revenue"
                    value={`৳${stats?.totalRevenue?.toLocaleString()}`}
                    subtext="Total successful deposits"
                    icon={BadgeDollarSign}
                    color="bg-purple-500"
                    glow="glow-purple"
                    loading={loading}
                />
                <StatCard
                    title="Node Integrity"
                    value={stats?.nodeIntegrity || '99.9%'}
                    subtext="Service availability score"
                    icon={Activity}
                    color="bg-orange-500"
                    glow="glow-orange"
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-transparent opacity-30" />
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-white tracking-tight italic">Pulse: Recent Transactions</h3>
                        <a href="/transactions" className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors flex items-center gap-1">
                            View Audit Log <ArrowUpRight size={12} />
                        </a>
                    </div>
                    <div className="space-y-2">
                        {transactions.length > 0 ? transactions.map((t, i) => (
                            <div key={i} className="flex items-center justify-between p-5 hover:bg-white/[0.02] rounded-3xl transition-all group cursor-pointer border border-transparent hover:border-white/5">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                                        <BadgeDollarSign size={20} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-200">{t.type} {t.gateway ? `via ${t.gateway}` : ''}</p>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">User @{t.user?.username || 'system'} • ID: {t.userId}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={clsx("font-black text-lg italic", t.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400')}>
                                        {t.type === 'DEPOSIT' ? '+' : '-'}৳{t.amount}
                                    </span>
                                    <span className="text-[10px] text-slate-600 font-bold uppercase">{t.status}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="p-10 text-center text-slate-500 italic text-sm">No recent throughput detected.</div>
                        )}
                    </div>
                </div>

                <div className="glass-card rounded-[2.5rem] p-10 border border-white/5 relative">
                    <h3 className="text-xl font-black text-white tracking-tight italic mb-8">Node Health Index</h3>
                    <div className="space-y-6">
                        {healthItems.map((item, i) => {
                            const status = health ? health[item.key] : 'Scanning...';
                            const isOptimal = status === 'Optimal';
                            const isOffline = status === 'Offline' || status === 'Degraded';

                            return (
                                <div key={i} className="flex items-center justify-between group">
                                    <span className="text-sm font-bold text-slate-400 group-hover:text-slate-200 transition-colors">{item.label}</span>
                                    <div className="flex items-center gap-2">
                                        <div className={clsx(
                                            "w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px]",
                                            isOptimal ? "bg-green-400 shadow-green-400/50" :
                                                isOffline ? "bg-red-500 shadow-red-500/50" : "bg-blue-400 shadow-blue-400/50"
                                        )} />
                                        <span className={clsx(
                                            "text-[10px] font-black uppercase tracking-widest",
                                            isOptimal ? "text-green-400" :
                                                isOffline ? "text-red-500" : "text-blue-400"
                                        )}>{status}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12 bg-white/[0.03] rounded-3xl p-6 border border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Link Integrity</span>
                            <span className="text-xs font-black text-white">{stats?.nodeIntegrity || '0%'}</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000"
                                style={{ width: stats?.nodeIntegrity || '0%' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Sync Config Card - Separate to ensure clickability */}
                <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 flex flex-col items-center justify-center text-center">
                    <div className="p-4 rounded-full bg-blue-500/10 text-blue-400 mb-4">
                        <RefreshCw size={24} />
                    </div>
                    <h3 className="text-lg font-black text-white mb-2">System Synchronization</h3>
                    <p className="text-xs text-slate-500 mb-6">Force update proxy configurations if credentials mismatch.</p>

                    <button
                        onClick={async () => {
                            const toastId = toast.loading('Syncing proxy config...');
                            try {
                                const res = await api.post('/admin/sync-config');
                                console.log('Sync response:', res);
                                toast.success('3proxy configuration synced successfully!', { id: toastId });
                            } catch (err: any) {
                                console.error('Sync failed:', err);
                                toast.error(`Failed: ${err.message || 'Unknown error'}`, { id: toastId });
                            }
                        }}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-xs font-black text-white uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                        Sync Now
                    </button>
                </div>
            </div>
        </div>
    );
};
