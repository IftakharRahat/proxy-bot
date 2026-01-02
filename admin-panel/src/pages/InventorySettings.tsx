import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Settings, Zap, Shield, Save, Package, RefreshCcw, CloudDownload } from 'lucide-react';
import clsx from 'clsx';

interface PackageConfig {
    name: string;
    maxUsers: number;
    autoBuyEnabled: boolean;
    autoBuyDuration: number;
}

export const InventorySettings: React.FC = () => {
    const [configs, setConfigs] = useState<PackageConfig[]>([]);
    const [loading, setLoading] = useState(true);

    // Manual Refill state
    const [refillPkg, setRefillPkg] = useState('Normal');
    const [refillDuration, setRefillDuration] = useState('1 Day');
    const [refillQty, setRefillQty] = useState(1);
    const [refillLoading, setRefillLoading] = useState(false);
    const [showInvoice, setShowInvoice] = useState(false);
    const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
    const [isEstimating, setIsEstimating] = useState(false);
    const [priceSource, setPriceSource] = useState<string>('');
    const [refillCountry, setRefillCountry] = useState('US');
    const [refillRotation, setRefillRotation] = useState(30);
    const [syncLoading, setSyncLoading] = useState(false);
    const [showProviderModal, setShowProviderModal] = useState(false);
    const [providerPorts, setProviderPorts] = useState<any[]>([]);
    const [selectedPortIds, setSelectedPortIds] = useState<number[]>([]);
    const [importLoading, setImportLoading] = useState(false);

    const handlePreviewProvider = async () => {
        setSyncLoading(true);
        try {
            const res = await api.get('/admin/preview-provider');
            if (res.data.success) {
                setProviderPorts(res.data.ports);
                setSelectedPortIds([]);
                setShowProviderModal(true);
            } else {
                alert('Preview failed: ' + res.data.msg);
            }
        } catch (err) {
            alert('Preview error. Check console.');
            console.error(err);
        } finally {
            setSyncLoading(false);
        }
    };

    const handleImportSelected = async () => {
        if (selectedPortIds.length === 0) {
            alert('Please select at least one port to import.');
            return;
        }
        setImportLoading(true);
        try {
            const res = await api.post('/admin/import-ports', {
                portIds: selectedPortIds,
                packageType: refillPkg,
            });
            if (res.data.success) {
                alert(`Import successful! ${res.data.imported} ports added.`);
                setShowProviderModal(false);
                setSelectedPortIds([]);
            } else {
                alert('Import failed: ' + res.data.msg);
            }
        } catch (err) {
            alert('Import error. Check console.');
            console.error(err);
        } finally {
            setImportLoading(false);
        }
    };

    const togglePortSelection = (id: number) => {
        setSelectedPortIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const selectAllNew = () => {
        const newPorts = providerPorts.filter(p => !p.isImported).map(p => p.id);
        setSelectedPortIds(newPorts);
    };

    const handlePreview = async () => {
        setIsEstimating(true);
        setShowInvoice(true);
        try {
            const res = await api.get('/admin/estimate', {
                params: {
                    tier: refillPkg,
                    duration: refillDuration,
                    quantity: refillQty,
                }
            });
            setEstimatedCost(res.data.totalCost);
            setPriceSource(res.data.source || 'Novproxy API');
        } catch (err) {
            console.error('Estimation failed', err);
            // Fallback to local calculation if API fails
            let baseRate = 1.0;
            if (refillPkg === 'Medium') baseRate = 1.5;
            if (refillPkg === 'High') baseRate = 2.5;
            let durationMultiplier = 1.0;
            if (refillDuration === '7 Days') durationMultiplier = 6.0;
            if (refillDuration === '30 Days') durationMultiplier = 20.0;
            setEstimatedCost(Number((refillQty * baseRate * durationMultiplier).toFixed(2)));
        } finally {
            setIsEstimating(false);
        }
    };

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
                country: refillCountry,
                rotation: refillRotation,
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
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Package className="text-blue-500" size={32} />
                        Node Inventory & Logistics
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium italic text-sm">Configure automated procurement and manual node fulfillment parameters.</p>
                </div>
                <button
                    onClick={handlePreviewProvider}
                    disabled={syncLoading}
                    className={clsx(
                        "flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all",
                        syncLoading
                            ? "bg-slate-700 text-slate-400 cursor-wait"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                    )}
                >
                    <CloudDownload size={18} className={syncLoading ? "animate-pulse" : ""} />
                    {syncLoading ? 'Loading...' : 'Browse Provider'}
                </button>
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
                                    {pkg.name === 'High' ? 'Dedicated' : 'Shared'} Tier
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

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Auto-Buy Cycle (Days)</label>
                                    <input
                                        type="number"
                                        disabled={!pkg.autoBuyEnabled}
                                        value={pkg.autoBuyDuration}
                                        onChange={(e) => {
                                            const val = Math.max(1, parseInt(e.target.value) || 1);
                                            const newConfigs = configs.map(c => c.name === pkg.name ? { ...c, autoBuyDuration: val } : c);
                                            setConfigs(newConfigs);
                                        }}
                                        className={clsx(
                                            "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-blue-500/50 transition-all",
                                            !pkg.autoBuyEnabled && "opacity-50 cursor-not-allowed"
                                        )}
                                        placeholder="e.g. 7"
                                    />
                                    <p className="text-[10px] text-slate-500/60 mt-2 italic">* Duration of new ports</p>
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

                <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tier Protocol</label>
                        <select
                            value={refillPkg}
                            onChange={(e) => setRefillPkg(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold outline-none focus:border-purple-500/50 transition-all appearance-none"
                        >
                            <option value="Normal">⚡ Shared (Standard)</option>
                            <option value="Medium">🚀 Shared (Premium)</option>
                            <option value="High">💎 Dedicated (Private)</option>
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
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Region</label>
                        <select
                            value={refillCountry}
                            onChange={(e) => setRefillCountry(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold outline-none focus:border-purple-500/50 transition-all appearance-none"
                        >
                            <option value="US">🇺🇸 United States</option>
                            <option value="CA">🇨🇦 Canada</option>
                            <option value="Random">🌍 Random</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">IP Rotation</label>
                        <select
                            value={refillRotation}
                            onChange={(e) => setRefillRotation(parseInt(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold outline-none focus:border-purple-500/50 transition-all appearance-none"
                        >
                            <option value="5">5 Minutes</option>
                            <option value="10">10 Minutes</option>
                            <option value="30">30 Minutes</option>
                            <option value="60">60 Minutes</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Node Count</label>
                        <input
                            type="number"
                            value={refillQty}
                            onChange={(e) => setRefillQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-bold outline-none focus:border-purple-500/50 transition-all font-mono"
                            min="1"
                        />
                    </div>

                    <button
                        onClick={handlePreview}
                        className="h-[52px] bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 flex items-center justify-center gap-3 active:scale-95 group"
                    >
                        <RefreshCcw className={clsx("group-hover:rotate-180 transition-transform duration-700 text-purple-400", isEstimating && "animate-spin")} size={18} />
                        Preview Invoice
                    </button>
                </div>
            </section>

            {/* Invoice Preview Modal */}
            {showInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="glass-card w-full max-w-lg rounded-[3rem] p-10 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-500">
                        <div className="absolute top-0 right-0 p-8">
                            <button onClick={() => setShowInvoice(false)} className="text-slate-500 hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest">Close [Esc]</button>
                        </div>

                        <header className="mb-10">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10 mb-6">
                                <Shield className="text-purple-400" size={32} />
                            </div>
                            <h2 className="text-3xl font-black text-white italic tracking-tight uppercase">Stock Activation Report</h2>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Ref: ACT-PROC-{Date.now().toString().slice(-6)}</p>
                        </header>

                        <div className="space-y-6 mb-10">
                            <div className="flex justify-between items-center py-4 border-b border-white/5">
                                <span className="text-slate-400 text-sm font-bold italic">Resource Tier</span>
                                <span className="text-white font-black uppercase tracking-tight">
                                    {refillPkg === 'High' ? 'Dedicated' : 'Shared'} Cluster
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b border-white/5">
                                <span className="text-slate-400 text-sm font-bold italic">Duration</span>
                                <span className="text-white font-black uppercase tracking-tight">{refillDuration}</span>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b border-white/5">
                                <span className="text-slate-400 text-sm font-bold italic">Quantity</span>
                                <span className="text-white font-black uppercase tracking-tight">{refillQty} Units</span>
                            </div>
                            <div className="flex justify-between items-center py-6">
                                <span className="text-blue-400 font-black uppercase tracking-[0.2em] text-xs">Warehouse Unit Deduction</span>
                                <div className="text-right">
                                    {isEstimating ? (
                                        <div className="flex items-center gap-2 animate-pulse">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                                            <span className="text-slate-500 text-xs font-black uppercase">Fetching API Rates...</span>
                                        </div>
                                    ) : (
                                        <p className="text-4xl font-black text-white leading-none tracking-tighter">
                                            <span className="text-blue-500 text-sm mr-1">COST:</span>
                                            ${estimatedCost}
                                            <span className="text-slate-500 text-[10px] ml-2 tracking-widest">/ {refillQty} UNIT</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-500/5 rounded-[2rem] p-6 border border-blue-500/10 mb-10">
                            <p className="text-blue-400 text-[10px] leading-relaxed font-bold italic text-center">
                                {priceSource ? (
                                    <>✓ Method: <span className="text-green-400">Inventory Unit Deduction (Bulk Plan)</span></>
                                ) : (
                                    '* Fetching real-time rates from Novproxy...'
                                )}
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                handleManualRefill();
                                setShowInvoice(false);
                            }}
                            disabled={refillLoading}
                            className="w-full py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            {refillLoading ? <RefreshCcw className="animate-spin" /> : "Confirm & Activate Stock"}
                        </button>
                    </div>
                </div>
            )}

            {/* Provider Ports Preview Modal */}
            {showProviderModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-3xl border border-white/10 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-white">Provider Inventory</h2>
                                <p className="text-slate-500 text-xs mt-1">Select ports to import into your stock</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={selectAllNew}
                                    className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold"
                                >
                                    Select All New
                                </button>
                                <button
                                    onClick={() => setShowProviderModal(false)}
                                    className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 p-4">
                            <table className="w-full">
                                <thead className="sticky top-0 bg-slate-900">
                                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                                        <th className="p-3 text-left">Select</th>
                                        <th className="p-3 text-left">ID</th>
                                        <th className="p-3 text-left">IP / Domain</th>
                                        <th className="p-3 text-left">Port</th>
                                        <th className="p-3 text-left">Region</th>
                                        <th className="p-3 text-left">Expires</th>
                                        <th className="p-3 text-left">Tier</th>
                                        <th className="p-3 text-left">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {providerPorts.map((port) => (
                                        <tr
                                            key={port.id}
                                            className={clsx(
                                                "border-b border-white/5 transition-colors hover:bg-white/5 cursor-pointer",
                                                selectedPortIds.includes(port.id) && "bg-blue-500/10"
                                            )}
                                            onClick={() => togglePortSelection(port.id)}
                                        >
                                            <td className="p-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPortIds.includes(port.id)}
                                                    onChange={() => togglePortSelection(port.id)}
                                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500"
                                                />
                                            </td>
                                            <td className="p-3 text-slate-400 font-mono text-xs">{port.id}</td>
                                            <td className="p-3 text-white font-mono text-xs">{port.domain || port.ip}</td>
                                            <td className="p-3 text-blue-400 font-bold text-xs">{port.port}</td>
                                            <td className="p-3 text-slate-300 text-xs">{port.region || 'Random'}</td>
                                            <td className="p-3 text-slate-400 text-xs">{new Date(port.expired).toLocaleDateString()}</td>
                                            <td className="p-3">
                                                {port.assignedTier ? (
                                                    <span className={clsx(
                                                        "px-2 py-1 text-[10px] font-bold rounded-lg",
                                                        port.assignedTier === 'High' ? "bg-purple-500/20 text-purple-400" :
                                                            port.assignedTier === 'Medium' ? "bg-blue-500/20 text-blue-400" :
                                                                "bg-emerald-500/20 text-emerald-400"
                                                    )}>
                                                        {port.assignedTier}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-600 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {port.isImported ? (
                                                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg">IMPORTED</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-lg">NEW</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6 border-t border-white/5 flex items-center justify-between">
                            <div className="text-slate-400 text-sm">
                                <span className="text-white font-bold">{selectedPortIds.length}</span> ports selected
                            </div>
                            <div className="flex items-center gap-4">
                                <select
                                    value={refillPkg}
                                    onChange={(e) => setRefillPkg(e.target.value)}
                                    className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                                >
                                    <option value="Normal">Shared (Standard)</option>
                                    <option value="Medium">Shared (Premium)</option>
                                    <option value="High">Dedicated (Private)</option>
                                </select>
                                <button
                                    onClick={handleImportSelected}
                                    disabled={importLoading || selectedPortIds.length === 0}
                                    className={clsx(
                                        "px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all",
                                        importLoading || selectedPortIds.length === 0
                                            ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                                            : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500"
                                    )}
                                >
                                    {importLoading ? 'Importing...' : `Import ${selectedPortIds.length} Ports`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
