import * as React from 'react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

export interface HelpNavItem {
    title: string;
    href?: string;
    icon?: React.ComponentType<{ className?: string }>;
    items?: HelpNavItem[];
    badge?: string | number;
}

interface HelpNavMainProps {
    items: HelpNavItem[];
}

const resolveUrl = (href: string | undefined): string | null => {
    if (!href) return null;
    if (href.startsWith('http')) return href;
    return `/help${href.startsWith('/') ? href : '/' + href}`;
};

export const HelpNavMain = React.memo(function HelpNavMain({ items = [] }: HelpNavMainProps) {
    const page = usePage();

    // Safety check
    if (!page || !page.url) {
        console.warn('⚠️ HelpNavMain: page or page.url is undefined', { page });
        return null;
    }

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Help & Documentation</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    // Check if this item has subitems (nested menu)
                    const subitems = Array.isArray(item.items) ? item.items : [];
                    const hasSubitems = subitems.length > 0;
                    const itemHref = item.href ?? '#';
                    const resolvedItemHref = item.href ? resolveUrl(item.href) : null;

                    // Check if any subitem matches the current URL
                    const isParentActive = hasSubitems && subitems.some((subitem) => {
                        const subitemHref = subitem.href ? resolveUrl(subitem.href) : null;
                        return subitemHref && page.url.startsWith(subitemHref);
                    });

                    if (hasSubitems) {
                        return (
                            <Collapsible
                                key={item.title}
                                asChild
                                defaultOpen={isParentActive}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip={{ children: item.title }}
                                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                        >
                                            {item.icon && <item.icon className="h-4 w-4" />}
                                            <span>{item.title}</span>
                                            {item.badge && (
                                                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                                                    {item.badge}
                                                </span>
                                            )}
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {subitems.map((subitem) => {
                                                const subitemHref = subitem.href ?? '#';
                                                const resolvedSubitemHref = subitem.href
                                                    ? resolveUrl(subitem.href)
                                                    : null;
                                                const isActive = resolvedSubitemHref
                                                    ? page.url.startsWith(resolvedSubitemHref)
                                                    : false;

                                                return (
                                                    <SidebarMenuSubItem key={subitem.title}>
                                                        <SidebarMenuButton
                                                            asChild
                                                            isActive={isActive}
                                                            size="sm"
                                                        >
                                                            <Link href={resolvedSubitemHref || subitemHref} prefetch>
                                                                {subitem.icon && <subitem.icon className="h-4 w-4" />}
                                                                <span>{subitem.title}</span>
                                                                {subitem.badge && (
                                                                    <span className="ml-auto rounded-full bg-secondary px-1.5 py-0.5 text-xs font-semibold">
                                                                        {subitem.badge}
                                                                    </span>
                                                                )}
                                                            </Link>
                                                        </SidebarMenuButton>
                                                    </SidebarMenuSubItem>
                                                );
                                            })}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        );
                    }

                    // Regular menu item without subitems
                    const isActive = resolvedItemHref ? page.url.startsWith(resolvedItemHref) : false;

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={{ children: item.title }}
                            >
                                <Link href={resolvedItemHref || itemHref} prefetch>
                                    {item.icon && <item.icon className="h-4 w-4" />}
                                    <span>{item.title}</span>
                                    {item.badge && (
                                        <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
});

