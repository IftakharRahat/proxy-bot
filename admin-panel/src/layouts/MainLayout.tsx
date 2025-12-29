import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Server, BadgeDollarSign, Settings, LogOut, PackageSearch, History } from 'lucide-react';
import clsx from 'clsx';

const SidebarItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
        >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
        </Link>
    );
};

export const MainLayout = () => {
    return (
        <div className="flex h-screen bg-gray-900 text-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        ProxyBot
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
                    <SidebarItem to="/users" icon={Users} label="Users" />
                    <SidebarItem to="/proxies" icon={Server} label="Proxies" />
                    <SidebarItem to="/inventory" icon={PackageSearch} label="Inventory" />
                    <SidebarItem to="/purchases" icon={History} label="Purchases" />
                    <SidebarItem to="/transactions" icon={BadgeDollarSign} label="Transactions" />
                    <SidebarItem to="/settings" icon={Settings} label="Settings" />
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-950/30 w-full rounded-lg transition-colors">
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <header className="bg-gray-950 border-b border-gray-800 h-16 flex items-center justify-between px-8">
                    <h2 className="text-lg font-semibold text-gray-200">Admin Dashboard</h2>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                            A
                        </div>
                    </div>
                </header>

                <main className="p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
