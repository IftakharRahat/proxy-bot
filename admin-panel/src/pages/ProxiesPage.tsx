import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Globe, RefreshCw, Zap, Clock, ShieldCheck, Database, LayoutGrid, List } from 'lucide-react';
import clsx from 'clsx';

export const ProxiesPage = () => {
    const [proxies, setProxies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const fetchProxies = async () => {
        try {
            const res = await api.get('/admin/proxies');
            setProxies(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch proxies', err);
        }
    };

    useEffect(() => {
        fetchProxies();
    }, []);

    const handleChangeCountry = async (id: number) => {
        const country = prompt('Enter new country code (US or Canada):', 'US');
        if (!country) return;

        try {
            await api.patch(`/admin/proxies/${id}/change-country`, { newCountry: country }); // Changed from post to patch and added body
            alert('Country change initiated successfully. New IP will be assigned.');
            fetchProxies();
        } catch (err) {
            alert('Failed to change country. Ensure ports are available.');
        }
    };

    const handleRotate = async (id: number) => {
        try {
            await api.post(`/admin/proxies/${id}/rotate`);
            alert('Rotation successful');
            fetchProxies();
        } catch (err) {
            alert('Failed to rotate proxy');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
                <p className="text-slate-400 font-bold animate-pulse">Scanning Global Node Network...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Database className="text-blue-500" size={32} />
                        Active Proxy Cluster
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium italic text-sm">Monitoring real-time traffic routing and node geographical distribution.</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={clsx("p-2 rounded-xl transition-all", viewMode === 'grid' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-white")}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={clsx("p-2 rounded-xl transition-all", viewMode === 'list' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-white")}
                    >
                        <List size={18} />
                    </button>
                </div>
            </header>

            {proxies.length === 0 ? (
                <div className="glass-card rounded-[3rem] p-20 border border-white/5 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 rounded-[2rem] bg-white/[0.02] border border-white/10 flex items-center justify-center mb-8 relative group">
                        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Database size={40} className="text-slate-700 relative z-10" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3 italic">No Active Nodes Detected</h2>
                    <p className="text-slate-500 max-w-md font-medium text-sm leading-relaxed">
                        The global cluster is currently idle. Once proxies are purchased via the Telegram bot or manually procured, they will appear here in real-time.
                    </p>
                    <div className="mt-8 flex gap-4">
                        <div className="h-px w-12 bg-blue-500/30 self-center" />
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">System Standby</span>
                        <div className="h-px w-12 bg-blue-500/30 self-center" />
                    </div>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {proxies.map((proxy) => (
                        <div key={proxy.id} className="glass-card rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all duration-500">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600/10 blur-2xl group-hover:bg-blue-600/20 transition-all" />

                            <div className="relative z-10 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-inner">
                                            <Globe size={20} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Geographical Node</p>
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border",
                                                    proxy.port?.packageType === 'High' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                                                        proxy.port?.packageType === 'Medium' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                                                            "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                )}>
                                                    {proxy.port?.packageType}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-black text-white uppercase tracking-tight">{proxy.port?.country || 'Global'}</h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                        <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">
                                            {proxy.port?.currentUsers || 0} Connected
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center bg-blue-500/5 p-2 rounded-xl border border-blue-500/10">
                                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">HTTP Port</span>
                                                <p className="text-xs font-mono text-white font-bold">{proxy.port?.host}:{proxy.port?.port}</p>
                                            </div>
                                            <div className="flex justify-between items-center bg-purple-500/5 p-2 rounded-xl border border-purple-500/10">
                                                <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">SOCKS5 Port</span>
                                                <p className="text-xs font-mono text-white font-bold">{proxy.port?.host}:{(proxy.port?.port || 0) + 5000}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Database size={12} className="text-emerald-400" />
                                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Source Substrate (Amit's Panel)</p>
                                                </div>
                                                <div className="px-2 py-0.5 bg-emerald-500/20 rounded text-[8px] font-black text-emerald-300 border border-emerald-500/30">
                                                    VERIFIED LINK
                                                </div>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-xs font-mono text-white font-bold">
                                                    {proxy.port?.upstreamHost || 'System Relay'}
                                                </p>
                                                <p className="text-[10px] font-mono text-emerald-400 font-bold">
                                                    PORT: {proxy.port?.upstreamPort || 'AUTO'}
                                                </p>
                                            </div>
                                            <p className="text-[9px] text-emerald-500/60 font-medium mt-1 uppercase tracking-tight">
                                                {proxy.port?.upstreamHost ? 'Connected to Residential Provider' : 'Direct connection or legacy node'}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <Zap size={12} className="text-blue-400" />
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Cluster</p>
                                                </div>
                                                <div className="flex flex-wrap gap-1 max-h-[40px] overflow-y-auto">
                                                    {proxy.port?.sessions?.length > 1 ? (
                                                        proxy.port.sessions.map((s: any, i: number) => (
                                                            <span key={i} className="text-[8px] font-bold text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/10">
                                                                @{s.user?.username || 'user'}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[9px] text-slate-600 font-bold italic">Dedicated to you</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Expiration</p>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={12} className="text-slate-500" />
                                                    <p className="text-xs font-bold text-slate-300">{new Date(proxy.expiresAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => handleChangeCountry(proxy.id)}
                                        className="w-full flex items-center justify-between px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-xs font-black text-slate-200 uppercase tracking-widest transition-all group/btn"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Globe size={14} className="text-blue-400 group-hover/btn:rotate-12 transition-transform" />
                                            Migrate Node
                                        </div>
                                        <Zap size={14} className="text-slate-600 group-hover/btn:text-amber-400" />
                                    </button>
                                    <button
                                        onClick={() => handleRotate(proxy.id)}
                                        className="w-full flex items-center justify-between px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl text-xs font-black text-white uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        <div className="flex items-center gap-2">
                                            <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
                                            Rotate Protocol
                                        </div>
                                        <ShieldCheck size={14} className="text-blue-200" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                <th className="px-8 py-5">Node Context</th>
                                <th className="px-8 py-5">Endpoints (HTTP / SOCKS5)</th>
                                <th className="px-8 py-5">Package Tier</th>
                                <th className="px-8 py-5">Substrate Link</th>
                                <th className="px-8 py-5">Lease Term</th>
                                <th className="px-8 py-5 text-center">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {proxies.map((proxy) => (
                                <tr key={proxy.id} className="hover:bg-white/[0.01] transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-white/5">
                                                <Globe size={16} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white uppercase tracking-tight">{proxy.port?.country || 'Global'}</p>
                                                <p className="text-[10px] text-slate-500 font-black tracking-widest">SECURE_TUNNEL_01</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-mono text-blue-400 font-bold">HTTP: {proxy.port?.host}:{proxy.port?.port}</span>
                                            <span className="text-[10px] font-mono text-purple-400 font-bold">SOCKS5: {proxy.port?.host}:{(proxy.port?.port || 0) + 5000}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={clsx(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                            proxy.port?.packageType === 'High' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                                                proxy.port?.packageType === 'Medium' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                                                    "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                        )}>
                                            {proxy.port?.packageType}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg font-mono text-[11px] text-emerald-400 font-bold inline-block">
                                            {proxy.port?.upstreamHost || proxy.port?.host}:{proxy.port?.upstreamPort || proxy.port?.port}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-mono text-slate-400 italic">
                                        @{proxy.user?.username || 'system_service'}
                                    </td>
                                    <td className="px-8 py-6 font-bold text-slate-300 text-sm">
                                        {new Date(proxy.expiresAt).toLocaleString()}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => handleChangeCountry(proxy.id)}
                                                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-blue-400 transition-all"
                                                title="Migrate Node"
                                            >
                                                <Globe size={16} />
                                            </button>
                                            <span className="text-xs font-mono text-slate-500">
                                                {proxy.port?.currentUsers || 0} Conns
                                            </span>
                                            <button
                                                onClick={() => handleRotate(proxy.id)}
                                                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-500/20"
                                                title="Rotate Protocol"
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
};
