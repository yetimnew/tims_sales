import { router } from '@inertiajs/react';
import * as React from 'react';

function readSessionStorage(key: string): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        return window.sessionStorage.getItem(key);
    } catch (error) {
        console.warn('Failed to read sessionStorage', { key, error });
        return null;
    }
}

function writeSessionStorage(key: string, value: string): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.sessionStorage.setItem(key, value);
    } catch (error) {
        console.warn('Failed to write sessionStorage', { key, error });
    }
}

function removeSessionStorage(key: string): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.sessionStorage.removeItem(key);
    } catch (error) {
        console.warn('Failed to remove sessionStorage key', { key, error });
    }
}

interface UseListingLoadingOptions {
    storageKey: string;
    isDataReady: boolean;
    minimumDuration?: number;
    onlySamePath?: boolean;
    initialIsLoading?: boolean;
    /**
     * The target path pattern to detect navigation TO this page.
     * When provided, loading will show when navigating to this path from any other page.
     * Can be a string path (e.g., '/trucks') or a function that returns true if the path matches.
     */
    targetPath?: string | ((pathname: string) => boolean);
}

const DEFAULT_MINIMUM_DURATION = 350;
const DEFAULT_INITIAL_IS_LOADING = true;

export function useListingLoading({
    storageKey,
    isDataReady,
    minimumDuration = DEFAULT_MINIMUM_DURATION,
    onlySamePath = false,
    initialIsLoading = DEFAULT_INITIAL_IS_LOADING,
    targetPath,
}: UseListingLoadingOptions) {
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
            return initialIsLoading;
        }

        const stored = readSessionStorage(storageKey);
        if (stored === 'true') {
            return true;
        }

        if (stored === 'false') {
            return false;
        }

        return initialIsLoading;
    }, [initialIsLoading, storageKey]);

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

            const visitPath = resolveVisitPathname(event);
            if (!visitPath && typeof window !== 'undefined') {
                return;
            }

            // Check if we should show loading based on path matching
            let shouldShowLoading = false;

            if (onlySamePath && typeof window !== 'undefined') {
                // Show loading only for same-path navigation (pagination, filtering, etc.)
                if (visitPath === window.location.pathname) {
                    shouldShowLoading = true;
                }
            } else if (targetPath && visitPath) {
                // Show loading when navigating TO the target path
                if (typeof targetPath === 'function') {
                    shouldShowLoading = targetPath(visitPath);
                } else {
                    // Check if the visit path matches the target path
                    // Support both exact match and startsWith for nested routes
                    shouldShowLoading = visitPath === targetPath || visitPath.startsWith(targetPath + '/');
                }
            } else if (!onlySamePath) {
                // If neither onlySamePath nor targetPath is set, show loading for all navigations
                shouldShowLoading = true;
            }

            if (!shouldShowLoading) {
                return;
            }

            if (typeof window !== 'undefined') {
                writeSessionStorage(storageKey, 'true');
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
    }, [beginLoading, finishLoading, onlySamePath, resolveVisitPathname, storageKey, targetPath]);

    React.useEffect(() => {
        if (!isDataReady) {
            return;
        }

        finishLoading();

        removeSessionStorage(storageKey);
    }, [finishLoading, isDataReady, storageKey]);

    return {
        isLoading,
    };
}
