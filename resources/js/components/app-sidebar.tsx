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
import { Link } from '@inertiajs/react';
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
    Package
} from 'lucide-react';
import AppLogo from './app-logo';

const getMainNavItems = (): NavItem[] => {
    try {
        // Get current URL for active state detection
        const currentUrl = window.location.pathname;

        return [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Fleet Management',
                icon: Truck,
                isActive: currentUrl.startsWith('/trucks') || currentUrl.startsWith('/drivers') || currentUrl.startsWith('/driver-trucks') || currentUrl.startsWith('/vehicletypes') || currentUrl.startsWith('/maintenance') || currentUrl.startsWith('/fuel') || currentUrl.startsWith('/driver-performance') || currentUrl.startsWith('/driver-safety') || currentUrl.startsWith('/cargo-types') || currentUrl.startsWith('/truck-status-board'),
                items: [
                    {
                        title: 'Trucks',
                        href: '/trucks',
                        icon: Truck,
                    },
                    {
                        title: 'Drivers',
                        href: '/drivers',
                        icon: Users,
                    },
                    {
                        title: 'Driver-Truck Assignments',
                        href: '/driver-trucks',
                        icon: UserCheck,
                    },
                    {
                        title: 'Vehicle Types',
                        href: '/vehicletypes',
                        icon: Settings,
                    },
                    {
                        title: 'Maintenance',
                        href: '/maintenance',
                        icon: Wrench,
                    },
                    {
                        title: 'Fuel Records',
                        href: '/fuel',
                        icon: Fuel,
                    },
                    {
                        title: 'Driver Safety',
                        href: '/driver-safety',
                        icon: Shield,
                    },
                    {
                        title: 'Cargo Types',
                        href: '/cargo-types',
                        icon: Package,
                    },
                ],
            },
            {
                title: 'Financial Management',
                icon: DollarSign,
                isActive: currentUrl.startsWith('/financial') || currentUrl.startsWith('/route-plans'),
                items: [
                    {
                        title: 'Financial Records',
                        href: '/financial',
                        icon: DollarSign,
                    },
                    {
                        title: 'Route Planning',
                        href: '/route-plans',
                        icon: Navigation,
                    },
                ],
            },
            {
                title: 'Operations',
                icon: Activity,
                isActive: currentUrl.startsWith('/operations') || currentUrl.startsWith('/performances') || currentUrl.startsWith('/customers'),
                items: [
                    {
                        title: 'Operations',
                        href: '/operations',
                        icon: Activity,
                    },
                    {
                        title: 'Performances',
                        href: '/performances',
                        icon: BarChart3,
                    },
                    {
                        title: 'Customers',
                        href: '/customers',
                        icon: Building2,
                    },
                ],
            },
            {
                title: 'Geographic Management',
                icon: Globe,
                isActive: currentUrl.startsWith('/regions') || currentUrl.startsWith('/zones') || currentUrl.startsWith('/woredas') || currentUrl.startsWith('/places') || currentUrl.startsWith('/distances'),
                items: [
                    {
                        title: 'Regions',
                        href: '/regions',
                        icon: Globe,
                    },
                    {
                        title: 'Zones',
                        href: '/zones',
                        icon: Navigation,
                    },
                    {
                        title: 'Woredas',
                        href: '/woredas',
                        icon: Map,
                    },
                    {
                        title: 'Places',
                        href: '/places',
                        icon: MapPin,
                    },
                    {
                        title: 'Distances',
                        href: '/distances',
                        icon: Target,
                    },
                ],
            },
            {
                title: 'Status Management',
                icon: Settings,
                isActive: currentUrl.startsWith('/statustypes') || currentUrl.startsWith('/truck-status-board'),
                items: [
                    {
                        title: 'Status Type Registration',
                        href: '/statustypes',
                        icon: Settings,
                    },
                    {
                        title: 'Daily Truck Status Registration',
                        href: '/truck-status-board',
                        icon: Activity,
                    },
                ],
            },
            {
                title: 'Outsourcing',
                icon: UserCheck,
                isActive: currentUrl.startsWith('/outsources') || currentUrl.startsWith('/outsource-performances'),
                items: [
                    {
                        title: 'Outsources',
                        href: '/outsources',
                        icon: UserCheck,
                    },
                    {
                        title: 'Outsource Performances',
                        href: '/outsource-performances',
                        icon: Activity,
                    },
                ],
            },
            {
                title: 'Reports',
                icon: FileText,
                isActive: currentUrl.startsWith('/reports'),
                items: [
                    {
                        title: 'Truck Reports',
                        href: '/reports/trucks',
                        icon: Truck,
                    },
                    {
                        title: 'Driver Reports',
                        href: '/reports/drivers',
                        icon: Users,
                    },
                    {
                        title: 'Performance Reports',
                        href: '/reports/performances',
                        icon: BarChart3,
                    },
                    {
                        title: 'Operation Reports',
                        href: '/reports/operations',
                        icon: Activity,
                    },
                    {
                        title: 'Financial Reports',
                        href: '/reports/financial',
                        icon: DollarSign,
                    },
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
                        title: 'Route & Distance Efficiency',
                        href: '/reports/route-efficiency',
                        icon: Navigation,
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
                        title: 'Capacity & Load Factor',
                        href: '/reports/capacity-load',
                        icon: Package,
                    },
                    {
                        title: 'Geographic Heatmaps',
                        href: '/reports/geography-heatmaps',
                        icon: Globe,
                    },
                    {
                        title: 'Performance (All)',
                        href: '/reports/performance-all',
                        icon: Activity,
                    },
                    {
                        title: 'Performance by Driver',
                        href: '/reports/performance-by-driver',
                        icon: Users,
                    },
                    {
                        title: 'Performance by Truck',
                        href: '/reports/performance-by-truck',
                        icon: Truck,
                    },
                    {
                        title: 'Performance by Model',
                        href: '/reports/performance-by-model',
                        icon: Package,
                    },
                    {
                        title: 'Performance by Status',
                        href: '/reports/performance-by-status',
                        icon: Activity,
                    },
                    {
                        title: 'Attach / Detach History',
                        href: '/reports/driver-truck-attach-detach',
                        icon: Users,
                    },
                ],
            },
            {
                title: 'User Management',
                icon: Shield,
                isActive: currentUrl.startsWith('/users') || currentUrl.startsWith('/roles') || currentUrl.startsWith('/permissions'),
                items: [
                    {
                        title: 'Users',
                        href: '/users',
                        icon: Users,
                    },
                    {
                        title: 'Roles',
                        href: '/roles',
                        icon: Shield,
                    },
                    {
                        title: 'Permissions',
                        href: '/permissions',
                        icon: UserCheck,
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
                    <NavMain items={getMainNavItems()} />
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
