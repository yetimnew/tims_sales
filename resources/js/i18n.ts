import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import am from './locales/am/translation.json';
import en from './locales/en/translation.json';

export const LOCALE_STORAGE_KEY = 'app:locale';
export const SUPPORTED_LOCALES = [
    { code: 'en', labelKey: 'languages.english' },
    { code: 'am-ET', labelKey: 'languages.amharic' },
] as const;

export const FALLBACK_LOCALE = 'en';
const isBrowser = typeof window !== 'undefined';

const getStoredLocale = (): string | null => {
    if (!isBrowser) return null;

    try {
        return window.localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch (error) {
        console.warn('Unable to read stored locale:', error);
        return null;
    }
};

const detectInitialLocale = (): string => {
    const storedLocale = getStoredLocale();
    if (storedLocale) return storedLocale;

    return FALLBACK_LOCALE;
};

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        am: { translation: am },
        'am-ET': { translation: am },
    },
    lng: detectInitialLocale(),
    fallbackLng: FALLBACK_LOCALE,
    supportedLngs: ['en', 'am', 'am-ET'],
    nonExplicitSupportedLngs: true,
    interpolation: {
        escapeValue: false,
    },
});

const setDocumentLanguage = (locale: string) => {
    if (!isBrowser) return;
    document.documentElement.lang = locale;
};

if (isBrowser) {
    setDocumentLanguage(i18n.resolvedLanguage ?? i18n.language);

    i18n.on('languageChanged', (locale) => {
        setDocumentLanguage(locale);

        try {
            window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
        } catch (error) {
            console.warn('Unable to persist locale:', error);
        }
    });
}

export default i18n;
