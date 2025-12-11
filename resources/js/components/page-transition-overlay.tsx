import { ListingLoadingPlaceholder } from '@/components/listing/loading-placeholder';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface PageTransitionOverlayProps {
    visible: boolean;
    className?: string;
}

export function PageTransitionOverlay({ visible, className }: PageTransitionOverlayProps) {
    if (!visible) {
        return null;
    }

    return (
        <div
            className={cn(
                'fixed inset-0 z-[75] flex h-screen w-screen items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-150 ease-out',
                className,
            )}
            aria-live="polite"
            role="status"
        >
            <div className="w-full max-w-5xl px-4">
                <div className="mb-6 flex items-center gap-3 text-sm font-medium text-muted-foreground">
                    <Spinner className="size-5" />
                    <span>Fetching the latest data...</span>
                </div>
                <div className="rounded-lg border bg-background/90 p-4 shadow-sm">
                    <ListingLoadingPlaceholder showStats={false} filterItemCount={4} rowCount={5} />
                </div>
            </div>
        </div>
    );
}
