import { router } from '@inertiajs/react';
import * as React from 'react';

interface UseListingLoadingOptions {
    storageKey: string;
    isDataReady: boolean;
    minimumDuration?: number;
    onlySamePath?: boolean;
}

const DEFAULT_MINIMUM_DURATION = 350;

export function useListingLoading({ storageKey, isDataReady, minimumDuration = DEFAULT_MINIMUM_DURATION, onlySamePath = false }: UseListingLoadingOptions) {
    const getTimestamp = React.useCallback(() => {
        if (typeof window === 'undefined') {
            return Date.now();
        }

        if ('performance' in window && typeof window.performance.now === 'function') {
            return window.performance.now();
        }

        return Date.now();
    }, []);

    const initialShouldShowSkeleton = React.useMemo(() => {
        if (typeof window === 'undefined') {
            return true;
        }

        const stored = window.sessionStorage.getItem(storageKey);
        return stored === 'true' || stored === null;
    }, [storageKey]);

    const [isLoading, setIsLoading] = React.useState<boolean>(initialShouldShowSkeleton);
    const loadingStartedAtRef = React.useRef<number | null>(initialShouldShowSkeleton ? getTimestamp() : null);
    const loadingTimeoutRef = React.useRef<number | null>(null);

    const clearLoadingTimeout = React.useCallback(() => {
        if (loadingTimeoutRef.current === null) {
            return;
        }

        if (typeof window !== 'undefined') {
            window.clearTimeout(loadingTimeoutRef.current);
        }

        loadingTimeoutRef.current = null;
    }, []);

    const beginLoading = React.useCallback(() => {
        if (loadingStartedAtRef.current === null) {
            loadingStartedAtRef.current = getTimestamp();
        }

        clearLoadingTimeout();
        setIsLoading((current) => (current ? current : true));
    }, [clearLoadingTimeout, getTimestamp]);

    const finishLoading = React.useCallback(() => {
        const startedAt = loadingStartedAtRef.current;
        const now = getTimestamp();
        const elapsed = startedAt === null ? minimumDuration : now - startedAt;
        const remaining = Math.max(minimumDuration - elapsed, 0);

        if (remaining <= 0 || typeof window === 'undefined') {
            clearLoadingTimeout();
            loadingStartedAtRef.current = null;
            setIsLoading(false);
            return;
        }

        clearLoadingTimeout();
        loadingTimeoutRef.current = window.setTimeout(() => {
            loadingStartedAtRef.current = null;
            setIsLoading(false);
            loadingTimeoutRef.current = null;
        }, remaining);
    }, [clearLoadingTimeout, getTimestamp, minimumDuration]);

    React.useEffect(() => () => {
        clearLoadingTimeout();
    }, [clearLoadingTimeout]);

    const resolveVisitPathname = React.useCallback((event: unknown): string | null => {
        if (!event || typeof event !== 'object' || event === null) {
            return null;
        }

        const visit = (event as { detail?: { visit?: { url?: URL | string | null } } }).detail?.visit;
        if (!visit) {
            return null;
        }

        const urlLike = visit.url;

        if (urlLike instanceof URL) {
            return urlLike.pathname;
        }

        if (typeof urlLike === 'string') {
            try {
                if (typeof window !== 'undefined') {
                    return new URL(urlLike, window.location.origin).pathname;
                }

                return new URL(urlLike).pathname;
            } catch (error) {
                console.error('Failed to parse visit URL for loading tracker', error);
            }
        }

        return null;
    }, []);

    React.useEffect(() => {
        const isPrefetchVisit = (event: unknown): boolean => {
            if (!event || typeof event !== 'object' || event === null) {
                return false;
            }

            const detail = (event as { detail?: { visit?: { prefetch?: boolean } } }).detail;
            return Boolean(detail?.visit?.prefetch);
        };

        const handleStart = (event: unknown) => {
            if (isPrefetchVisit(event)) {
                return;
            }

            if (onlySamePath && typeof window !== 'undefined') {
                const visitPath = resolveVisitPathname(event);
                if (visitPath && visitPath !== window.location.pathname) {
                    return;
                }
            }

            if (typeof window !== 'undefined') {
                window.sessionStorage.setItem(storageKey, 'true');
            }

            beginLoading();
        };

        const handleFinish = (event: unknown) => {
            if (isPrefetchVisit(event)) {
                return;
            }

            finishLoading();
        };

        const unsubscribeStart = router.on('start', handleStart);
        const unsubscribeFinish = router.on('finish', handleFinish);
        const unsubscribeSuccess = router.on('success', handleFinish);
        const unsubscribeError = router.on('error', handleFinish);

        return () => {
            unsubscribeStart();
            unsubscribeFinish();
            unsubscribeSuccess();
            unsubscribeError();
        };
    }, [beginLoading, finishLoading, onlySamePath, resolveVisitPathname, storageKey]);

    React.useEffect(() => {
        if (!isDataReady) {
            return;
        }

        finishLoading();

        if (typeof window !== 'undefined') {
            window.sessionStorage.removeItem(storageKey);
        }
    }, [finishLoading, isDataReady, storageKey]);

    return {
        isLoading,
    };
}
