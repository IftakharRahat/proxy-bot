import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Settings, Zap, Shield, Save, Package, RefreshCcw } from 'lucide-react';

interface PackageConfig {
    name: string;
    maxUsers: number;
    autoBuyEnabled: boolean;
    autoBuyDuration: string;
}

export const InventorySettings: React.FC = () => {
    const [configs, setConfigs] = useState<PackageConfig[]>([]);
    const [loading, setLoading] = useState(true);

    // Manual Refill state
    const [refillPkg, setRefillPkg] = useState('Normal');
    const [refillDuration, setRefillDuration] = useState('1 Day');
    const [refillQty, setRefillQty] = useState(1);
    const [refillLoading, setRefillLoading] = useState(false);

    const fetchConfigs = async () => {
        try {
            const res = await api.get('/admin/packages');
            setConfigs(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch configs', err);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const handleUpdateConfig = async (name: string, data: Partial<PackageConfig>) => {
        try {
            await api.patch(`/admin/packages/${name}`, data);
            alert(`${name} updated successfully!`);
            fetchConfigs();
        } catch (err) {
            alert('Update failed');
        }
    };

    const handleManualRefill = async () => {
        setRefillLoading(true);
        try {
            const res = await api.post('/admin/refill', {
                packageType: refillPkg,
                duration: refillDuration,
                quantity: refillQty,
            });
            if (res.data.success) {
                alert('Refill successful!');
            } else {
                alert('Refill failed: ' + res.data.msg);
            }
        } catch (err) {
            alert('Refill error');
        } finally {
            setRefillLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
                <p className="text-slate-400 font-bold animate-pulse">Synchronizing Inventory Heuristics...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <Package className="text-blue-500" size={32} />
                    Node Inventory & Logistics
                </h1>
                <p className="text-slate-500 mt-1 font-medium italic text-sm">Configure automated procurement and manual node fulfillment parameters.</p>
            </header>

            {/* Section 1: Package Slot Configuration */}
            <section className="glass-card p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full" />

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                        <Settings className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white italic tracking-tight uppercase">Slot Allotment & Logic</h2>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Define multi-tenant occupancy limits per node.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {configs.map((pkg) => (
                        <div key={pkg.name} className="bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 group hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between mb-6">
                                <span className={clsx(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    pkg.name === 'High' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                                        pkg.name === 'Medium' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                                            "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                )}>
                                    {pkg.name} Tier
                                </span>
                                <Zap className="text-slate-700 group-hover:text-amber-400 transition-colors" size={16} />
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Max Capacity</label>
                                    <input
                                        type="number"
                                        disabled={pkg.name === 'High'}
                                        value={pkg.maxUsers}
                                        onChange={(e) => {
                                            const newConfigs = configs.map(c => c.name === pkg.name ? { ...c, maxUsers: parseInt(e.target.value) } : c);
                                            setConfigs(newConfigs);
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-blue-500/50 transition-all"
                                    />
                                    {pkg.name === 'High' && <p className="text-[10px] text-yellow-500/60 mt-2 italic">* Immutable tier: 1 user/port</p>}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <span className="text-xs font-bold text-slate-400 italic">Auto-Buy Shell</span>
                                    <button
                                        onClick={() => handleUpdateConfig(pkg.name, { autoBuyEnabled: !pkg.autoBuyEnabled })}
                                        className={clsx(
                                            "w-12 h-6 rounded-full p-1 transition-all",
                                            pkg.autoBuyEnabled ? "bg-blue-600" : "bg-white/10"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-4 h-4 bg-white rounded-full shadow-lg transition-transform",
                                            pkg.autoBuyEnabled ? "translate-x-6" : "translate-x-0"
                                        )} />
                                    </button>
                                </div>

                                <button
                                    onClick={() => handleUpdateConfig(pkg.name, { maxUsers: pkg.maxUsers })}
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black text-slate-300 uppercase tracking-widest transition-all border border-white/5 flex items-center justify-center gap-2"
                                >
                                    <Save size={14} /> Commit Changes
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Section 2: Manual Node Procurement */}
            <section className="glass-card p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full" />

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                        <Shield className="text-purple-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white italic tracking-tight uppercase">Manual Node Procurement</h2>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Force inject nodes into the network manually.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tier Protocol</label>
                        <select
                            value={refillPkg}
                            onChange={(e) => setRefillPkg(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold outline-none focus:border-purple-500/50 transition-all appearance-none"
                        >
                            <option value="Normal">Normal Node</option>
                            <option value="Medium">Medium Node</option>
                            <option value="High">High Static Node</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lease Quantum</label>
                        <select
                            value={refillDuration}
                            onChange={(e) => setRefillDuration(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold outline-none focus:border-purple-500/50 transition-all appearance-none"
                        >
                            <option value="1 Day">24 Hour Cycle</option>
                            <option value="7 Days">Weekly Cycle</option>
                            <option value="30 Days">Monthly Cycle</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Node Count</label>
                        <input
                            type="number"
                            value={refillQty}
                            onChange={(e) => setRefillQty(parseInt(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold outline-none focus:border-purple-500/50 transition-all"
                            min="1"
                        />
                    </div>

                    <button
                        onClick={handleManualRefill}
                        disabled={refillLoading}
                        className="h-[52px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-purple-500/20 flex items-center justify-center gap-3 disabled:opacity-50 group active:scale-95"
                    >
                        {refillLoading ? (
                            <RefreshCcw className="animate-spin" size={18} />
                        ) : (
                            <>
                                <RefreshCcw className="group-hover:rotate-180 transition-transform duration-700" size={18} />
                                Execute Procurement
                            </>
                        )}
                    </button>
                </div>
            </section>
        </div>
    );
};
