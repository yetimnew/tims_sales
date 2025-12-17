import * as React from 'react';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link } from '@inertiajs/react';
import { HelpNavMain, type HelpNavItem } from './help-nav-main';
import {
    BookOpen,
    LayoutGrid,
    Truck,
    Users,
    Wrench,
    Fuel,
    TrendingUp,
    FileText,
    Settings,
    HelpCircle,
    AlertCircle,
    Globe,
    Package,
    DollarSign,
    Activity,
    Shield,
    UserCheck,
    Navigation,
    MapPin,
    Target,
    History,
    Bell,
    Building2,
} from 'lucide-react';

// Define all help navigation items based on the main app structure
const getHelpNavItems = (): HelpNavItem[] => {
    return [
        {
            title: 'Getting Started',
            href: '/getting-started',
            icon: BookOpen,
            badge: 5,
            items: [
                {
                    title: 'Welcome Guide',
                    href: '/getting-started/welcome',
                    icon: HelpCircle,
                },
                {
                    title: 'Dashboard Overview',
                    href: '/getting-started/dashboard-overview',
                    icon: LayoutGrid,
                },
                {
                    title: 'Navigation Guide',
                    href: '/getting-started/navigation',
                    icon: Navigation,
                },
                {
                    title: 'Key Concepts',
                    href: '/getting-started/concepts',
                    icon: BookOpen,
                },
                {
                    title: 'FAQ',
                    href: '/getting-started/faq',
                    icon: HelpCircle,
                },
            ],
        },
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
            badge: 4,
            items: [
                {
                    title: 'Dashboard Components',
                    href: '/dashboard/components',
                    icon: LayoutGrid,
                },
                {
                    title: 'KPI Cards',
                    href: '/dashboard/kpi-cards',
                    icon: TrendingUp,
                },
                {
                    title: 'Charts & Graphs',
                    href: '/dashboard/charts',
                    icon: TrendingUp,
                },
                {
                    title: 'Real-time Data',
                    href: '/dashboard/real-time',
                    icon: Activity,
                },
            ],
        },
        {
            title: 'Fleet Management',
            href: '/fleet',
            icon: Truck,
            badge: 12,
            items: [
                {
                    title: 'Trucks',
                    href: '/fleet/trucks',
                    icon: Truck,
                    badge: 4,
                    items: [
                        {
                            title: 'Adding Trucks',
                            href: '/fleet/trucks/adding',
                            icon: Truck,
                        },
                        {
                            title: 'Truck Information',
                            href: '/fleet/trucks/information',
                            icon: Truck,
                        },
                        {
                            title: 'Truck Status',
                            href: '/fleet/trucks/status',
                            icon: Activity,
                        },
                        {
                            title: 'Maintenance History',
                            href: '/fleet/trucks/maintenance',
                            icon: Wrench,
                        },
                    ],
                },
                {
                    title: 'Drivers',
                    href: '/fleet/drivers',
                    icon: Users,
                    badge: 4,
                    items: [
                        {
                            title: 'Driver Registration',
                            href: '/fleet/drivers/registration',
                            icon: Users,
                        },
                        {
                            title: 'Driver Profiles',
                            href: '/fleet/drivers/profiles',
                            icon: Users,
                        },
                        {
                            title: 'License Management',
                            href: '/fleet/drivers/licenses',
                            icon: Shield,
                        },
                        {
                            title: 'Performance Tracking',
                            href: '/fleet/drivers/performance',
                            icon: TrendingUp,
                        },
                    ],
                },
                {
                    title: 'Driver-Truck Assignment',
                    href: '/fleet/assignments',
                    icon: UserCheck,
                    badge: 3,
                    items: [
                        {
                            title: 'Assigning Drivers',
                            href: '/fleet/assignments/assign',
                            icon: UserCheck,
                        },
                        {
                            title: 'Managing Assignments',
                            href: '/fleet/assignments/manage',
                            icon: UserCheck,
                        },
                        {
                            title: 'Assignment History',
                            href: '/fleet/assignments/history',
                            icon: History,
                        },
                    ],
                },
                {
                    title: 'Vehicle Types',
                    href: '/fleet/vehicle-types',
                    icon: Truck,
                },
                {
                    title: 'Cargo Types',
                    href: '/fleet/cargo-types',
                    icon: Package,
                },
            ],
        },
        {
            title: 'Operations',
            href: '/operations',
            icon: Activity,
            badge: 8,
            items: [
                {
                    title: 'Fleet Overview',
                    href: '/operations/overview',
                    icon: Truck,
                },
                {
                    title: 'Creating Operations',
                    href: '/operations/create',
                    icon: Activity,
                },
                {
                    title: 'Managing Dispatches',
                    href: '/operations/dispatches',
                    icon: Navigation,
                },
                {
                    title: 'Route Planning',
                    href: '/operations/routes',
                    icon: Navigation,
                },
                {
                    title: 'Status Management',
                    href: '/operations/status',
                    icon: Activity,
                },
                {
                    title: 'Real-time Tracking',
                    href: '/operations/tracking',
                    icon: Activity,
                },
                {
                    title: 'Performance Metrics',
                    href: '/operations/metrics',
                    icon: TrendingUp,
                },
                {
                    title: 'Dispute Resolution',
                    href: '/operations/disputes',
                    icon: AlertCircle,
                },
            ],
        },
        {
            title: 'Locations',
            href: '/locations',
            icon: MapPin,
            badge: 8,
            items: [
                {
                    title: 'Regions',
                    href: '/locations/regions',
                    icon: Globe,
                },
                {
                    title: 'Woredas (Districts)',
                    href: '/locations/woredas',
                    icon: MapPin,
                },
                {
                    title: 'Zones',
                    href: '/locations/zones',
                    icon: MapPin,
                },
                {
                    title: 'Places & Coordinates',
                    href: '/locations/places',
                    icon: MapPin,
                },
                {
                    title: 'Distance Matrix',
                    href: '/locations/distances',
                    icon: Target,
                },
                {
                    title: 'Location Categories',
                    href: '/locations/categories',
                    icon: MapPin,
                },
                {
                    title: 'Adding Locations',
                    href: '/locations/adding',
                    icon: MapPin,
                },
                {
                    title: 'Location Mapping',
                    href: '/locations/mapping',
                    icon: Globe,
                },
            ],
        },
        {
            title: 'Maintenance',
            href: '/maintenance',
            icon: Wrench,
            badge: 10,
            items: [
                {
                    title: 'Maintenance Records',
                    href: '/maintenance/records',
                    icon: Wrench,
                    badge: 4,
                    items: [
                        {
                            title: 'Creating Records',
                            href: '/maintenance/records/create',
                            icon: Wrench,
                        },
                        {
                            title: 'Viewing Records',
                            href: '/maintenance/records/view',
                            icon: Wrench,
                        },
                        {
                            title: 'Issue Tracking',
                            href: '/maintenance/records/issues',
                            icon: AlertCircle,
                        },
                        {
                            title: 'Cost Tracking',
                            href: '/maintenance/records/costs',
                            icon: DollarSign,
                        },
                    ],
                },
                {
                    title: 'Maintenance Types',
                    href: '/maintenance/types',
                    icon: Settings,
                    badge: 3,
                    items: [
                        {
                            title: 'Types Overview',
                            href: '/maintenance/types/overview',
                            icon: Settings,
                        },
                        {
                            title: 'Maintenance Schedules',
                            href: '/maintenance/types/schedules',
                            icon: Activity,
                        },
                        {
                            title: 'Inspection Items',
                            href: '/maintenance/types/inspections',
                            icon: Settings,
                        },
                    ],
                },
                {
                    title: 'Scheduled Maintenance',
                    href: '/maintenance/scheduled',
                    icon: Activity,
                },
                {
                    title: 'Preventive Maintenance',
                    href: '/maintenance/preventive',
                    icon: Shield,
                },
                {
                    title: 'Corrective Maintenance',
                    href: '/maintenance/corrective',
                    icon: Wrench,
                },
                {
                    title: 'Vendor Management',
                    href: '/maintenance/vendors',
                    icon: Building2,
                },
                {
                    title: 'Overdue Alerts',
                    href: '/maintenance/alerts',
                    icon: AlertCircle,
                },
            ],
        },
        {
            title: 'Fuel Management',
            href: '/fuel',
            icon: Fuel,
            badge: 7,
            items: [
                {
                    title: 'Fuel Records',
                    href: '/fuel/records',
                    icon: Fuel,
                },
                {
                    title: 'Consumption Tracking',
                    href: '/fuel/consumption',
                    icon: Fuel,
                },
                {
                    title: 'Fuel Expenses',
                    href: '/fuel/expenses',
                    icon: DollarSign,
                },
                {
                    title: 'Fuel Efficiency',
                    href: '/fuel/efficiency',
                    icon: TrendingUp,
                },
                {
                    title: 'Refueling History',
                    href: '/fuel/history',
                    icon: History,
                },
                {
                    title: 'Fuel Types',
                    href: '/fuel/types',
                    icon: Settings,
                },
                {
                    title: 'Cost Analysis',
                    href: '/fuel/analysis',
                    icon: DollarSign,
                },
            ],
        },
        {
            title: 'Analytics & Performance',
            href: '/analytics',
            icon: TrendingUp,
            badge: 14,
            items: [
                {
                    title: 'Driver Performance',
                    href: '/analytics/driver-performance',
                    icon: Users,
                    badge: 4,
                    items: [
                        {
                            title: 'Performance Metrics',
                            href: '/analytics/driver-performance/metrics',
                            icon: TrendingUp,
                        },
                        {
                            title: 'Safety Scores',
                            href: '/analytics/driver-performance/safety',
                            icon: Shield,
                        },
                        {
                            title: 'Efficiency Ratings',
                            href: '/analytics/driver-performance/efficiency',
                            icon: TrendingUp,
                        },
                        {
                            title: 'Incident History',
                            href: '/analytics/driver-performance/incidents',
                            icon: AlertCircle,
                        },
                    ],
                },
                {
                    title: 'Driver Safety',
                    href: '/analytics/driver-safety',
                    icon: Shield,
                    badge: 3,
                    items: [
                        {
                            title: 'Safety Incidents',
                            href: '/analytics/driver-safety/incidents',
                            icon: AlertCircle,
                        },
                        {
                            title: 'Training Records',
                            href: '/analytics/driver-safety/training',
                            icon: BookOpen,
                        },
                        {
                            title: 'Compliance Status',
                            href: '/analytics/driver-safety/compliance',
                            icon: Shield,
                        },
                    ],
                },
                {
                    title: 'Vehicle Performance',
                    href: '/analytics/vehicle-performance',
                    icon: Truck,
                },
                {
                    title: 'Financial Analytics',
                    href: '/analytics/financial',
                    icon: DollarSign,
                    badge: 4,
                    items: [
                        {
                            title: 'Revenue Tracking',
                            href: '/analytics/financial/revenue',
                            icon: DollarSign,
                        },
                        {
                            title: 'Expense Analysis',
                            href: '/analytics/financial/expenses',
                            icon: DollarSign,
                        },
                        {
                            title: 'Profit Margins',
                            href: '/analytics/financial/profit',
                            icon: TrendingUp,
                        },
                        {
                            title: 'Cost Metrics',
                            href: '/analytics/financial/costs',
                            icon: DollarSign,
                        },
                    ],
                },
                {
                    title: 'Outsource Performance',
                    href: '/analytics/outsource',
                    icon: UserCheck,
                },
            ],
        },
        {
            title: 'Reports',
            href: '/reports',
            icon: FileText,
            badge: 18,
            items: [
                {
                    title: 'Maintenance Reports',
                    href: '/reports/maintenance',
                    icon: Wrench,
                },
                {
                    title: 'Fuel Efficiency & Cost',
                    href: '/reports/fuel-efficiency',
                    icon: Fuel,
                },
                {
                    title: 'Customer Profitability',
                    href: '/reports/customer-profitability',
                    icon: DollarSign,
                },
                {
                    title: 'Outsource Performance',
                    href: '/reports/outsource-performance',
                    icon: Activity,
                },
                {
                    title: 'Operation Profitability',
                    href: '/reports/operation-profitability',
                    icon: DollarSign,
                },
                {
                    title: 'Geographic Heatmaps',
                    href: '/reports/geography-heatmaps',
                    icon: Globe,
                },
                {
                    title: 'Truck Grading',
                    href: '/reports/truck-grading',
                    icon: TrendingUp,
                },
                {
                    title: 'Performance Reports',
                    href: '/reports/performance',
                    icon: TrendingUp,
                    badge: 4,
                    items: [
                        {
                            title: 'All Performance',
                            href: '/reports/performance/all',
                            icon: TrendingUp,
                        },
                        {
                            title: 'By Driver',
                            href: '/reports/performance/driver',
                            icon: Users,
                        },
                        {
                            title: 'By Truck',
                            href: '/reports/performance/truck',
                            icon: Truck,
                        },
                        {
                            title: 'By Status',
                            href: '/reports/performance/status',
                            icon: Activity,
                        },
                    ],
                },
                {
                    title: 'Custom Reports',
                    href: '/reports/custom',
                    icon: FileText,
                },
                {
                    title: 'Report Scheduling',
                    href: '/reports/scheduling',
                    icon: Activity,
                },
            ],
        },
        {
            title: 'Administration',
            href: '/admin',
            icon: Settings,
            badge: 9,
            items: [
                {
                    title: 'Users Management',
                    href: '/admin/users',
                    icon: Users,
                    badge: 3,
                    items: [
                        {
                            title: 'User Registration',
                            href: '/admin/users/registration',
                            icon: Users,
                        },
                        {
                            title: 'User Roles',
                            href: '/admin/users/roles',
                            icon: Shield,
                        },
                        {
                            title: 'Access Control',
                            href: '/admin/users/access',
                            icon: Shield,
                        },
                    ],
                },
                {
                    title: 'Roles & Permissions',
                    href: '/admin/roles',
                    icon: Shield,
                    badge: 3,
                    items: [
                        {
                            title: 'Role Definitions',
                            href: '/admin/roles/definitions',
                            icon: Shield,
                        },
                        {
                            title: 'Permission Hierarchy',
                            href: '/admin/roles/permissions',
                            icon: Shield,
                        },
                        {
                            title: 'Custom Roles',
                            href: '/admin/roles/custom',
                            icon: Shield,
                        },
                    ],
                },
                {
                    title: 'Notifications',
                    href: '/admin/notifications',
                    icon: Bell,
                },
                {
                    title: 'Activity Logs',
                    href: '/admin/activity-logs',
                    icon: History,
                },
                {
                    title: 'Backups',
                    href: '/admin/backups',
                    icon: Settings,
                },
                {
                    title: 'System Settings',
                    href: '/admin/settings',
                    icon: Settings,
                },
            ],
        },
        {
            title: 'User Profile',
            href: '/profile',
            icon: Users,
            badge: 5,
            items: [
                {
                    title: 'Profile Settings',
                    href: '/profile/settings',
                    icon: Users,
                },
                {
                    title: 'Password Management',
                    href: '/profile/password',
                    icon: Shield,
                },
                {
                    title: 'Two-Factor Auth',
                    href: '/profile/2fa',
                    icon: Shield,
                },
                {
                    title: 'Account Security',
                    href: '/profile/security',
                    icon: Shield,
                },
                {
                    title: 'Appearance/Theme',
                    href: '/profile/appearance',
                    icon: Settings,
                },
            ],
        },
        {
            title: 'Troubleshooting',
            href: '/troubleshooting',
            icon: AlertCircle,
            badge: 8,
            items: [
                {
                    title: 'Common Issues',
                    href: '/troubleshooting/common',
                    icon: AlertCircle,
                },
                {
                    title: 'Error Messages',
                    href: '/troubleshooting/errors',
                    icon: AlertCircle,
                },
                {
                    title: 'Performance Issues',
                    href: '/troubleshooting/performance',
                    icon: TrendingUp,
                },
                {
                    title: 'Data Issues',
                    href: '/troubleshooting/data',
                    icon: AlertCircle,
                },
                {
                    title: 'Login Issues',
                    href: '/troubleshooting/login',
                    icon: Shield,
                },
                {
                    title: 'Permission Issues',
                    href: '/troubleshooting/permissions',
                    icon: Shield,
                },
                {
                    title: 'Integration Issues',
                    href: '/troubleshooting/integration',
                    icon: Activity,
                },
                {
                    title: 'Contact Support',
                    href: '/troubleshooting/support',
                    icon: HelpCircle,
                },
            ],
        },
    ];
};

interface HelpSidebarProps {
    className?: string;
}

export const HelpSidebar = React.memo(function HelpSidebar({ className }: HelpSidebarProps) {
    const helpNavItems = React.useMemo(() => getHelpNavItems(), []);

    return (
        <Sidebar collapsible="icon" variant="inset" className={className}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="mb-2">
                            <Link href="/help" prefetch>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                                        <HelpCircle className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold">Help Center</span>
                                        <span className="text-xs text-muted-foreground">Documentation</span>
                                    </div>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <HelpNavMain items={helpNavItems} />
            </SidebarContent>
        </Sidebar>
    );
});

