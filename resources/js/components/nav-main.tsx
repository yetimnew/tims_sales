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
import { resolveUrl } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();

    // Safety check
    if (!page || !page.url) {
        console.warn('⚠️ NavMain: page or page.url is undefined', { page });
        return null;
    }

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    // Check if this item has subitems (nested menu)
                    const subitems = Array.isArray(item.items) ? item.items : [];
                    const hasSubitems = subitems.length > 0;
                    const itemHref = item.href ?? '#';
                    const resolvedItemHref = item.href
                        ? resolveUrl(item.href)
                        : null;

                    if (hasSubitems) {
                        return (
                            <Collapsible
                                key={item.title}
                                asChild
                                defaultOpen={item.isActive}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip={{ children: item.title }}
                                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                        >
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
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
                                                return (
                                                    <SidebarMenuSubItem key={subitem.title}>
                                                        <SidebarMenuButton
                                                            asChild
                                                            isActive={resolvedSubitemHref
                                                                ? page.url.startsWith(
                                                                      resolvedSubitemHref,
                                                                  )
                                                                : false}
                                                            size="sm"
                                                        >
                                                            <Link href={subitemHref} prefetch>
                                                                {subitem.icon && <subitem.icon />}
                                                                <span>{subitem.title}</span>
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
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={resolvedItemHref
                                    ? page.url.startsWith(resolvedItemHref)
                                    : false}
                                tooltip={{ children: item.title }}
                            >
                                <Link href={itemHref} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
