import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { MoreVertical } from 'lucide-react';
import * as React from 'react';

interface ListingRowActionBase {
    label: string;
    icon?: React.ReactNode;
    disabled?: boolean;
    danger?: boolean;
    shortcut?: string;
    hidden?: boolean;
}

interface ListingRowActionLink extends ListingRowActionBase {
    href: string;
    onSelect?: never;
}

interface ListingRowActionButton extends ListingRowActionBase {
    onSelect: () => void;
    href?: never;
}

export type ListingRowAction = ListingRowActionLink | ListingRowActionButton;

interface ListingRowActionsMenuProps {
    actions: Array<ListingRowAction | false | null | undefined>;
    triggerAriaLabel?: string;
    className?: string;
    triggerClassName?: string;
    contentClassName?: string;
    align?: 'start' | 'end' | 'center';
    size?: 'sm' | 'md';
}

export function ListingRowActionsMenu({
    actions,
    triggerAriaLabel = 'Open actions',
    className,
    triggerClassName,
    contentClassName,
    align = 'end',
    size = 'sm',
}: ListingRowActionsMenuProps) {
    const resolvedActions = React.useMemo(
        () =>
            actions.filter((action): action is ListingRowAction => {
                if (!action) {
                    return false;
                }

                return action.hidden !== true;
            }),
        [actions],
    );

    if (resolvedActions.length === 0) {
        return null;
    }

    const buttonClasses = size === 'sm' ? 'h-8 w-8 p-0' : 'h-9 w-9 p-0';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(buttonClasses, triggerClassName)}
                >
                    <span className="sr-only">{triggerAriaLabel}</span>
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align={align}
                className={cn('w-44', contentClassName)}
            >
                <DropdownMenuGroup className={className}>
                    {resolvedActions.map((action) => {
                        const commonClasses = cn(
                            'gap-2',
                            action.danger && 'text-red-600 focus:text-red-600',
                            action.disabled && 'pointer-events-none opacity-50',
                        );

                        if ('href' in action) {
                            return (
                                <DropdownMenuItem
                                    key={action.label}
                                    asChild
                                    className={commonClasses}
                                >
                                    <Link
                                        href={action.href}
                                        className="flex w-full items-center gap-2"
                                    >
                                        {action.icon}
                                        <span className="flex-1 truncate">
                                            {action.label}
                                        </span>
                                        {action.shortcut ? (
                                            <span className="text-xs text-muted-foreground">
                                                {action.shortcut}
                                            </span>
                                        ) : null}
                                    </Link>
                                </DropdownMenuItem>
                            );
                        }

                        return (
                            <DropdownMenuItem
                                key={action.label}
                                className={commonClasses}
                                onSelect={(event) => {
                                    event.preventDefault();
                                    if (action.disabled) {
                                        return;
                                    }

                                    action.onSelect();
                                }}
                            >
                                {action.icon}
                                <span className="flex-1 truncate">{action.label}</span>
                                {action.shortcut ? (
                                    <span className="text-xs text-muted-foreground">
                                        {action.shortcut}
                                    </span>
                                ) : null}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
