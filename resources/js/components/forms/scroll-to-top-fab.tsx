import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowUp } from 'lucide-react';
import { type MouseEventHandler } from 'react';

interface ScrollToTopFabProps {
    visible?: boolean;
    show?: boolean;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    className?: string;
}

export function ScrollToTopFab({ visible, show, onClick, className }: ScrollToTopFabProps) {
    const isVisible = typeof visible === 'boolean' ? visible : typeof show === 'boolean' ? show : true;

    if (!isVisible) {
        return null;
    }

    const handleClick: MouseEventHandler<HTMLButtonElement> = event => {
        if (onClick) {
            onClick(event);
            return;
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Button
            type="button"
            onClick={handleClick}
            className={cn('fixed bottom-6 right-6 z-50 shadow-lg', className)}
            variant="secondary"
            aria-label="Scroll to top"
        >
            <ArrowUp className="h-4 w-4" />
        </Button>
    );
}
