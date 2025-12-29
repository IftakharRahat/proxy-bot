import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

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

    if (loading) return <div className="p-8">Loading logs...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Purchase History (Cost Log)</h1>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md border border-blue-100 text-sm">
                    Total API Spending: <span className="font-bold">${logs.reduce((sum, log) => sum + Number(log.cost), 0).toFixed(2)}</span>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 font-bold text-xs text-gray-500 uppercase">Date & Time</th>
                            <th className="px-6 py-3 font-bold text-xs text-gray-500 uppercase">Package Type</th>
                            <th className="px-6 py-3 font-bold text-xs text-gray-500 uppercase">Duration</th>
                            <th className="px-6 py-3 font-bold text-xs text-gray-500 uppercase">Buying Cost ($)</th>
                            <th className="px-6 py-3 font-bold text-xs text-gray-500 uppercase">Order ID</th>
                            <th className="px-6 py-3 font-bold text-xs text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-500 italic">
                                    No purchases found. Use "Manual Stock Refill" to buy ports.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${log.packageType === 'High' ? 'bg-purple-100 text-purple-700' :
                                            log.packageType === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {log.packageType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">
                                        {log.duration}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-black text-red-600">
                                        -${Number(log.cost).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {log.orderId || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase">
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
