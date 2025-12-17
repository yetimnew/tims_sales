import { HelpCircle } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Link } from '@inertiajs/react';

interface HelpTriggerIconProps {
    articleId?: string;
    label?: string;
    className?: string;
}

export function HelpTriggerIcon({ 
    articleId, 
    label = 'View help for this section',
    className = 'h-4 w-4' 
}: HelpTriggerIconProps) {
    const href = articleId ? `/help/${articleId}` : '/help';

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href={href} className="inline-flex">
                        <HelpCircle 
                            className={`${className} text-muted-foreground hover:text-foreground transition-colors cursor-help`}
                        />
                    </Link>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

