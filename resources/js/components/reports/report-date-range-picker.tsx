import { DatePicker } from '@/components/ui/date-picker';
import { endOfMonth, startOfMonth, startOfToday, subDays, subMonths } from 'date-fns';

interface ReportDateRangePickerProps {
    from: string;
    to: string;
    onChange: (field: 'from' | 'to', value: string) => void;
    error?: string | null;
    description?: string;
}

export function ReportDateRangePicker({ from, to, onChange, error, description }: ReportDateRangePickerProps) {
    const hasError = Boolean(error);
    const helperText = hasError ? error : description;
    const helperClassName = hasError ? 'text-xs font-medium text-rose-500 dark:text-rose-400' : 'text-xs text-muted-foreground';

    const presets = [
        {
            label: 'Today',
            getValue: () => {
                const today = startOfToday();
                return { from: today, to: today };
            },
        },
        {
            label: 'Last 7 days',
            getValue: () => {
                const end = startOfToday();
                const start = subDays(end, 6);
                return { from: start, to: end };
            },
        },
        {
            label: 'Last 30 days',
            getValue: () => {
                const end = startOfToday();
                const start = subDays(end, 29);
                return { from: start, to: end };
            },
        },
        {
            label: 'This month',
            getValue: () => {
                const now = new Date();
                return { from: startOfMonth(now), to: endOfMonth(now) };
            },
        },
        {
            label: 'Last month',
            getValue: () => {
                const previous = subMonths(new Date(), 1);
                return { from: startOfMonth(previous), to: endOfMonth(previous) };
            },
        },
    ];

    return (
        <div className="flex min-w-[260px] flex-1 flex-col gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Date window</span>
            <DatePicker
                mode="range"
                value={{ from: from || null, to: to || null }}
                onChange={(next) => {
                    onChange('from', next?.from ?? '');
                    onChange('to', next?.to ?? '');
                }}
                placeholder="Select date range"
                numberOfMonths={2}
                className="min-w-[260px] justify-start text-left"
                presets={presets}
            />
            {helperText ? <p className={helperClassName}>{helperText}</p> : null}
        </div>
    );
}
