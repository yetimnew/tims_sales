import * as React from 'react';
import { AppShell } from '@/components/app-shell';
import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { Toaster } from '@/components/toaster';
import { PageTransitionOverlay } from '@/components/page-transition-overlay';
import { toast } from '@/hooks/use-toast';
import { usePageTransitionLoading } from '@/hooks/use-page-transition-loading';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { usePage, router } from '@inertiajs/react';

const OVERLAY_DISABLED_ROOTS: string[] = [
    '/trucks', // Disable overlay for trucks page - uses skeleton loaders instead
    '/operations', // Disable overlay for operations page - uses skeleton loaders instead
    '/performances', // Disable overlay for performances page - uses skeleton loaders instead
    '/customers', // Disable overlay for customers page - uses skeleton loaders instead
    '/drivers', // Disable overlay for drivers page - uses skeleton loaders instead
    '/fuel', // Disable overlay for fuel page - uses skeleton loaders instead
    '/maintenance', // Disable overlay for maintenance page - uses skeleton loaders instead
    '/regions', // Disable overlay for regions page - uses skeleton loaders instead
    '/driver-safety', // Disable overlay for driver-safety page - uses skeleton loaders instead
    '/driver-trucks', // Disable overlay for driver-trucks page - uses skeleton loaders instead
    '/users', // Disable overlay for users page - uses skeleton loaders instead
    '/vehicletypes', // Disable overlay for vehicletypes page - uses skeleton loaders instead
    '/cargo-types', // Disable overlay for cargo-types page - uses skeleton loaders instead
    '/roles', // Disable overlay for roles page - uses skeleton loaders instead
    '/permissions', // Disable overlay for permissions page - uses skeleton loaders instead
    '/zones', // Disable overlay for zones page - uses skeleton loaders instead
    '/places', // Disable overlay for places page - uses skeleton loaders instead
    '/maintenance-types', // Disable overlay for maintenance-types page - uses skeleton loaders instead
    '/outsource-performances', // Disable overlay for outsource-performances page - uses skeleton loaders instead
    '/woredas', // Disable overlay for woredas page - uses skeleton loaders instead
    '/activity-logs', // Disable overlay for activity-logs page - uses skeleton loaders instead
    '/statuses', // Disable overlay for statuses page - uses skeleton loaders instead
    '/statustypes', // Disable overlay for statustypes page - uses skeleton loaders instead
];

interface AppLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    disableTransitionOverlay?: boolean;
}

const AppLayout = React.memo(function AppLayout({
    children,
    breadcrumbs = [],
    disableTransitionOverlay = false,
}: AppLayoutProps) {
    const page = usePage<SharedData>();
    const { flash } = page.props as any;
    const { isTransitioning } = usePageTransitionLoading();
    const normalizedPath = React.useMemo(() => {
        const rawUrl = page.url ?? '/';
        const path = rawUrl.split('?')[0];
        if (!path) {
            return '/';
        }

        return path;
    }, [page.url]);

    const isRouteDisabled = React.useMemo(() => (
        OVERLAY_DISABLED_ROOTS.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`))
    ), [normalizedPath]);

    const showOverlay = React.useMemo(() => {
        if (!isTransitioning || disableTransitionOverlay || isRouteDisabled) {
            return false;
        }

        return true;
    }, [isTransitioning, disableTransitionOverlay, isRouteDisabled]);

    // Show success toast
    React.useEffect(() => {
        if (flash?.success) {
            toast({
                title: '✅ Success',
                description: flash.success,
                variant: 'success',
            });
        }
    }, [flash?.success]);

    // Show error toast
    React.useEffect(() => {
        if (flash?.error) {
            toast({
                title: '❌ Error',
                description: flash.error,
                variant: 'destructive',
            });
        }
    }, [flash?.error]);

    React.useEffect(() => {
        const handleStart = (event: unknown) => {
            if (typeof window === 'undefined') {
                return;
            }

            const visit = (event as { detail?: { visit?: { prefetch?: boolean; url?: URL | string } } })?.detail?.visit;
            if (!visit || visit.prefetch) {
                return;
            }

            const urlLike = visit.url;
            let pathname: string | null = null;

            if (urlLike instanceof URL) {
                pathname = urlLike.pathname;
            } else if (typeof urlLike === 'string') {
                try {
                    pathname = new URL(urlLike, window.location.origin).pathname;
                } catch (error) {
                    console.error('Failed to parse visit URL for skeleton toggle', error);
                }
            }

            if (!pathname) {
                return;
            }

            const skeletonFlagByPath: Record<string, string[]> = {
                '/trucks': ['trucks.index.shouldShowSkeleton'],
                '/operations': ['operations.index.shouldShowSkeleton'],
            };

            const keys = skeletonFlagByPath[pathname];
            if (!keys) {
                return;
            }

            keys.forEach((key) => {
                window.sessionStorage.setItem(key, 'true');
            });
        };

        const unsubscribeStart = router.on('start', handleStart);

        return () => {
            unsubscribeStart();
        };
    }, []);

    return (
        <>
            <AppShell variant="sidebar">
                <AppSidebar />
                <AppContent variant="sidebar" className="relative overflow-x-hidden">
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                    <div className="relative flex flex-1 flex-col">
                        {children}
                        <PageTransitionOverlay visible={showOverlay} variant="content" />
                    </div>
                </AppContent>
            </AppShell>
            <Toaster />
        </>
    );
});

export default AppLayout;
