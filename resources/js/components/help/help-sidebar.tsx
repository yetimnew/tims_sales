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
// NOTE: Only include links to articles that actually exist!
const getHelpNavItems = (): HelpNavItem[] => {
    return [
        {
            title: 'Getting Started',
            href: '/getting-started',
            icon: BookOpen,
            badge: 1,
            items: [
                {
                    title: 'Welcome Guide',
                    href: '/getting-started/welcome',
                    icon: HelpCircle,
                },
                // More articles coming soon...
            ],
        },
        {
            title: 'Fleet Management',
            href: '/fleet',
            icon: Truck,
            badge: 1,
            items: [
                {
                    title: 'Trucks',
                    href: '/fleet/trucks',
                    icon: Truck,
                    badge: 1,
                    items: [
                        {
                            title: 'Adding Trucks',
                            href: '/fleet/trucks/adding',
                            icon: Truck,
                        },
                        // More articles coming soon...
                    ],
                },
                // More categories coming soon...
            ],
        },
        {
            title: 'Operations',
            href: '/operations',
            icon: Activity,
            badge: 1,
            items: [
                {
                    title: 'Creating Operations',
                    href: '/operations/create',
                    icon: Activity,
                },
                // More articles coming soon...
            ],
        },
        {
            title: 'Reports',
            href: '/reports',
            icon: FileText,
            badge: 1,
            items: [
                {
                    title: 'Using Report Filters',
                    href: '/reports/using-filters',
                    icon: FileText,
                },
                // More articles coming soon...
            ],
        },
        {
            title: 'Administration',
            href: '/admin',
            icon: Settings,
            badge: 1,
            items: [
                {
                    title: 'Users Management',
                    href: '/admin/users',
                    icon: Users,
                    badge: 1,
                    items: [
                        {
                            title: 'Managing Users',
                            href: '/admin/users/managing-users',
                            icon: Users,
                        },
                        // More articles coming soon...
                    ],
                },
                // More categories coming soon...
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

