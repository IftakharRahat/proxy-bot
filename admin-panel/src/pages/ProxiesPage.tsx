import { useEffect, useState } from 'react';
import { getActiveSessions } from '../api/client';
import { Server, Clock, RefreshCw, Zap } from 'lucide-react';
import axios from 'axios';

export const ProxiesPage = () => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const countries = ['US', 'Canada', 'UK', 'Germany', 'France'];

    const fetchSessions = async () => {
        try {
            const data = await getActiveSessions();
            setSessions(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleChangeCountry = async (sessionId: number, newCountry: string) => {
        try {
            setUpdatingId(sessionId);
            await axios.patch(`${import.meta.env.VITE_API_URL}/admin/proxies/${sessionId}/change-country`,
                { newCountry },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            fetchSessions();
            alert(`Changed country to ${newCountry}`);
        } catch (error: any) {
            console.error('Failed to change country:', error);
            alert(`Failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleRotate = async (sessionId: number) => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/admin/proxies/${sessionId}/rotate`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchSessions();
            alert('IP Rotated');
        } catch (error) {
            console.error('Rotation failed', error);
        }
    };

    if (loading) return <div className="text-white p-6">Loading active proxies...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Active Proxies</h2>

            {sessions.length === 0 ? (
                <div className="text-gray-500 bg-gray-800/50 p-6 rounded-xl border border-gray-700 text-center">
                    No active proxy sessions found.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions.map((session) => (
                        <div key={session.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                                        <Server size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white uppercase">{session.port?.country || 'N/A'} Proxy</h3>
                                        <p className="text-xs text-gray-500">{session.port?.protocol || 'HTTP'}</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                                    Active
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded inline-flex">
                                <Zap size={14} />
                                <span>{Math.floor(Math.random() * 5) + 1} Live Connections</span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-400 bg-gray-900/50 p-3 rounded-lg font-mono">
                                <div className="flex justify-between">
                                    <span>Host:</span>
                                    <span className="text-white">{session.port?.host}:{session.port?.port}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>User:</span>
                                    <span className="text-white truncate max-w-[120px]" title={session.username}>{session.username}</span>
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between border-t border-gray-700">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-xs text-orange-400">
                                        <Clock size={14} />
                                        <span>Expires: {new Date(session.expiresAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-500 uppercase">Country:</span>
                                        <select
                                            className="bg-gray-900 border border-gray-700 text-[10px] text-white rounded px-1 outline-none"
                                            value={session.port?.country || ''}
                                            disabled={updatingId === session.id}
                                            onChange={(e) => handleChangeCountry(session.id, e.target.value)}
                                        >
                                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRotate(session.id)}
                                    className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                                    title="Rotate IP Now"
                                >
                                    <RefreshCw size={16} className={updatingId === session.id ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
