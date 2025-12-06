import * as React from 'react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { usePermissions } from '@/hooks/use-permissions';
import {
    BookOpen,
    Folder,
    LayoutGrid,
    Truck,
    Users,
    Activity,
    Building2,
    MapPin,
    Settings,
    FileText,
    UserCheck,
    Shield,
    BarChart3,
    Globe,
    Navigation,
    Map,
    Target,
    Calendar,
    DollarSign,
    Wrench,
    Fuel,
    Package,
    ClipboardCheck,
    LineChart,
    AlertTriangle,
    Bell
} from 'lucide-react';
import AppLogo from './app-logo';

const filterNavItems = (items: NavItem[], permissions: Set<string>): NavItem[] => {
    return items.reduce<NavItem[]>((visibleItems, item) => {
        const filteredChildren = item.items ? filterNavItems(item.items, permissions) : undefined;
        const hasRequiredPermission =
            !item.requiredPermissions ||
            item.requiredPermissions.length === 0 ||
            item.requiredPermissions.some(permission => permissions.has(permission));

        const shouldInclude = hasRequiredPermission && (!item.items || (filteredChildren && filteredChildren.length > 0));

        if (shouldInclude) {
            visibleItems.push({
                ...item,
                items: filteredChildren,
            });
        }

        return visibleItems;
    }, []);
};

const getMainNavItems = (currentUrl: string): NavItem[] => {
    try {
        return [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Fleet Management',
                icon: Truck,
                isActive:
                    currentUrl.startsWith('/trucks') ||
                    currentUrl.startsWith('/drivers') ||
                    currentUrl.startsWith('/driver-trucks') ||
                    currentUrl.startsWith('/vehicletypes') ||
                    currentUrl.startsWith('/fuel') ||
                    currentUrl.startsWith('/driver-performance') ||
                    currentUrl.startsWith('/driver-safety') ||
                    currentUrl.startsWith('/cargo-types') ||
                    currentUrl.startsWith('/truck-status-board'),
                items: [
                    {
                        title: 'Trucks',
                        href: '/trucks',
                        icon: Truck,
                        requiredPermissions: ['trucks.view', 'trucks.show'],
                    },
                    {
                        title: 'Drivers',
                        href: '/drivers',
                        icon: Users,
                        requiredPermissions: ['drivers.view', 'drivers.show'],
                    },
                    {
                        title: 'Driver-Truck Assignments',
                        href: '/driver-trucks',
                        icon: UserCheck,
                        requiredPermissions: ['driver-trucks.view', 'driver-trucks.show'],
                    },
                    {
                        title: 'Vehicle Types',
                        href: '/vehicletypes',
                        icon: Settings,
                        requiredPermissions: ['vehicletypes.view', 'vehicletypes.show'],
                    },
                    {
                        title: 'Fuel Records',
                        href: '/fuel',
                        icon: Fuel,
                        requiredPermissions: ['fuel.view', 'fuel.show'],
                    },
                    {
                        title: 'Driver Safety',
                        href: '/driver-safety',
                        icon: Shield,
                        requiredPermissions: ['driver-safety.view', 'driver-safety.show'],
                    },
                    {
                        title: 'Cargo Types',
                        href: '/cargo-types',
                        icon: Package,
                        requiredPermissions: ['cargotypes.view', 'cargotypes.show'],
                    },
                ],
            },
            {
                title: 'Maintenance',
                icon: Wrench,
                isActive:
                    currentUrl.startsWith('/maintenance') ||
                    currentUrl.startsWith('/maintenance-overview') ||
                    currentUrl.startsWith('/maintenance-types'),
                items: [
                    {
                        title: 'Maintenance Records',
                        href: '/maintenance',
                        icon: ClipboardCheck,
                        requiredPermissions: ['maintenance.view', 'maintenance.show'],
                    },
                    {
                        title: 'Overview',
                        href: '/maintenance-overview',
                        icon: LineChart,
                        requiredPermissions: ['maintenance.view', 'maintenance.show'],
                    },
                    {
                        title: 'Maintenance Types',
                        href: '/maintenance-types',
                        icon: Settings,
                        requiredPermissions: ['maintenance-types.view', 'maintenance-types.show'],
                    },
                    {
                        title: 'Overdue & Alerts',
                        href: '/maintenance/alerts',
                        icon: AlertTriangle,
                        requiredPermissions: ['maintenance.view', 'maintenance.show'],
                    },
                ],
            },
            {
                title: 'Financial Management',
                icon: DollarSign,
                isActive:
                    currentUrl.startsWith('/financial') || currentUrl.startsWith('/route-plans'),
                items: [
                    {
                        title: 'Financial Records',
                        href: '/financial',
                        icon: DollarSign,
                        requiredPermissions: ['financial.view', 'financial.show'],
                    },
                    {
                        title: 'Route Planning',
                        href: '/route-plans',
                        icon: Navigation,
                        requiredPermissions: ['route-plans.view', 'route-plans.show'],
                    },
                ],
            },
            {
                title: 'Operations',
                icon: Activity,
                isActive:
                    currentUrl.startsWith('/operations') ||
                    currentUrl.startsWith('/performances') ||
                    currentUrl.startsWith('/customers'),
                items: [
                    {
                        title: 'Operations',
                        href: '/operations',
                        icon: Activity,
                        requiredPermissions: ['operations.view', 'operations.show'],
                    },
                    {
                        title: 'Performances',
                        href: '/performances',
                        icon: BarChart3,
                        requiredPermissions: ['performances.view', 'performances.show'],
                    },
                    {
                        title: 'Customers',
                        href: '/customers',
                        icon: Building2,
                        requiredPermissions: ['customers.view', 'customers.show'],
                    },
                ],
            },
            {
                title: 'Geographic Management',
                icon: Globe,
                isActive:
                    currentUrl.startsWith('/regions') ||
                    currentUrl.startsWith('/zones') ||
                    currentUrl.startsWith('/woredas') ||
                    currentUrl.startsWith('/places') ||
                    currentUrl.startsWith('/distances'),
                items: [
                    {
                        title: 'Regions',
                        href: '/regions',
                        icon: Globe,
                        requiredPermissions: ['regions.view', 'regions.show'],
                    },
                    {
                        title: 'Zones',
                        href: '/zones',
                        icon: Navigation,
                        requiredPermissions: ['zones.view', 'zones.show'],
                    },
                    {
                        title: 'Woredas',
                        href: '/woredas',
                        icon: Map,
                        requiredPermissions: ['woredas.view', 'woredas.show'],
                    },
                    {
                        title: 'Places',
                        href: '/places',
                        icon: MapPin,
                        requiredPermissions: ['places.view', 'places.show'],
                    },
                    {
                        title: 'Distances',
                        href: '/distances',
                        icon: Target,
                        requiredPermissions: ['distances.view', 'distances.show'],
                    },
                ],
            },
            {
                title: 'Status Management',
                icon: Settings,
                isActive:
                    currentUrl.startsWith('/statustypes') ||
                    currentUrl.startsWith('/truck-status-board'),
                items: [
                    {
                        title: 'Status Type Registration',
                        href: '/statustypes',
                        icon: Settings,
                        requiredPermissions: ['statustypes.view', 'statustypes.show'],
                    },
                    {
                        title: 'Daily Truck Status Registration',
                        href: '/truck-status-board',
                        icon: Activity,
                        requiredPermissions: ['truck-status-board.view'],
                    },
                ],
            },
            {
                title: 'Outsourcing',
                icon: UserCheck,
                isActive:
                    currentUrl.startsWith('/outsources') ||
                    currentUrl.startsWith('/outsource-performances'),
                items: [
                    {
                        title: 'Outsources',
                        href: '/outsources',
                        icon: UserCheck,
                        requiredPermissions: ['outsources.view', 'outsources.show'],
                    },
                    {
                        title: 'Outsource Performances',
                        href: '/outsource-performances',
                        icon: Activity,
                        requiredPermissions: ['performances.view', 'performances.show'],
                    },
                ],
            },
            {
                title: 'Reports',
                icon: FileText,
                isActive: currentUrl.startsWith('/reports'),
                items: [
                    {
                        title: 'Maintenance Reports',
                        href: '/reports/maintenance',
                        icon: Wrench,
                        requiredPermissions: ['reports.maintenance.view'],
                    },
                    {
                        title: 'Fuel Efficiency & Cost',
                        href: '/reports/fuel-efficiency',
                        icon: Fuel,
                        requiredPermissions: ['reports.fuel-efficiency.view'],
                    },
                    {
                        title: 'Customer Profitability',
                        href: '/reports/customer-profitability',
                        icon: DollarSign,
                        requiredPermissions: ['reports.customer-profitability.view'],
                    },
                    {
                        title: 'Outsource Performance',
                        href: '/reports/outsource-performance',
                        icon: Activity,
                        requiredPermissions: ['reports.outsource-performance.view'],
                    },
                    {
                        title: 'Operation Profitability',
                        href: '/reports/operation-profitability',
                        icon: DollarSign,
                        requiredPermissions: ['reports.operation-profitability.view'],
                    },
                    {
                        title: 'Geographic Heatmaps',
                        href: '/reports/geography-heatmaps',
                        icon: Globe,
                        requiredPermissions: ['reports.geography-heatmaps.view'],
                    },
                    {
                        title: 'Truck Grading',
                        href: '/reports/truck-grading',
                        icon: BarChart3,
                        requiredPermissions: ['reports.truck-grading.view'],
                    },
                    {
                        title: 'Driver Grading',
                        href: '/reports/driver-grading',
                        icon: Users,
                        requiredPermissions: ['reports.driver-grading.view'],
                    },
                    {
                        title: 'Performance (All)',
                        href: '/reports/performance-all',
                        icon: Activity,
                        requiredPermissions: ['reports.performance-all.view'],
                    },
                    {
                        title: 'Performance by Driver',
                        href: '/reports/performance-by-driver',
                        icon: Users,
                        requiredPermissions: ['reports.performance-by-driver.view'],
                    },
                    {
                        title: 'Performance by Truck',
                        href: '/reports/performance-by-truck',
                        icon: Truck,
                        requiredPermissions: ['reports.performance-by-truck.view'],
                    },
                    {
                        title: 'Performance by Model',
                        href: '/reports/performance-by-model',
                        icon: Package,
                        requiredPermissions: ['reports.performance-by-model.view'],
                    },
                    {
                        title: 'Performance by Status',
                        href: '/reports/performance-by-status',
                        icon: Activity,
                        requiredPermissions: ['reports.performance-by-status.view'],
                    },
                    {
                        title: 'Attach / Detach History',
                        href: '/reports/driver-truck-attach-detach',
                        icon: Users,
                        requiredPermissions: ['reports.attach-detach.view'],
                    },
                ],
            },
            {
                title: 'Grading',
                icon: LineChart,
                isActive: currentUrl.startsWith('/settings/truck-grading'),
                items: [
                    {
                        title: 'Truck Grading',
                        href: '/settings/truck-grading',
                        icon: BarChart3,
                        requiredPermissions: ['performances.view', 'performances.show'],
                    },
                ],
            },
            {
                title: 'User Management',
                icon: Shield,
                isActive:
                    currentUrl.startsWith('/users') ||
                    currentUrl.startsWith('/roles') ||
                    currentUrl.startsWith('/permissions') ||
                    currentUrl.startsWith('/notifications/preferences'),
                items: [
                    {
                        title: 'Users',
                        href: '/users',
                        icon: Users,
                        requiredPermissions: ['users.view', 'users.show'],
                    },
                    {
                        title: 'Roles',
                        href: '/roles',
                        icon: Shield,
                        requiredPermissions: ['roles.view', 'roles.show'],
                    },
                    {
                        title: 'Permissions',
                        href: '/permissions',
                        icon: UserCheck,
                        requiredPermissions: ['permissions.view', 'permissions.show'],
                    },
                    {
                        title: 'Notification Assignments',
                        href: '/notifications/preferences',
                        icon: Bell,
                        requiredPermissions: ['users.update'],
                    },
                ],
            },
        ];
    } catch (error) {
        console.error('Error loading main nav items:', error);
        return [];
    }
};

// const footerNavItems: NavItem[] = [
//     {
//         title: 'Repository',
//         href: 'https://github.com/laravel/react-starter-kit',
//         icon: Folder,
//     },
//     {
//         title: 'Documentation',
//         href: 'https://laravel.com/docs/starter-kits#react',
//         icon: BookOpen,
//     },
// ];

interface AppSidebarProps {
    className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
    const { permissions } = usePermissions();
    const page = usePage();
    const currentUrl = page?.url ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
    const filteredItems = React.useMemo(
        () => filterNavItems(getMainNavItems(currentUrl), new Set(permissions)),
        [currentUrl, permissions],
    );

    try {
        return (
            <Sidebar collapsible="icon" variant="inset" className={className}>
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild>
                                <Link href="/dashboard" prefetch>
                                    <AppLogo />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent>
                    <NavMain items={filteredItems} />
                </SidebarContent>

                <SidebarFooter>
                    <NavUser />
                </SidebarFooter>
            </Sidebar>
        );
    } catch (error) {
        console.error('Error rendering AppSidebar:', error);
        return null;
    }
}
