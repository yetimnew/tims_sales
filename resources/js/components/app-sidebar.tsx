import * as React from 'react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { useTranslation } from 'react-i18next';
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
// Lazy load icons to improve initial bundle size
import {
    LayoutGrid,
    Truck,
    Users,
    Activity,
    Building2,
    MapPin,
    Settings,
    FileText,
    User,
    UserCheck,
    Shield,
    BarChart3,
    Globe,
    Navigation,
    Map,
    Target,
    DollarSign,
    Wrench,
    Fuel,
    Package,
    ClipboardCheck,
    LineChart,
    AlertTriangle,
    Bell,
    History,
    Database,
    HelpCircle,
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

const getMainNavItems = (
    currentUrl: string,
    translate: (key: string) => string,
): NavItem[] => {
    return [
            {
                title: translate('sidebar.dashboard'),
                href: '/dashboard',
                icon: LayoutGrid,
            },
            {
                title: translate('sidebar.fleetManagement'),
                icon: Truck,
                isActive:
                    currentUrl.startsWith('/trucks') ||
                    currentUrl.startsWith('/drivers') ||
                    currentUrl.startsWith('/driver-trucks') ||
                    currentUrl.startsWith('/vehicletypes') ||
                    // currentUrl.startsWith('/fuel') ||
                    currentUrl.startsWith('/driver-performance') ||
                    currentUrl.startsWith('/driver-safety') ||
                    currentUrl.startsWith('/cargo-types') ||
                    currentUrl.startsWith('/truck-status-board'),
                items: [
                    {
                        title: translate('sidebar.trucks'),
                        href: '/trucks',
                        icon: Truck,
                        requiredPermissions: ['trucks.view', 'trucks.show'],
                    },
                    {
                        title: translate('sidebar.drivers'),
                        href: '/drivers',
                        icon: Users,
                        requiredPermissions: ['drivers.view', 'drivers.show'],
                    },
                    {
                        title: translate('sidebar.driverTruckAssignments'),
                        href: '/driver-trucks',
                        icon: UserCheck,
                        requiredPermissions: ['driver-trucks.view', 'driver-trucks.show'],
                    },
                    {
                        title: translate('sidebar.vehicleTypes'),
                        href: '/vehicletypes',
                        icon: Settings,
                        requiredPermissions: ['vehicletypes.view', 'vehicletypes.show'],
                    },
                    /*
                    {
                        title: 'Fuel Records',
                        href: '/fuel',
                        icon: Fuel,
                        requiredPermissions: ['fuel.view', 'fuel.show'],
                    },
                    */
                    {
                        title: translate('sidebar.driverSafety'),
                        href: '/driver-safety',
                        icon: Shield,
                        requiredPermissions: ['driver-safety.view', 'driver-safety.show'],
                    },
                    {
                        title: translate('sidebar.cargoTypes'),
                        href: '/cargo-types',
                        icon: Package,
                        requiredPermissions: ['cargotypes.view', 'cargotypes.show'],
                    },
                ],
            },
            {
                title: translate('sidebar.maintenance'),
                icon: Wrench,
                isActive:
                    currentUrl.startsWith('/maintenance') ||
                    currentUrl.startsWith('/maintenance-overview') ||
                    currentUrl.startsWith('/maintenance-types'),
                items: [
                    {
                        title: translate('sidebar.maintenanceRecords'),
                        href: '/maintenance',
                        icon: ClipboardCheck,
                        requiredPermissions: ['maintenance.view', 'maintenance.show'],
                    },
                    {
                        title: translate('sidebar.overview'),
                        href: '/maintenance-overview',
                        icon: LineChart,
                        requiredPermissions: ['maintenance.view', 'maintenance.show'],
                    },
                    {
                        title: translate('sidebar.maintenanceTypes'),
                        href: '/maintenance-types',
                        icon: Settings,
                        requiredPermissions: ['maintenance-types.view', 'maintenance-types.show'],
                    },
                    {
                        title: translate('sidebar.overdueAlerts'),
                        href: '/maintenance/alerts',
                        icon: AlertTriangle,
                        requiredPermissions: ['maintenance.view', 'maintenance.show'],
                    },
                ],
            },
            /*
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
            */
            {
                title: translate('sidebar.operations'),
                icon: Activity,
                isActive:
                    currentUrl.startsWith('/operations') ||
                    currentUrl.startsWith('/performances') ||
                    currentUrl.startsWith('/customers'),
                items: [
                    {
                        title: translate('sidebar.operations'),
                        href: '/operations',
                        icon: Activity,
                        requiredPermissions: ['operations.view', 'operations.show'],
                    },
                    {
                        title: translate('sidebar.performances'),
                        href: '/performances',
                        icon: BarChart3,
                        requiredPermissions: ['performances.view', 'performances.show'],
                    },
                    {
                        title: translate('sidebar.customers'),
                        href: '/customers',
                        icon: Building2,
                        requiredPermissions: ['customers.view', 'customers.show'],
                    },
                ],
            },
            {
                title: translate('sidebar.geographicManagement'),
                icon: Globe,
                isActive:
                    currentUrl.startsWith('/regions') ||
                    currentUrl.startsWith('/zones') ||
                    currentUrl.startsWith('/woredas') ||
                    currentUrl.startsWith('/places') ||
                    currentUrl.startsWith('/distances'),
                items: [
                    {
                        title: translate('sidebar.regions'),
                        href: '/regions',
                        icon: Globe,
                        requiredPermissions: ['regions.view', 'regions.show'],
                    },
                    {
                        title: translate('sidebar.zones'),
                        href: '/zones',
                        icon: Navigation,
                        requiredPermissions: ['zones.view', 'zones.show'],
                    },
                    {
                        title: translate('sidebar.woredas'),
                        href: '/woredas',
                        icon: Map,
                        requiredPermissions: ['woredas.view', 'woredas.show'],
                    },
                    {
                        title: translate('sidebar.places'),
                        href: '/places',
                        icon: MapPin,
                        requiredPermissions: ['places.view', 'places.show'],
                    },
                    {
                        title: translate('sidebar.distances'),
                        href: '/distances',
                        icon: Target,
                        requiredPermissions: ['distances.view', 'distances.show'],
                    },
                ],
            },
            {
                title: translate('sidebar.statusManagement'),
                icon: Settings,
                isActive:
                    currentUrl.startsWith('/statustypes') ||
                    currentUrl.startsWith('/truck-status-board'),
                items: [
                    {
                        title: translate('sidebar.statusTypeRegistration'),
                        href: '/statustypes',
                        icon: Settings,
                        requiredPermissions: ['statustypes.view', 'statustypes.show'],
                    },
                    {
                        title: translate('sidebar.dailyTruckStatusRegistration'),
                        href: '/truck-status-board',
                        icon: Activity,
                        requiredPermissions: ['truck-status-board.view'],
                    },
                ],
            },
            {
                title: translate('sidebar.outsourcing'),
                icon: UserCheck,
                isActive:
                    currentUrl.startsWith('/outsources') ||
                    currentUrl.startsWith('/outsource-performances'),
                items: [
                    {
                        title: translate('sidebar.outsources'),
                        href: '/outsources',
                        icon: UserCheck,
                        requiredPermissions: ['outsources.view', 'outsources.show'],
                    },
                    {
                        title: translate('sidebar.outsourcePerformances'),
                        href: '/outsource-performances',
                        icon: Activity,
                        requiredPermissions: ['outsource-performances.view', 'outsource-performances.show'],
                    },
                ],
            },
            {
                title: translate('sidebar.reports'),
                icon: FileText,
                isActive: currentUrl.startsWith('/reports'),
                items: [
                    {
                        title: translate('sidebar.maintenanceReports'),
                        href: '/reports/maintenance',
                        icon: Wrench,
                        requiredPermissions: ['reports.maintenance.view'],
                    },
                    {
                        title: translate('sidebar.fuelEfficiencyCost'),
                        href: '/reports/fuel-efficiency',
                        icon: Fuel,
                        requiredPermissions: ['reports.fuel-efficiency.view'],
                    },
                    {
                        title: translate('sidebar.customerProfitability'),
                        href: '/reports/customer-profitability',
                        icon: DollarSign,
                        requiredPermissions: ['reports.customer-profitability.view'],
                    },
                    {
                        title: translate('sidebar.outsourcePerformance'),
                        href: '/reports/outsource-performance',
                        icon: Activity,
                        requiredPermissions: ['reports.outsource-performance.view'],
                    },
                    {
                        title: translate('sidebar.operationProfitability'),
                        href: '/reports/operation-profitability',
                        icon: DollarSign,
                        requiredPermissions: ['reports.operation-profitability.view'],
                    },
                    {
                        title: translate('sidebar.routeProfitability'),
                        href: '/reports/route-profitability',
                        icon: Navigation,
                        requiredPermissions: ['reports.route-profitability.view'],
                    },
                    {
                        title: translate('sidebar.costPerKilometer'),
                        href: '/reports/cost-per-kilometer',
                        icon: MapPin,
                        requiredPermissions: ['reports.cost-per-kilometer.view'],
                    },
                    {
                        title: translate('sidebar.loadFactorUtilization'),
                        href: '/reports/load-factor-utilization',
                        icon: Map,
                        requiredPermissions: ['reports.load-factor-utilization.view'],
                    },
                    {
                        title: translate('sidebar.geographicHeatmaps'),
                        href: '/reports/geography-heatmaps',
                        icon: Globe,
                        requiredPermissions: ['reports.geography-heatmaps.view'],
                    },
                    {
                        title: translate('sidebar.truckGrading'),
                        href: '/reports/truck-grading',
                        icon: BarChart3,
                        requiredPermissions: ['reports.truck-grading.view'],
                    },
                    {
                        title: translate('sidebar.driverGrading'),
                        href: '/reports/driver-grading',
                        icon: User,
                        requiredPermissions: ['reports.driver-grading.view'],
                    },
                    {
                        title: translate('sidebar.driverTruckGrading'),
                        href: '/reports/driver-truck-grading',
                        icon: Users,
                        requiredPermissions: ['reports.driver-truck-grading.view'],
                    },
                    {
                        title: translate('sidebar.driverSafetyReport'),
                        href: '/reports/driver-safety',
                        icon: Shield,
                        requiredPermissions: ['reports.driver-safety.view'],
                    },
                    {
                        title: translate('sidebar.performanceAll'),
                        href: '/reports/performance-all',
                        icon: Activity,
                        requiredPermissions: ['reports.performance-all.view'],
                    },
                    {
                        title: translate('sidebar.performanceByDriver'),
                        href: '/reports/performance-by-driver',
                        icon: Users,
                        requiredPermissions: ['reports.performance-by-driver.view'],
                    },
                    {
                        title: translate('sidebar.performanceByTruck'),
                        href: '/reports/performance-by-truck',
                        icon: Truck,
                        requiredPermissions: ['reports.performance-by-truck.view'],
                    },
                    {
                        title: translate('sidebar.performanceByStatus'),
                        href: '/reports/performance-by-status',
                        icon: Activity,
                        requiredPermissions: ['reports.performance-by-status.view'],
                    },
                    {
                        title: translate('sidebar.attachDetachHistory'),
                        href: '/reports/driver-truck-attach-detach',
                        icon: Users,
                        requiredPermissions: ['reports.attach-detach.view'],
                    },
                    {
                        title: translate('sidebar.dailyStatusReport'),
                        href: '/reports/daily-status',
                        icon: BarChart3,
                        requiredPermissions: ['reports.daily-status.view'],
                    },
                ],
            },
            {
                title: translate('sidebar.grading'),
                icon: LineChart,
                isActive:
                    currentUrl.startsWith('/settings/truck-grading') ||
                    currentUrl.startsWith('/settings/driver-grading') ||
                    currentUrl.startsWith('/settings/driver-truck-grading'),
                items: [
                    {
                        title: translate('sidebar.truckGrading'),
                        href: '/settings/truck-grading',
                        icon: BarChart3,
                        requiredPermissions: ['performances.view', 'performances.show'],
                    },
                    {
                        title: translate('sidebar.driverGrading'),
                        href: '/settings/driver-grading',
                        icon: UserCheck,
                        requiredPermissions: ['drivers.view', 'drivers.show'],
                    },
                    {
                        title: translate('sidebar.driverTruckGrading'),
                        href: '/settings/driver-truck-grading',
                        icon: Users,
                        requiredPermissions: ['driver-trucks.view', 'driver-trucks.show'],
                    },
                ],
            },
            {
                title: translate('sidebar.activityLogs'),
                href: '/activity-logs',
                icon: History,
                requiredPermissions: ['activity-logs.view'],
                isActive: currentUrl.startsWith('/activity-logs'),
            },
            {
                title: translate('sidebar.userManagement'),
                icon: Shield,
                isActive:
                    currentUrl.startsWith('/users') ||
                    currentUrl.startsWith('/roles') ||
                    currentUrl.startsWith('/permissions') ||
                    currentUrl.startsWith('/notifications/preferences'),
                items: [
                    {
                        title: translate('sidebar.users'),
                        href: '/users',
                        icon: Users,
                        requiredPermissions: ['users.view', 'users.show'],
                    },
                    {
                        title: translate('sidebar.roles'),
                        href: '/roles',
                        icon: Shield,
                        requiredPermissions: ['roles.view', 'roles.show'],
                    },
                    {
                        title: translate('sidebar.permissions'),
                        href: '/permissions',
                        icon: UserCheck,
                        requiredPermissions: ['permissions.view', 'permissions.show'],
                    },
                    {
                        title: translate('sidebar.notificationAssignments'),
                        href: '/notifications/preferences',
                        icon: Bell,
                        requiredPermissions: ['users.update'],
                    },
                ],
            },
            {
                title: translate('sidebar.systemBackups'),
                href: '/settings/backups',
                icon: Database,
                requiredPermissions: ['system.backup'],
                isActive: currentUrl.startsWith('/settings/backups'),
            },
            {
                title: translate('sidebar.helpDocumentation'),
                href: '/help',
                icon: HelpCircle,
                requiredPermissions: undefined, // Available to all users - no permission check
                isActive: currentUrl.startsWith('/help'),
            },
        ];
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

export const AppSidebar = React.memo(function AppSidebar({ className }: AppSidebarProps) {
    const { permissions } = usePermissions();
    const { t } = useTranslation();
    const page = usePage();
    const currentUrl = page?.url ?? (typeof window !== 'undefined' ? window.location.pathname : '/');

    // Memoize nav items to prevent recreation on every render
    const mainNavItems = React.useMemo(() => getMainNavItems(currentUrl, t), [currentUrl, t]);

    // Memoize permissions set to prevent recreation
    const permissionsSet = React.useMemo(() => new Set(permissions), [permissions]);

    const filteredItems = React.useMemo(() => {
        try {
            return filterNavItems(mainNavItems, permissionsSet);
        } catch (error) {
            console.error('Error filtering sidebar items:', error);
            return [];
        }
    }, [mainNavItems, permissionsSet]);

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
});
