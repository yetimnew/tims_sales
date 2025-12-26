import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface UseRemoteLookupOptions<T> {
    endpoint: string;
    getId: (item: T) => string | number;
    selectedIds?: Array<string | number | null | undefined>;
    limit?: number;
    debounceMs?: number;
}

interface UseRemoteLookupResult<T> {
    items: T[];
    isLoading: boolean;
    query: string;
    setQuery: (value: string) => void;
    getCachedItem: (id: string | number | null | undefined) => T | undefined;
    hasMore: boolean;
    refresh: () => void;
}

interface LookupResponse<T> {
    data?: T[];
    has_more?: boolean;
}

const DEFAULT_DEBOUNCE = 250;
const DEFAULT_LIMIT = 20;

export function useRemoteLookup<T>({
    endpoint,
    getId,
    selectedIds = [],
    limit = DEFAULT_LIMIT,
    debounceMs = DEFAULT_DEBOUNCE,
}: UseRemoteLookupOptions<T>): UseRemoteLookupResult<T> {
    const [query, setQuery] = useState('');
    const [items, setItems] = useState<T[]>([]);
    const [cache, setCache] = useState<Record<string, T>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const debouncedQuery = useDebouncedValue(query, debounceMs);
    const abortControllerRef = useRef<AbortController | null>(null);
    const getIdRef = useRef(getId);

    useEffect(() => {
        getIdRef.current = getId;
    }, [getId]);

    const normalizedSelectedIds = useMemo(() => {
        const normalized = selectedIds
            .map(id => (id !== null && id !== undefined ? String(id) : ''))
            .filter((id): id is string => id.trim() !== '');
        const unique = Array.from(new Set(normalized));
        unique.sort();
        return unique;
    }, [selectedIds]);

    const selectedKey = useMemo(() => normalizedSelectedIds.join('|'), [normalizedSelectedIds]);

    const fetchData = useCallback(async () => {
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoading(true);

        try {
            const params = new URLSearchParams();

            if (debouncedQuery.trim() !== '') {
                params.append('search', debouncedQuery.trim());
            }

            if (limit > 0) {
                params.append('limit', String(limit));
            }

            normalizedSelectedIds.forEach(id => params.append('selected[]', id));

            const url = `${endpoint}?${params.toString()}`;
            console.log('[useRemoteLookup] Fetching:', url);

            const response = await fetch(url, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                signal: controller.signal,
            });

            console.log('[useRemoteLookup] Response status:', response.status, response.ok);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                console.error('[useRemoteLookup] Response error:', response.status, errorText);
                throw new Error(`Lookup request failed with status ${response.status}: ${errorText}`);
            }

            const payload = (await response.json()) as LookupResponse<T>;
            const data = Array.isArray(payload.data) ? payload.data : [];

            console.log('[useRemoteLookup] Received data:', data.length, 'items');

            setItems(data);
            setHasMore(Boolean(payload.has_more));

            if (data.length > 0) {
                setCache(previous => {
                    const next = { ...previous };
                    data.forEach(item => {
                        const key = String(getIdRef.current(item));
                        next[key] = item;
                    });
                    return next;
                });
            }
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('[useRemoteLookup] Failed to load lookup data:', error);
                // Set empty items on error to prevent stale data
                setItems([]);
            }
        } finally {
            if (!controller.signal.aborted) {
                setIsLoading(false);
            }
        }
    }, [debouncedQuery, endpoint, limit, normalizedSelectedIds]);

    // Fetch on mount and when dependencies change
    useEffect(() => {
        console.log('[useRemoteLookup] Effect triggered, fetching data...', { endpoint, debouncedQuery, selectedKey });
        fetchData();

        return () => {
            abortControllerRef.current?.abort();
        };
    }, [fetchData, selectedKey]);

    const resolveItem = useCallback(
        (id: string | number | null | undefined): T | undefined => {
            if (id === null || id === undefined) {
                return undefined;
            }

            return cache[String(id)];
        },
        [cache],
    );

    const refresh = useCallback(() => {
        fetchData();
    }, [fetchData]);

    const handleSetQuery = useCallback((value: string) => {
        setQuery(value);
    }, []);

    return {
        items,
        isLoading,
        query,
        setQuery: handleSetQuery,
        getCachedItem: resolveItem,
        hasMore,
        refresh,
    };
}
