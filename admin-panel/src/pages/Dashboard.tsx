import { Users, Server, BadgeDollarSign, Activity } from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-gray-400 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${color} bg-opacity-20`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
        </div>
        <p className="text-gray-500 text-xs mt-4">{subtext}</p>
    </div>
);

export const Dashboard = () => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value="1,234"
                    subtext="+12% from last month"
                    icon={Users}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Active Proxies"
                    value="856"
                    subtext="85% utilization rate"
                    icon={Server}
                    color="bg-green-500"
                />
                <StatCard
                    title="Revenue (30d)"
                    value="৳45,200"
                    subtext="+8% from last month"
                    icon={BadgeDollarSign}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Server Health"
                    value="99.9%"
                    subtext="All systems operational"
                    icon={Activity}
                    color="bg-orange-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <BadgeDollarSign size={18} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Topup Balance</p>
                                        <p className="text-xs text-gray-500">User #10{i} • bKash</p>
                                    </div>
                                </div>
                                <span className="font-bold text-green-400">+৳500</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">System Status</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">PostgreSQL Database</span>
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Operational</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Redis Queue</span>
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Operational</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Telegram Bot</span>
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Operational</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Novproxy API</span>
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Operational</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
