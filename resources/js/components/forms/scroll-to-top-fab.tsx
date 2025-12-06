import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { type MouseEventHandler } from 'react';

interface ScrollToTopFabProps {
    visible: boolean;
    onClick: MouseEventHandler<HTMLButtonElement>;
}

export function ScrollToTopFab({ visible, onClick }: ScrollToTopFabProps) {
    if (!visible) {
        return null;
    }

    return (
        <Button
            type="button"
            onClick={onClick}
            className="fixed bottom-6 right-6 z-50 shadow-lg"
            variant="secondary"
            aria-label="Scroll to top"
        >
            <ArrowUp className="h-4 w-4" />
        </Button>
    );
}
