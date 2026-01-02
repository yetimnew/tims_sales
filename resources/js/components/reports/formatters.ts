export const formatDecimal = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });

export const formatInteger = (value: number) => value.toLocaleString();

export const formatCurrency = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);

export const formatPercentage = (value: number | null) => (value === null ? '—' : `${value.toFixed(2)}%`);

export const getFinancialTone = (value: number): string => {
    if (value > 0) {
        return 'text-emerald-600 dark:text-emerald-400';
    }

    if (value < 0) {
        return 'text-rose-600 dark:text-rose-400';
    }

    return 'text-slate-600 dark:text-slate-300';
};

export const getMarginChipClass = (value: number | null): string => {
    if (value === null) {
        return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    }

    if (value > 0) {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
    }

    if (value < 0) {
        return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200';
    }

    return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200';
};

/**
 * Format a datetime string to display date and time in 24-hour format
 * @param value - ISO datetime string (e.g., "2025-01-15T14:30:00")
 * @returns Formatted string like "Jan 15, 2025 14:30" or "—" if invalid
 */
export const formatDateTime = (value: string | null | undefined): string => {
    if (!value) return '—';
    
    try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return '—';
        
        const dateStr = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        const timeStr = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
        
        return `${dateStr} ${timeStr}`;
    } catch {
        return '—';
    }
};

/**
 * Format a datetime string to display only the date part
 * @param value - ISO datetime string
 * @returns Formatted string like "Jan 15, 2025" or "—" if invalid
 */
export const formatDate = (value: string | null | undefined): string => {
    if (!value) return '—';
    
    try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return '—';
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    } catch {
        return '—';
    }
};

/**
 * Format a datetime string to display only the time part in 24-hour format
 * @param value - ISO datetime string
 * @returns Formatted string like "14:30" or "—" if invalid
 */
export const formatTime = (value: string | null | undefined): string => {
    if (!value) return '—';
    
    try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return '—';
        
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    } catch {
        return '—';
    }
};
