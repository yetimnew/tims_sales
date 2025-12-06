import { router } from '@inertiajs/react';
import * as React from 'react';

interface UseListingLoadingOptions {
    storageKey: string;
    isDataReady: boolean;
    minimumDuration?: number;
}

const DEFAULT_MINIMUM_DURATION = 350;

export function useListingLoading({ storageKey, isDataReady, minimumDuration = DEFAULT_MINIMUM_DURATION }: UseListingLoadingOptions) {
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
    }, [beginLoading, finishLoading, storageKey]);

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
