import { useMemo } from 'react';
import {
    SearchableCombobox,
    type SearchableComboboxOption,
    type SearchableComboboxProps,
} from '@/components/searchable-combobox';

const toKeywords = (values: Array<string | null | undefined> | undefined): string[] | undefined => {
    if (!values) {
        return undefined;
    }

    const cleaned = values.filter((entry): entry is string => Boolean(entry?.trim?.()));

    return cleaned.length ? cleaned : undefined;
};

const toStringValue = (value: string | number): string => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value.toString() : '';
    }

    return value;
};

type BaseProps = Omit<SearchableComboboxProps, 'options'>;

export interface SearchableEntityComboboxProps<T> extends BaseProps {
    items: T[];
    getValue: (item: T) => string | number;
    getLabel: (item: T) => string;
    getDescription?: (item: T) => string | null | undefined;
    getKeywords?: (item: T) => Array<string | null | undefined> | undefined;
}

export function SearchableEntityCombobox<T>({
    items,
    getValue,
    getLabel,
    getDescription,
    getKeywords,
    ...rest
}: SearchableEntityComboboxProps<T>) {
    const options = useMemo<SearchableComboboxOption[]>(
        () =>
            items.map(item => ({
                value: toStringValue(getValue(item)),
                label: getLabel(item),
                description: getDescription?.(item) ?? null,
                keywords: toKeywords(getKeywords?.(item)),
            })),
        [items, getValue, getLabel, getDescription, getKeywords],
    );

    return <SearchableCombobox {...rest} options={options} />;
}
