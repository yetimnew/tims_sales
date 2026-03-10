const APP_CURRENCY = 'ETB';

const toNumeric = (value: number | string | null | undefined): number | null => {
    if (value === null || value === undefined) {
        return null;
    }

    const numeric = typeof value === 'string' ? Number(value) : value;

    return Number.isFinite(numeric) ? numeric : null;
};

export const formatCurrency = (
    value: number | string | null | undefined,
    fallback = '—',
    locale?: string,
): string => {
    const numeric = toNumeric(value);

    if (numeric === null) {
        return fallback;
    }

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: APP_CURRENCY,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numeric);
};

export const getCurrencyCode = (): string => APP_CURRENCY;
