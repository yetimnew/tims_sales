import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface ListingMobileItemListProps<Item> {
    items: Item[];
    getKey: (item: Item, index: number) => string | number;
    renderTitle: (item: Item) => ReactNode;
    renderSubtitle?: (item: Item) => ReactNode;
    renderContent?: (item: Item) => ReactNode;
    renderFooter?: (item: Item) => ReactNode;
    emptyState?: ReactNode;
    className?: string;
}

export function ListingMobileItemList<Item>({
    items,
    getKey,
    renderTitle,
    renderSubtitle,
    renderContent,
    renderFooter,
    emptyState,
    className,
}: ListingMobileItemListProps<Item>) {
    if (!items.length) {
        return emptyState ? <div className="md:hidden">{emptyState}</div> : null;
    }

    return (
        <div className={cn('flex flex-col gap-3 md:hidden', className)}>
            {items.map((item, index) => (
                <Card key={getKey(item, index)} className="border border-slate-200 shadow-sm">
                    <CardHeader className="space-y-1">
                        <div className="text-sm font-semibold">{renderTitle(item)}</div>
                        {renderSubtitle && (
                            <div className="text-xs text-muted-foreground">{renderSubtitle(item)}</div>
                        )}
                    </CardHeader>
                    {renderContent && (
                        <CardContent className="text-sm text-muted-foreground">
                            {renderContent(item)}
                        </CardContent>
                    )}
                    {renderFooter && (
                        <CardFooter className="flex flex-wrap gap-2">
                            {renderFooter(item)}
                        </CardFooter>
                    )}
                </Card>
            ))}
        </div>
    );
}
