import * as React from 'react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type RangeValue = { from: string | null; to: string | null };

type PresetValue = Date | { from?: Date | null; to?: Date | null };

type DatePickerPreset = {
    label: string;
    getValue: () => PresetValue;
};

type BaseDatePickerProps = {
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    fromDate?: Date;
    toDate?: Date;
    showClearButton?: boolean;
    presets?: DatePickerPreset[];
};

type SingleDatePickerProps = BaseDatePickerProps & {
    mode?: 'single';
    value?: string | null;
    onChange?: (value: string | null) => void;
};

type RangeDatePickerProps = BaseDatePickerProps & {
    mode: 'range';
    value?: RangeValue | null;
    onChange?: (value: RangeValue | null) => void;
};

type DatePickerProps = SingleDatePickerProps | RangeDatePickerProps;

const formatDateAttribute = (date?: Date): string | undefined => (date ? format(date, 'yyyy-MM-dd') : undefined);

const toIso = (date?: Date | null): string | null => (date ? format(date, 'yyyy-MM-dd') : null);

const ensureRangeValue = (value?: RangeValue | null): RangeValue => value ?? { from: null, to: null };

const hasRangeSelection = (value: RangeValue): boolean => Boolean(value.from || value.to);

function DatePicker(props: DatePickerProps) {
    if (props.mode === 'range') {
        const { placeholder, className, disabled, fromDate, toDate, showClearButton = true, presets } = props;

        const currentValue = ensureRangeValue(props.value);
        const rangeOnChange = props.onChange;
        const minDate = formatDateAttribute(fromDate);
        const maxDate = formatDateAttribute(toDate);

        const computedPresets = React.useMemo(() => presets?.map((preset) => ({ label: preset.label, value: preset.getValue() })) ?? [], [presets]);

        const handleFromChange = React.useCallback(
            (event: React.ChangeEvent<HTMLInputElement>) => {
                const nextFrom = event.target.value ? event.target.value : null;
                const nextValue: RangeValue = { from: nextFrom, to: currentValue.to };
                rangeOnChange?.(hasRangeSelection(nextValue) ? nextValue : null);
            },
            [currentValue.to, rangeOnChange],
        );

        const handleToChange = React.useCallback(
            (event: React.ChangeEvent<HTMLInputElement>) => {
                const nextTo = event.target.value ? event.target.value : null;
                const nextValue: RangeValue = { from: currentValue.from, to: nextTo };
                rangeOnChange?.(hasRangeSelection(nextValue) ? nextValue : null);
            },
            [currentValue.from, rangeOnChange],
        );

        const handleClear = React.useCallback(() => {
            rangeOnChange?.(null);
        }, [rangeOnChange]);

        const handlePresetClick = React.useCallback(
            (value: PresetValue) => {
                const presetRange: RangeValue = value instanceof Date
                    ? { from: toIso(value), to: toIso(value) }
                    : {
                          from: toIso(value.from ?? null),
                          to: toIso(value.to ?? value.from ?? null),
                      };

                if (hasRangeSelection(presetRange)) {
                    rangeOnChange?.(presetRange);
                } else {
                    rangeOnChange?.(null);
                }
            },
            [rangeOnChange],
        );

        const startPlaceholder = placeholder ?? 'Start date';
        const endPlaceholder = 'End date';

        return (
            <div className={cn('flex w-full flex-col gap-2', className)}>
                <div className="flex flex-wrap items-center gap-2">
                    <Input
                        type="date"
                        value={currentValue.from ?? ''}
                        onChange={handleFromChange}
                        disabled={disabled}
                        min={minDate}
                        max={currentValue.to ?? maxDate}
                        placeholder={startPlaceholder}
                        aria-label="Start date"
                        className="w-auto flex-1 min-w-[160px]"
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input
                        type="date"
                        value={currentValue.to ?? ''}
                        onChange={handleToChange}
                        disabled={disabled}
                        min={currentValue.from ?? minDate}
                        max={maxDate}
                        placeholder={endPlaceholder}
                        aria-label="End date"
                        className="w-auto flex-1 min-w-[160px]"
                    />
                </div>
                {(computedPresets.length > 0 || (showClearButton && hasRangeSelection(currentValue))) && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        {computedPresets.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2">
                                {computedPresets.map((preset) => (
                                    <Button
                                        key={preset.label}
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handlePresetClick(preset.value)}
                                        disabled={disabled}
                                    >
                                        {preset.label}
                                    </Button>
                                ))}
                            </div>
                        ) : (
                            <span />
                        )}
                        {showClearButton && hasRangeSelection(currentValue) ? (
                            <Button type="button" variant="ghost" size="sm" onClick={handleClear} disabled={disabled}>
                                Clear
                            </Button>
                        ) : null}
                    </div>
                )}
            </div>
        );
    }

    const { placeholder, className, disabled, fromDate, toDate, showClearButton = true, presets } = props;

    const value = props.value ?? null;
    const onChange = props.onChange;
    const minDate = formatDateAttribute(fromDate);
    const maxDate = formatDateAttribute(toDate);

    const computedPresets = React.useMemo(() => presets?.map((preset) => ({ label: preset.label, value: preset.getValue() })) ?? [], [presets]);

    const handleChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const nextValue = event.target.value ? event.target.value : null;
            onChange?.(nextValue);
        },
        [onChange],
    );

    const handleClear = React.useCallback(() => {
        onChange?.(null);
    }, [onChange]);

    const handlePresetClick = React.useCallback(
        (value: PresetValue) => {
            const nextValue = value instanceof Date ? toIso(value) : toIso(value.from ?? value.to ?? null);
            onChange?.(nextValue);
        },
        [onChange],
    );

    const hasValue = Boolean(value);
    const effectivePlaceholder = placeholder ?? 'Pick a date';

    return (
        <div className={cn('flex w-[280px] flex-col gap-2', className)}>
            <Input
                type="date"
                value={value ?? ''}
                onChange={handleChange}
                disabled={disabled}
                min={minDate}
                max={maxDate}
                placeholder={effectivePlaceholder}
                aria-label="Date"
            />
            {(computedPresets.length > 0 || (showClearButton && hasValue)) && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    {computedPresets.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                            {computedPresets.map((preset) => (
                                <Button
                                    key={preset.label}
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePresetClick(preset.value)}
                                    disabled={disabled}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>
                    ) : (
                        <span />
                    )}
                    {showClearButton && hasValue ? (
                        <Button type="button" variant="ghost" size="sm" onClick={handleClear} disabled={disabled}>
                            Clear
                        </Button>
                    ) : null}
                </div>
            )}
        </div>
    );
}

export { DatePicker };
