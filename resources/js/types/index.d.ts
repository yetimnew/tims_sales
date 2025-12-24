import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';
import type { NotificationItem } from '../lib/notification-utils';

export interface Auth {
    user: User;
    permissions: string[];
    all_permissions: string[];
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href?: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    items?: NavItem[]; // Support for nested menu items
    requiredPermissions?: string[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    notifications?: {
        unread_count: number;
        recent: NotificationItem[];
    };
    [key: string]: unknown;
}

declare global {
    function route(name?: string, params?: Record<string, unknown> | number | string, absolute?: boolean): string;
}

export {}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
