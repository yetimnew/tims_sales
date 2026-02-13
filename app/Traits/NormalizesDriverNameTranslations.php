<?php

namespace App\Traits;

trait NormalizesDriverNameTranslations
{
    /**
     * Normalize the driver name translations payload so the default locale is always populated.
     *
     * @param  array<string, mixed>|null  $translations
     * @param  string  $normalizedDefaultName
     * @return array<string, string>
     */
    private function normalizeDriverNameTranslations(?array $translations, string $normalizedDefaultName): array
    {
        $result = [];

        if (is_array($translations)) {
            foreach ($translations as $locale => $value) {
                if (! is_string($value)) {
                    continue;
                }

                $value = trim($value);

                if ($value === '') {
                    continue;
                }

                $result[$locale] = mb_strtoupper($value, 'UTF-8');
            }
        }

        $defaultLocale = config('app.locale', 'en');

        if ($normalizedDefaultName !== '') {
            $result[$defaultLocale] = $normalizedDefaultName;
        } elseif (! isset($result[$defaultLocale]) && ! empty($result)) {
            $result[$defaultLocale] = reset($result);
        }

        return array_filter($result);
    }
}
