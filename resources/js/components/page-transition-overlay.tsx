import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface PageTransitionOverlayProps {
    visible: boolean;
    className?: string;
    variant?: 'global' | 'content';
}

export function PageTransitionOverlay({ visible, className, variant = 'global' }: PageTransitionOverlayProps) {
    if (!visible) {
        return null;
    }

    const containerClass = variant === 'content'
        ? 'absolute inset-0 z-[70] flex items-center justify-center bg-transparent pointer-events-auto'
        : 'fixed inset-0 z-[75] flex h-screen w-screen items-center justify-center bg-background/70 backdrop-blur-sm pointer-events-auto';

    return (
        <div
            className={cn(containerClass, 'transition-opacity duration-150 ease-out', className)}
            aria-live="polite"
            role="status"
        >
            <Spinner className="size-6 text-primary" />
            <span className="sr-only">Loading</span>
        </div>
    );
}
