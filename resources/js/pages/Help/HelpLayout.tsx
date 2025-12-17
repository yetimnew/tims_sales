import * as React from 'react';
import { Head } from '@inertiajs/react';
import { HelpSidebar } from '@/components/help/help-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

interface HelpLayoutProps {
    title: string;
    description?: string;
    children: React.ReactNode;
}

export default function HelpLayout({ title, description, children }: HelpLayoutProps) {
    return (
        <>
            <Head title={title} />
            <SidebarProvider>
                <HelpSidebar />
                <main className="flex-1 overflow-auto">
                    {/* Header Section */}
                    <div className="border-b bg-card">
                        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
                            {description && (
                                <p className="mt-2 text-lg text-muted-foreground">{description}</p>
                            )}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            {children}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t bg-muted/50 py-6">
                        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                            <p className="text-center text-sm text-muted-foreground">
                                Last updated: {new Date().toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </main>
            </SidebarProvider>
        </>
    );
}

