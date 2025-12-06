import { DatePicker } from '@/components/ui/date-picker';

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

    return (
        <div className="flex min-w-[260px] flex-1 flex-col gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Date window</span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DatePicker
                    label="From date"
                    value={from || null}
                    onChange={(value) => onChange('from', value ?? '')}
                    placeholder="Select date"
                    fullWidth
                    description="Start date"
                />
                <DatePicker
                    label="To date"
                    value={to || null}
                    onChange={(value) => onChange('to', value ?? '')}
                    placeholder="Select date"
                    fullWidth
                    description="End date"
                />
            </div>
            {helperText ? <p className={helperClassName}>{helperText}</p> : null}
        </div>
    );
}
