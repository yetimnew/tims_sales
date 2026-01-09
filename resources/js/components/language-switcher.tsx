import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SUPPORTED_LOCALES } from '@/i18n';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
    const { i18n, t } = useTranslation();
    const currentLocale = i18n.resolvedLanguage ?? i18n.language;
    const currentLabel =
        SUPPORTED_LOCALES.find((locale) => locale.code === currentLocale) ??
        SUPPORTED_LOCALES[0];

    const handleLocaleChange = (locale: string) => {
        i18n.changeLanguage(locale).catch((error) => {
            console.error('Failed to change language:', error);
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="group h-9 cursor-pointer gap-2 px-2"
                >
                    <Languages className="!size-5 opacity-80 group-hover:opacity-100" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground group-hover:text-foreground">
                        {t(currentLabel.labelKey)}
                    </span>
                    <span className="sr-only">{t('nav.language')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuRadioGroup
                    value={currentLocale}
                    onValueChange={handleLocaleChange}
                >
                    {SUPPORTED_LOCALES.map((locale) => (
                        <DropdownMenuRadioItem
                            key={locale.code}
                            value={locale.code}
                        >
                            {t(locale.labelKey)}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
