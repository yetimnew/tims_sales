import { FALLBACK_LOCALE, SUPPORTED_LOCALES } from '@/i18n';

export const DRIVER_TRANSLATION_LOCALES = SUPPORTED_LOCALES.filter(
    (locale) => locale.code !== FALLBACK_LOCALE,
);

export type DriverTranslationLocale = (typeof DRIVER_TRANSLATION_LOCALES)[number];

const createLocaleVariants = (code: string): string[] => {
    const normalized = code.toLowerCase();
    const base = normalized.split('-')[0];
    const hyphenVariant = normalized.replace('_', '-');
    const underscoreVariant = normalized.replace('-', '_');

    return Array.from(new Set([
        code,
        normalized,
        base,
        hyphenVariant,
        underscoreVariant,
    ]).values());
};

export function initializeDriverTranslations(existing?: Record<string, string> | null): Record<string, string> {
    const source = existing ?? {};

    return DRIVER_TRANSLATION_LOCALES.reduce<Record<string, string>>((acc, { code }) => {
        const variants = createLocaleVariants(code);
        const found = variants
            .map((variant) => {
                const value = source[variant];
                return typeof value === 'string' ? value : undefined;
            })
            .find((value): value is string => value !== undefined);

        acc[code] = found ?? '';
        return acc;
    }, {});
}
