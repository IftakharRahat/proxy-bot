import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { ShieldCheck, Lock, User, Server, Cpu, Globe, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', { username, password });
            localStorage.setItem('token', res.data.token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Unauthorized: Terminal access denied.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-['Outfit']">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[150px] rounded-full animate-pulse-slow font-['Outfit']" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[150px] rounded-full animate-pulse-slow" />

            {/* Tech Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="w-full max-w-lg relative z-10 transition-all duration-1000 animate-in fade-in zoom-in-95">
                <div className="glass-card rounded-[3rem] p-12 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    {/* Interior Glow */}
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />

                    <div className="relative z-10">
                        <header className="text-center mb-12">
                            <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6 shadow-2xl shadow-blue-500/30 transform hover:scale-110 transition-transform duration-500">
                                <Server className="text-white" size={42} />
                            </div>
                            <h1 className="text-4xl font-black text-white tracking-tight mb-2 uppercase italic">
                                ProxyBot <span className="text-blue-500">OS</span>
                            </h1>
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-0.5 w-8 bg-blue-500/50 rounded-full" />
                                <p className="text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black">Secure Terminal Access</p>
                                <div className="h-0.5 w-8 bg-blue-500/50 rounded-full" />
                            </div>
                        </header>

                        {error && (
                            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-shake">
                                <ShieldCheck className="text-red-500" size={18} />
                                <p className="text-xs font-bold text-red-400 uppercase tracking-wider">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4">Node Identity</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="enter_username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/5 focus:border-blue-500/50 focus:bg-white/[0.05] rounded-[1.5rem] py-5 pl-14 pr-6 text-white text-sm font-bold placeholder:text-slate-700 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4">Access Cipher</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/5 focus:border-purple-500/50 focus:bg-white/[0.05] rounded-[1.5rem] py-5 pl-14 pr-6 text-white text-sm font-bold placeholder:text-slate-700 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-[1.5rem] font-black tracking-widest text-sm uppercase shadow-2xl shadow-blue-500/30 hover:shadow-purple-500/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden group/btn"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Authorize Terminal
                                        <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <footer className="mt-12 flex items-center justify-center gap-8 opacity-40">
                    <div className="flex items-center gap-2 group cursor-pointer hover:opacity-100 transition-opacity">
                        <Cpu size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TLS 1.3</span>
                    </div>
                    <div className="flex items-center gap-2 group cursor-pointer hover:opacity-100 transition-opacity">
                        <Globe size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AES-256</span>
                    </div>
                    <div className="flex items-center gap-2 group cursor-pointer hover:opacity-100 transition-opacity">
                        <ShieldCheck size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bot Guard</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};
