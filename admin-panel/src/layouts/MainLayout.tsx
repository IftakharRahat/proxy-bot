import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Server, BadgeDollarSign, Settings, LogOut, PackageSearch, History, Search, X } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../api/client';

const SidebarItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group',
                isActive
                    ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-500/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
            )}
        >
            <Icon size={20} className={clsx('transition-transform duration-300 group-hover:scale-110', isActive && 'text-white')} />
            <span className="font-semibold tracking-tight">{label}</span>
            {isActive && (
                <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
            )}
        </Link>
    );
};

export const MainLayout = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Debounced search
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await api.get(`/admin/users/search?q=${encodeURIComponent(searchQuery)}`);
                setSearchResults(res.data);
                setShowResults(true);
            } catch (e) {
                console.error('Search failed', e);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setShowResults(false);
    };

    return (
        <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-['Outfit']">
            {/* Sidebar */}
            <aside className="w-72 glass-panel border-r border-white/5 flex flex-col z-20">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-2 shadow-xl shadow-blue-500/20">
                            <Server className="text-white" size={24} />
                        </div>
                        <h1 className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            ProxyBot
                        </h1>
                    </div>
                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-[10px] uppercase font-black tracking-widest text-blue-400">Master Console</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
                    <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
                    <SidebarItem to="/users" icon={Users} label="Users" />
                    <SidebarItem to="/proxies" icon={Server} label="Proxies" />
                    <SidebarItem to="/inventory" icon={PackageSearch} label="Inventory" />
                    <SidebarItem to="/purchases" icon={History} label="Purchases" />
                    <div className="pt-4 pb-2 px-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Management</span>
                    </div>
                    <SidebarItem to="/transactions" icon={BadgeDollarSign} label="Transactions" />
                    <SidebarItem to="/settings" icon={Settings} label="Settings" />
                </nav>

                <div className="p-6 border-t border-white/5 bg-white/[0.01]">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 w-full rounded-xl transition-all group duration-300"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold tracking-tight">System Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] -z-10 rounded-full" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/5 blur-[100px] -z-10 rounded-full" />

                <header className="h-20 flex items-center justify-between px-10 border-b border-white/5 bg-[#020617]/50 backdrop-blur-xl z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Administrative Console</h2>
                        <p className="text-xs text-slate-500">System Monitoring & Resource Control</p>
                    </div>

                    {/* Global Search Bar */}
                    <div className="relative flex-1 max-w-md mx-8">
                        <div className="relative">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                                placeholder="Search users..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            />
                            {searchQuery && (
                                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {showResults && searchResults.length > 0 && (
                            <div className="absolute top-full mt-2 w-full bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                                {searchResults.map((user: any) => (
                                    <div
                                        key={user.id}
                                        className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all"
                                        onClick={() => {
                                            navigate('/users');
                                            clearSearch();
                                        }}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-white font-bold">@{user.username || 'unknown'}</p>
                                            <span className="text-blue-400 font-black">৳{user.balance}</span>
                                        </div>
                                        {user.sessions?.length > 0 ? (
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Active Packages:</p>
                                                {user.sessions.map((s: any) => (
                                                    <div key={s.id} className="text-xs text-slate-400 flex justify-between">
                                                        <span>Port {s.port?.port} ({s.port?.packageType})</span>
                                                        <span className="text-emerald-400">{new Date(s.expiresAt).toLocaleDateString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[10px] text-slate-600 italic">No active packages</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-bold text-white">System Admin</span>
                            <span className="text-[10px] text-green-500 font-black uppercase tracking-widest">Online</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 p-1 shadow-lg border border-white/10 ring-2 ring-white/5">
                            <div className="w-full h-full rounded-xl bg-[#020617] flex items-center justify-center text-lg font-black text-blue-400">
                                SA
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-10 relative scroll-smooth">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
