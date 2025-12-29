import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

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

    if (loading) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="p-8 space-y-8 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6">Inventory Settings</h1>

            {/* Section 1: Package Slot Configuration */}
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">1. Package Slot Configuration</h2>
                <p className="text-gray-500 mb-6 text-sm">Define how many users can share a single port in each package.</p>

                <div className="space-y-4">
                    {configs.map((pkg) => (
                        <div key={pkg.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                            <div className="flex-1">
                                <span className="font-medium text-lg">{pkg.name} Package</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center">
                                    <span className="mr-2 text-sm text-gray-600">Max Users:</span>
                                    <input
                                        type="number"
                                        disabled={pkg.name === 'High'}
                                        value={pkg.maxUsers}
                                        onChange={(e) => {
                                            const newConfigs = configs.map(c => c.name === pkg.name ? { ...c, maxUsers: parseInt(e.target.value) } : c);
                                            setConfigs(newConfigs);
                                        }}
                                        className={`border rounded px-3 py-1 w-20 text-center ${pkg.name === 'High' ? 'bg-gray-100 italic' : 'bg-white'}`}
                                    />
                                    {pkg.name === 'High' && <span className="ml-2 text-xs text-blue-500">(Fixed)</span>}
                                </div>
                                <button
                                    onClick={() => handleUpdateConfig(pkg.name, { maxUsers: pkg.maxUsers })}
                                    disabled={pkg.name === 'High'}
                                    className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Section 2: Individual Auto-Buy Settings */}
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">2. Individual Auto-Buy Settings</h2>
                <p className="text-gray-500 mb-6 text-sm">Control automatic port purchasing for each package tier.</p>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b">
                                <th className="pb-3 font-medium">Package</th>
                                <th className="pb-3 font-medium text-center">Auto-Buy Status</th>
                                <th className="pb-3 font-medium">Default Duration</th>
                                <th className="pb-3 font-medium text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {configs.map((pkg) => (
                                <tr key={pkg.name} className="border-b last:border-0">
                                    <td className="py-4 font-medium">{pkg.name}</td>
                                    <td className="py-4 text-center">
                                        <button
                                            onClick={() => handleUpdateConfig(pkg.name, { autoBuyEnabled: !pkg.autoBuyEnabled })}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pkg.autoBuyEnabled ? 'bg-green-600' : 'bg-gray-200'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pkg.autoBuyEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                        <span className="block text-[10px] mt-1 uppercase font-bold text-gray-400">
                                            {pkg.autoBuyEnabled ? 'ON' : 'OFF'}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <select
                                            value={pkg.autoBuyDuration}
                                            onChange={(e) => handleUpdateConfig(pkg.name, { autoBuyDuration: e.target.value })}
                                            className="border rounded px-2 py-1 bg-white"
                                        >
                                            <option>1 Day</option>
                                            <option>7 Days</option>
                                            <option>30 Days</option>
                                        </select>
                                    </td>
                                    <td className="py-4 text-center">
                                        <button
                                            onClick={() => fetchConfigs()}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            Update
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Section 3: Manual Stock Refill */}
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">3. Manual Stock Refill</h2>
                <p className="text-gray-500 mb-6 text-sm">Instantly buy ports from Novproxy and add them to your available inventory.</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Select Package</label>
                        <select
                            value={refillPkg}
                            onChange={(e) => setRefillPkg(e.target.value)}
                            className="w-full border rounded px-3 py-2 bg-white"
                        >
                            <option>High</option>
                            <option>Medium</option>
                            <option>Normal</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Duration</label>
                        <select
                            value={refillDuration}
                            onChange={(e) => setRefillDuration(e.target.value)}
                            className="w-full border rounded px-3 py-2 bg-white"
                        >
                            <option>1 Day</option>
                            <option>7 Days</option>
                            <option>30 Days</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            value={refillQty}
                            onChange={(e) => setRefillQty(parseInt(e.target.value) || 1)}
                            className="w-full border rounded px-3 py-2 bg-white"
                        />
                    </div>
                    <button
                        onClick={handleManualRefill}
                        disabled={refillLoading}
                        className="w-full bg-black text-white px-3 py-2 rounded font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                        {refillLoading ? 'Processing...' : 'Buy & Add to Stock'}
                    </button>
                </div>
            </section>
        </div>
    );
};
