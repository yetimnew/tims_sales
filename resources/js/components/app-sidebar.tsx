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
import { dashboard } from '@/routes';
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
        return [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Fleet Management',
                icon: Truck,
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
                        title: 'Driver Performance',
                        href: '/driver-performance',
                        icon: BarChart3,
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
                items: [
                    {
                        title: 'Status Types',
                        href: '/statustypes',
                        icon: Settings,
                    },
                    {
                        title: 'Statuses',
                        href: '/statuses',
                        icon: Target,
                    },
                ],
            },
            {
                title: 'Outsourcing',
                icon: UserCheck,
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
                ],
            },
            {
                title: 'User Management',
                icon: Shield,
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

                {/* <SidebarFooter>
                    <NavFooter items={footerNavItems} className="mt-auto" />
                    <NavUser />
                </SidebarFooter> */}
            </Sidebar>
        );
    } catch (error) {
        console.error('Error rendering AppSidebar:', error);
        return null;
    }
}
