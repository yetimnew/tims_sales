import { useMemo, useState, type ReactNode } from 'react';
import { ChevronsUpDown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface PlaceOption {
    id: number;
    name: string;
}

interface PlaceComboboxProps {
    id: string;
    label?: ReactNode;
    labelClassName?: string;
    required?: boolean;
    value: string;
    places: PlaceOption[];
    placeholder?: string;
    onSelect: (value: string) => void;
    error?: string;
    buttonClassName?: string;
}

export function PlaceCombobox({
    id,
    label,
    labelClassName,
    required = false,
    value,
    places,
    placeholder = 'Search...',
    onSelect,
    error,
    buttonClassName,
}: PlaceComboboxProps) {
    const [open, setOpen] = useState(false);

    const selectedPlace = useMemo(() => {
        if (!value) {
            return null;
        }

        return places.find(place => place.id.toString() === value) ?? null;
    }, [places, value]);

    const renderedLabel = (() => {
        if (!label) {
            return null;
        }

        if (typeof label === 'string') {
            return (
                <Label htmlFor={id} className={labelClassName}>
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </Label>
            );
        }

        return label;
    })();

    return (
        <div className="space-y-2">
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
                        className={cn(
                            'w-full justify-between text-left',
                            error ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200' : '',
                            buttonClassName,
                        )}
                    >
                        <span className={cn('line-clamp-1', selectedPlace ? 'text-foreground' : 'text-muted-foreground')}>
                            {selectedPlace ? selectedPlace.name : placeholder}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(360px,calc(var(--radix-popover-trigger-width,320px)))] p-0" align="start">
                    <Command>
                        <CommandInput
                            autoFocus
                            placeholder={placeholder}
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <CommandList className="max-h-72">
                            <CommandEmpty>No places found.</CommandEmpty>
                            <CommandGroup>
                                {places.map(place => (
                                    <CommandItem
                                        key={place.id}
                                        value={place.name}
                                        onSelect={() => {
                                            onSelect(place.id.toString());
                                            setOpen(false);
                                        }}
                                    >
                                        <span className="line-clamp-1 text-sm">{place.name}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {error && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                </p>
            )}
        </div>
    );
}
