import { useCallback, useState } from 'react';

export const REPORT_DATE_RANGE_ERROR = 'Start date must be before or equal to the end date.';
export const REPORT_DATE_RANGE_DESCRIPTION = 'Use quick presets like Today, Last 7 days, or Last month to update the window instantly.';

export function useReportDateRange(initialFrom = '', initialTo = '') {
    const [from, setFrom] = useState(initialFrom ?? '');
    const [to, setTo] = useState(initialTo ?? '');
    const [dateError, setDateError] = useState<string | null>(null);

    const validateDateRange = useCallback(
        (nextFrom: string, nextTo: string) => {
            if (nextFrom && nextTo) {
                const fromTimestamp = Date.parse(nextFrom);
                const toTimestamp = Date.parse(nextTo);

                if (!Number.isNaN(fromTimestamp) && !Number.isNaN(toTimestamp) && fromTimestamp > toTimestamp) {
                    setDateError(REPORT_DATE_RANGE_ERROR);

                    return false;
                }
            }

            setDateError(null);

            return true;
        },
        [],
    );

    const handleDateChange = useCallback(
        (field: 'from' | 'to', value: string) => {
            if (field === 'from') {
                setFrom(value);
                validateDateRange(value, to);
                return;
            }

            setTo(value);
            validateDateRange(from, value);
        },
        [from, to, validateDateRange],
    );

    const resetDateRange = useCallback((nextFrom?: string | null, nextTo?: string | null) => {
        setFrom(nextFrom ?? '');
        setTo(nextTo ?? '');
        setDateError(null);
    }, []);

    return {
        from,
        to,
        dateError,
        setFrom,
        setTo,
        validateDateRange,
        handleDateChange,
        resetDateRange,
    };
}
