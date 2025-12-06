import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ArrowUpDown } from 'lucide-react';
import { type ReactNode } from 'react';

export interface ListingTableColumn {
    id: string;
    label: ReactNode;
    sortable?: boolean;
    sortKey?: string;
    align?: 'left' | 'center' | 'right';
    className?: string;
}

export interface ListingTableSortState {
    column: string;
    direction: 'asc' | 'desc';
    onToggle: (column: string) => void;
}

interface ListingTableShellProps {
    columns: ListingTableColumn[];
    sort?: ListingTableSortState;
    children: ReactNode;
    headClassName?: string;
    className?: string;
    stickyOffset?: number;
}

export function ListingTableShell({ columns, sort, children, headClassName, className, stickyOffset = 0 }: ListingTableShellProps) {
    return (
        <Table className={className}>
            <TableHeader className={cn('[&_tr]:sticky [&_tr]:z-20 [&_tr]:bg-background [&_tr]:shadow-sm', headClassName)}>
                <TableRow className="border-b bg-background" style={{ top: stickyOffset }}>
                    {columns.map((column) => {
                        const sortable = Boolean(column.sortable && sort);
                        const sortKey = column.sortKey ?? column.id;
                        const isActive = sortable && sort?.column === sortKey;

                        return (
                            <TableHead
                                key={column.id}
                                className={cn(
                                    'sticky top-0 z-20 bg-background text-left',
                                    column.align === 'center' && 'text-center',
                                    column.align === 'right' && 'text-right',
                                    sortable ? 'cursor-pointer select-none transition-colors hover:bg-muted/70' : 'cursor-default',
                                    column.className,
                                )}
                                style={{ top: stickyOffset }}
                                onClick={sortable ? () => sort?.onToggle(sortKey) : undefined}
                            >
                                <div
                                    className={cn(
                                        'flex items-center gap-2',
                                        column.align === 'center' && 'justify-center',
                                        column.align === 'right' && 'justify-end',
                                    )}
                                >
                                    {column.label}
                                    {sortable && (
                                        <ArrowUpDown
                                            size={14}
                                            className={cn('text-muted-foreground opacity-50', isActive && 'text-primary opacity-100')}
                                        />
                                    )}
                                </div>
                            </TableHead>
                        );
                    })}
                </TableRow>
            </TableHeader>
            <TableBody>{children}</TableBody>
        </Table>
    );
}
