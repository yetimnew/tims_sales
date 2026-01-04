import { useMemo, useState, type ReactNode } from 'react';
import { ChevronsUpDown, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

export interface SearchableComboboxOption {
    value: string;
    label: string;
    description?: string | null;
    keywords?: string[];
}

export interface SearchableComboboxProps {
    id: string;
    value: string;
    onSelect: (value: string) => void;
    options: SearchableComboboxOption[];
    label?: ReactNode;
    required?: boolean;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    loadingMessage?: string;
    isLoading?: boolean;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    error?: string;
    disabled?: boolean;
    buttonClassName?: string;
    contentClassName?: string;
    showErrorMessage?: boolean;
    renderDisplay?: (option: SearchableComboboxOption | null) => ReactNode;
    renderOption?: (option: SearchableComboboxOption, selected: boolean) => ReactNode;
}

export function SearchableCombobox({
    id,
    value,
    onSelect,
    options,
    label,
    required = false,
    placeholder = 'Select an option',
    searchPlaceholder = 'Search…',
    emptyMessage = 'No results found.',
    loadingMessage = 'Loading…',
    isLoading = false,
    searchValue,
    onSearchChange,
    error,
    disabled = false,
    buttonClassName,
    contentClassName,
    showErrorMessage = true,
    renderDisplay,
    renderOption,
}: SearchableComboboxProps) {
    const [open, setOpen] = useState(false);
    const [internalSearch, setInternalSearch] = useState('');

    const selectedOption = useMemo(() => options.find(option => option.value === value) ?? null, [options, value]);

    const effectiveSearchValue = searchValue ?? internalSearch;

    const handleSearchChange = (next: string) => {
        if (onSearchChange) {
            onSearchChange(next);
        } else {
            setInternalSearch(next);
        }
    };

    const resetSearch = () => {
        if (onSearchChange) {
            onSearchChange('');
        } else {
            setInternalSearch('');
        }
    };

    const renderedLabel = (() => {
        if (!label) {
            return null;
        }

        if (typeof label === 'string') {
            return (
                <Label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {label}
                    {required && <span className="ml-1 text-red-500">*</span>}
                </Label>
            );
        }

        return label;
    })();

    const defaultDisplay = (option: SearchableComboboxOption | null) => {
        if (!option) {
            return <span className="text-sm text-muted-foreground">{placeholder}</span>;
        }

        return (
            <div className="flex min-w-0 flex-col items-start">
                <span className="line-clamp-1 text-sm font-medium text-foreground">{option.label}</span>
                {option.description && (
                    <span className="line-clamp-1 text-xs text-muted-foreground">{option.description}</span>
                )}
            </div>
        );
    };

    const defaultOption = (option: SearchableComboboxOption, selected: boolean) => (
        <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex min-w-0 flex-col">
                <span className="line-clamp-1 text-sm font-medium text-foreground">{option.label}</span>
                {option.description && (
                    <span className="line-clamp-1 text-xs text-muted-foreground">{option.description}</span>
                )}
            </div>
            <Check className={cn('h-4 w-4 shrink-0', selected ? 'opacity-100' : 'opacity-0')} />
        </div>
    );

    return (
        <div className={cn('space-y-2', contentClassName)}>
            {renderedLabel}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        aria-required={required}
                        disabled={disabled}
                        className={cn(
                            'w-full justify-between text-left',
                            error ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200' : '',
                            disabled ? 'cursor-not-allowed opacity-70' : '',
                            buttonClassName,
                        )}
                    >
                        {renderDisplay ? renderDisplay(selectedOption) : defaultDisplay(selectedOption)}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(400px,calc(var(--radix-popover-trigger-width,320px)))] p-0" align="start">
                    <Command>
                        <CommandInput
                            autoFocus
                            placeholder={searchPlaceholder}
                            className="h-9 text-sm"
                            value={effectiveSearchValue}
                            onValueChange={handleSearchChange}
                        />
                        <CommandList className="max-h-72">
                            <CommandEmpty>{isLoading ? loadingMessage : emptyMessage}</CommandEmpty>
                            {isLoading && (
                                <CommandGroup>
                                    <CommandItem value="__loading" disabled>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="h-2 w-2 animate-ping rounded-full bg-slate-400" aria-hidden="true"></span>
                                            {loadingMessage}
                                        </div>
                                    </CommandItem>
                                </CommandGroup>
                            )}
                            <CommandGroup>
                                {options.map(option => {
                                    const searchValue = [option.label, option.description, option.keywords?.join(' ') ?? '']
                                        .filter(Boolean)
                                        .join(' ');
                                    const isSelected = selectedOption?.value === option.value;

                                    return (
                                        <CommandItem
                                            key={option.value}
                                            value={searchValue}
                                            onSelect={() => {
                                                onSelect(option.value);
                                                setOpen(false);
                                                resetSearch();
                                            }}
                                        >
                                            {renderOption ? renderOption(option, isSelected) : defaultOption(option, isSelected)}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {error && showErrorMessage && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                </p>
            )}
        </div>
    );
}
