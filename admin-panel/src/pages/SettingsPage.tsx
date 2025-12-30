import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Settings, Save, DollarSign, Package, AlertCircle, Trash2, Plus } from 'lucide-react';
import clsx from 'clsx';

interface BotPrice {
    tier: string;
    duration: string;
    price: number;
    currency: string;
}

export const SettingsPage: React.FC = () => {
    const [prices, setPrices] = useState<BotPrice[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Balance Presets State
    const [presets, setPresets] = useState<any[]>([]);
    const [newPresetAmount, setNewPresetAmount] = useState('');

    useEffect(() => {
        fetchPricing();
        fetchPresets();
    }, []);

    const fetchPresets = async () => {
        try {
            const res = await api.get('/admin/balance-presets');
            setPresets(res.data);
        } catch (err) {
            console.error('Failed to fetch presets', err);
        }
    };

    const handleAddPreset = async () => {
        if (!newPresetAmount) return;
        try {
            await api.post('/admin/balance-presets', { amount: parseInt(newPresetAmount) });
            setNewPresetAmount('');
            fetchPresets();
            setMessage({ type: 'success', text: 'Button added successfully' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to add button' });
        }
    };

    const handleDeletePreset = async (id: number) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await api.delete(`/admin/balance-presets/${id}`);
            fetchPresets();
            setMessage({ type: 'success', text: 'Button removed' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to remove button' });
        }
    };

    const fetchPricing = async () => {
        try {
            const res = await api.get('/admin/bot-pricing');
            setPrices(res.data);
        } catch (err) {
            console.error('Failed to fetch pricing', err);
            setMessage({ type: 'error', text: 'Failed to load pricing configuration' });
        } finally {
            setLoading(false);
        }
    };

    const handlePriceChange = (tier: string, duration: string, newValue: string) => {
        const numValue = parseFloat(newValue);
        if (isNaN(numValue)) return;

        setPrices(prev => prev.map(p =>
            (p.tier === tier && p.duration === duration)
                ? { ...p, price: numValue }
                : p
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await api.patch('/admin/bot-pricing', { prices });
            setMessage({ type: 'success', text: 'Pricing configuration updated successfully!' });
        } catch (err) {
            console.error('Failed to update pricing', err);
            setMessage({ type: 'error', text: 'Failed to update pricing' });
        } finally {
            setSaving(false);
        }
    };

    const tiers = ['Normal', 'Medium', 'High'];
    const durations = ['24h', '3d', '7d', '30d'];

    const getPrice = (tier: string, duration: string) => {
        return prices.find(p => p.tier === tier && p.duration === duration)?.price || 0;
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white italic tracking-tight uppercase flex items-center gap-3">
                        <span className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                            <Settings className="text-blue-400" size={24} />
                        </span>
                        System Configuration
                    </h1>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-2 ml-1">
                        Manage global settings and pricing models
                    </p>
                </div>
            </header>

            {message && (
                <div className={clsx(
                    "p-4 rounded-2xl border flex items-center gap-3 text-sm font-bold",
                    message.type === 'success'
                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                )}>
                    <AlertCircle size={18} />
                    {message.text}
                </div>
            )}

            {/* Bot Pricing Section */}
            <section className="glass-card p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                            <DollarSign className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white italic tracking-tight uppercase">Bot Pricing Configuration</h2>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Set customer-facing prices for the Telegram bot</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                        Save Changes
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tiers.map((tier) => (
                        <div key={tier} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                                <Package className={clsx(
                                    "w-5 h-5",
                                    tier === 'Normal' ? "text-blue-400" :
                                        tier === 'Medium' ? "text-purple-400" : "text-amber-400"
                                )} />
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">{tier} Tier</h3>
                            </div>

                            <div className="space-y-4">
                                {durations.map((duration) => (
                                    <div key={duration} className="flex items-center justify-between gap-4">
                                        <label className="text-slate-400 text-xs font-bold uppercase tracking-wider w-16">
                                            {duration}
                                        </label>
                                        <div className="flex-1 relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">৳</span>
                                            <input
                                                type="number"
                                                value={getPrice(tier, duration)}
                                                onChange={(e) => handlePriceChange(tier, duration, e.target.value)}
                                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2.5 pl-8 pr-4 text-white font-bold text-sm outline-none focus:border-blue-500/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Balance Buttons Configuration */}
            <section className="glass-card p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                        <DollarSign className="text-emerald-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white italic tracking-tight uppercase">Top-Up Buttons</h2>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Manage the "Add Balance" options in the bot</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* List */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Current Buttons</h3>
                        <div className="space-y-3">
                            {presets.map((preset) => (
                                <div key={preset.id} className="flex items-center justify-between p-3 bg-slate-950/30 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                    <span className="font-bold text-emerald-400 text-lg">{preset.label}</span>
                                    <button
                                        onClick={() => handleDeletePreset(preset.id)}
                                        className="p-2 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add New */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-fit">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Add New Button</h3>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">৳Amount</span>
                                <input
                                    type="number"
                                    value={newPresetAmount}
                                    onChange={(e) => setNewPresetAmount(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 pl-20 pr-4 text-white font-bold text-sm outline-none focus:border-emerald-500/50 transition-all"
                                    placeholder="e.g. 500"
                                />
                            </div>
                            <button
                                onClick={handleAddPreset}
                                className="px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest transition-all"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
