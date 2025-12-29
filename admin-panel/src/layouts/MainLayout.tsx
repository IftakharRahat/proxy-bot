import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Server, BadgeDollarSign, Settings, LogOut, PackageSearch, History } from 'lucide-react';
import clsx from 'clsx';

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

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
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
