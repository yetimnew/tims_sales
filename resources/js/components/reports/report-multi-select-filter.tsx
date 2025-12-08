import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import type { ReportSelectionOption } from './types';

interface ReportMultiSelectFilterProps {
    label: string;
    triggerLabelWhenAll: string;
    summaryLabelWhenAll: string;
    icon: LucideIcon;
    options: ReportSelectionOption[];
    selectedIds: Array<number | string>;
    onChange: (ids: Array<number | string>) => void;
    heading: string;
    searchPlaceholder: string;
    emptyMessage: string;
    maxVisibleBadges?: number;
}

export function ReportMultiSelectFilter({
    label,
    triggerLabelWhenAll,
    summaryLabelWhenAll,
    icon: Icon,
    options,
    selectedIds,
    onChange,
    heading,
    searchPlaceholder,
    emptyMessage,
    maxVisibleBadges = 4,
}: ReportMultiSelectFilterProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const noFilter = selectedIds.length === 0;
    const allSelected = options.length > 0 && selectedIds.length === options.length;

    const filteredOptions = useMemo(() => {
        if (!search.trim()) {
            return options;
        }

        const term = search.trim().toLowerCase();

        return options.filter((option) => {
            const labelMatch = option.label.toLowerCase().includes(term);
            const descriptionMatch = option.description?.toLowerCase().includes(term) ?? false;
            const badgeMatch = option.badge?.toLowerCase().includes(term) ?? false;

            return labelMatch || descriptionMatch || badgeMatch;
        });
    }, [options, search]);

    const selectedLabels = useMemo(() => {
        if (noFilter) {
            return [];
        }

        return options.filter((option) => selectedIds.includes(option.id)).map((option) => option.label);
    }, [noFilter, options, selectedIds]);

    const handleToggle = (id: number | string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter((value) => value !== id));
            return;
        }

        onChange([...selectedIds, id]);
    };

    const handleSelectAll = () => {
        if (allSelected) {
            onChange([]);
            return;
        }

        onChange(options.map((option) => option.id));
    };

    const handleClear = () => {
        onChange([]);
    };

    const visibleBadges = selectedLabels.slice(0, maxVisibleBadges);
    const hiddenCount = Math.max(selectedLabels.length - visibleBadges.length, 0);

    return (
        <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between">
                        <span className="flex items-center gap-2 text-sm">
                            <Icon className="h-4 w-4 text-slate-500" />
                            {noFilter ? triggerLabelWhenAll : `${selectedIds.length} selected`}
                        </span>
                        <Filter className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                    <div className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="ghost" size="sm" onClick={handleSelectAll}>
                                {allSelected ? 'Unselect all' : 'Select all'}
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                                Clear
                            </Button>
                        </div>
                    </div>
                    <Separator />
                    <Command>
                        <div className="flex items-center px-3 py-2">
                            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                            <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
                        </div>
                        <CommandList className="max-h-64">
                            <CommandEmpty>{emptyMessage}</CommandEmpty>
                            <CommandGroup heading={heading}>
                                <CommandItem
                                    onSelect={() => {
                                        onChange([]);
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <Checkbox checked={noFilter} />
                                    <span className="font-medium">{triggerLabelWhenAll}</span>
                                    {noFilter && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                                </CommandItem>
                                {filteredOptions.map((option) => {
                                    const checked = selectedIds.includes(option.id);

                                    return (
                                        <CommandItem key={option.id} onSelect={() => handleToggle(option.id)} className="flex items-center gap-2">
                                            <Checkbox checked={checked} />
                                            <div className="flex min-w-0 flex-1 flex-col">
                                                <span className="truncate font-medium">{option.label}</span>
                                                {option.description ? (
                                                    <span className="truncate text-[11px] text-muted-foreground">{option.description}</span>
                                                ) : null}
                                            </div>
                                            {option.badge ? (
                                                <Badge variant="outline" className="ml-auto border-dashed text-xs">
                                                    {option.badge}
                                                </Badge>
                                            ) : null}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <div className="flex flex-wrap gap-2">
                {noFilter ? (
                    <Badge variant="outline" className="border-dashed text-muted-foreground">
                        {summaryLabelWhenAll}
                    </Badge>
                ) : (
                    <>
                        {visibleBadges.map((item) => (
                            <Badge key={item} variant="secondary" className="bg-slate-100 text-slate-700">
                                {item}
                            </Badge>
                        ))}
                        {hiddenCount > 0 ? (
                            <Badge variant="outline" className="border-dashed text-muted-foreground">
                                +{hiddenCount} more
                            </Badge>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
}
