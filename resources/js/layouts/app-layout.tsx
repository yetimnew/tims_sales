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
