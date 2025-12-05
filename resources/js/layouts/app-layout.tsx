import { AppShell } from '@/components/app-shell';
import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { Toaster } from '@/components/toaster';
import { toast } from '@/hooks/use-toast';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { router } from '@inertiajs/react';

interface AppLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const page = usePage<SharedData>();
    const { flash } = page.props as any;

    // Show success toast
    useEffect(() => {
        if (flash?.success) {
            toast({
                title: '✅ Success',
                description: flash.success,
                variant: 'success',
            });
        }
    }, [flash?.success]);

    // Show error toast
    useEffect(() => {
        if (flash?.error) {
            toast({
                title: '❌ Error',
                description: flash.error,
                variant: 'destructive',
            });
        }
    }, [flash?.error]);

    useEffect(() => {
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

            if (pathname === '/trucks') {
                window.sessionStorage.setItem('trucks.index.shouldShowSkeleton', 'true');
            }
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
                <AppContent variant="sidebar" className="overflow-x-hidden">
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                    {children}
                </AppContent>
            </AppShell>
            <Toaster />
        </>
    );
}
