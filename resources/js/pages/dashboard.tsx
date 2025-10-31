import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Truck,
    Users,
    Activity,
    TrendingUp,
    Calendar,
    BarChart3,
    Eye,
    Plus,
    Package,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';



// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const STATUS_COLORS = {
    'completed': '#00C49F',
    'in_progress': '#FFBB28',
    'pending': '#FF8042',
    'cancelled': '#8884D8'
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface DashboardProps {
    stats: {
        totalTrucks: number;
        activeTrucks: number;
        totalDrivers: number;
        activeDrivers: number;
        totalOperations: number;
        openOperations: number;
        totalPerformances: number;
        returnedPerformances: number;
        notReturnedPerformances: number;
        totalTonnage: number;
    };
    dailyPerformance: Array<{
        date: string;
        tonnage: number;
    }>;
    operationsReport: Array<{
        customer_id: number;
        count: number;
        total_volume: number;
        customer: {
            name: string;
        };
    }>;
    statusBreakdown: Array<{
        satus: string;
        count: number;
    }>;
    recentPerformances: Array<{
        id: number;
        trip: string;
        DateDispach: string;
        CargoVolumMT: number;
        satus: string;
        driverTruck?: {
            id: number;
            driver?: {
                id: number;
                name: string;
            };
            truck?: {
                id: number;
                plate: string;
            };
        };
        origin?: {
            id: number;
            name: string;
        };
        destination?: {
            id: number;
            name: string;
        };
    }>;
}

export default function Dashboard({
    stats,
    dailyPerformance,
    operationsReport,
    statusBreakdown,
    recentPerformances
}: DashboardProps) {
    // Prepare data for charts
    const fleetData = [
        { name: 'Active Trucks', value: stats.activeTrucks, total: stats.totalTrucks },
        { name: 'Inactive Trucks', value: stats.totalTrucks - stats.activeTrucks, total: stats.totalTrucks },
        { name: 'Active Drivers', value: stats.activeDrivers, total: stats.totalDrivers },
        { name: 'Inactive Drivers', value: stats.totalDrivers - stats.activeDrivers, total: stats.totalDrivers },
    ];

    const performanceData = [
        { name: 'Returned', value: stats.returnedPerformances, color: '#00C49F' },
        { name: 'Not Returned', value: stats.notReturnedPerformances, color: '#FF8042' },
    ];

    // Format daily performance data for charts
    const chartDailyPerformance = dailyPerformance.map(day => ({
        date: day.date ? new Date(day.date).toLocaleDateString() : 'Unknown',
        tonnage: day.tonnage || 0
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 w-full">
                {/* Welcome Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">TIMS Dashboard</h1>
                        <p className="text-muted-foreground">Transport Information Management System Overview</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href="/performances/create">
                                <Plus className="h-4 w-4 mr-2" />
                                New Performance
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Trucks</CardTitle>
                            <Truck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalTrucks}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.activeTrucks} active trucks
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalDrivers}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.activeDrivers} active drivers
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Operations</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalOperations}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.openOperations} open operations
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tonnage</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalTonnage.toLocaleString()} MT</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.totalPerformances} total performances
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 1 */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Fleet Utilization Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Fleet Utilization</CardTitle>
                            <CardDescription>Active vs Inactive Trucks & Drivers</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={fleetData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#0088FE" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Performance Status Pie Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Status</CardTitle>
                            <CardDescription>Returned vs Not Returned Performances</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={performanceData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {performanceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 2 */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Daily Performance Trend */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Performance Trend</CardTitle>
                            <CardDescription>Tonnage transported over the last 30 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={chartDailyPerformance}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="tonnage" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Status Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Status Breakdown</CardTitle>
                            <CardDescription>Performance status distribution</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={statusBreakdown}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="satus" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Customer Operations Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Customers by Volume</CardTitle>
                        <CardDescription>Operations volume by customer</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={operationsReport.slice(0, 10)} layout="horizontal">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="customer.name" type="category" width={120} />
                                <Tooltip />
                                <Bar dataKey="total_volume" fill="#ffc658" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Recent Performances */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Performances</CardTitle>
                            <CardDescription>Latest trip performances and their details</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link href="/performances">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View All
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentPerformances.slice(0, 8).map((performance) => (
                                <div key={performance.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="space-y-1">
                                        <div className="font-medium">{performance.trip}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {performance.driverTruck?.driver?.name || 'Unknown Driver'} • {performance.driverTruck?.truck?.plate || 'Unknown Truck'}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {performance.origin?.name || 'Unknown Origin'} → {performance.destination?.name || 'Unknown Destination'}
                                        </div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <div className="font-medium text-lg">{performance.CargoVolumMT} MT</div>
                                        <div className="text-sm text-muted-foreground">
                                            {new Date(performance.DateDispach).toLocaleDateString()}
                                        </div>
                                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            performance.satus?.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                                            performance.satus?.toLowerCase() === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {performance.satus || 'Unknown Status'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
