import { router } from '@inertiajs/react';
import * as React from 'react';

interface UsePageTransitionLoadingOptions {
    delayMs?: number;
    minimumVisibleMs?: number;
}

interface PageTransitionLoading {
    isTransitioning: boolean;
}

const DEFAULT_DELAY_MS = 150;
const DEFAULT_MINIMUM_VISIBLE_MS = 320;

const getNow = (): number => {
    if (typeof window === 'undefined') {
        return Date.now();
    }

    if ('performance' in window && typeof window.performance.now === 'function') {
        return window.performance.now();
    }

    return Date.now();
};

const isPrefetchEvent = (event: unknown): boolean => {
    if (!event || typeof event !== 'object') {
        return false;
    }

    const detail = (event as { detail?: { visit?: { prefetch?: boolean } } }).detail;
    return Boolean(detail?.visit?.prefetch);
};

export function usePageTransitionLoading({
    delayMs = DEFAULT_DELAY_MS,
    minimumVisibleMs = DEFAULT_MINIMUM_VISIBLE_MS,
}: UsePageTransitionLoadingOptions = {}): PageTransitionLoading {
    const [isTransitioning, setIsTransitioning] = React.useState(false);
    const showTimeoutRef = React.useRef<number | null>(null);
    const hideTimeoutRef = React.useRef<number | null>(null);
    const startedAtRef = React.useRef<number | null>(null);
    const visibleSinceRef = React.useRef<number | null>(null);
    const isVisibleRef = React.useRef<boolean>(false);

    const clearShowTimeout = React.useCallback(() => {
        if (showTimeoutRef.current === null) {
            return;
        }

        if (typeof window !== 'undefined') {
            window.clearTimeout(showTimeoutRef.current);
        }

        showTimeoutRef.current = null;
    }, []);

    const clearHideTimeout = React.useCallback(() => {
        if (hideTimeoutRef.current === null) {
            return;
        }

        if (typeof window !== 'undefined') {
            window.clearTimeout(hideTimeoutRef.current);
        }

        hideTimeoutRef.current = null;
    }, []);

    const showOverlay = React.useCallback(() => {
        clearShowTimeout();
        clearHideTimeout();

        if (isVisibleRef.current) {
            return;
        }

        isVisibleRef.current = true;
        visibleSinceRef.current = getNow();
        setIsTransitioning(true);
    }, [clearHideTimeout, clearShowTimeout]);

    const hideOverlay = React.useCallback(() => {
        clearShowTimeout();
        clearHideTimeout();

        if (!isVisibleRef.current) {
            startedAtRef.current = null;
            return;
        }

        isVisibleRef.current = false;
        visibleSinceRef.current = null;
        startedAtRef.current = null;
        setIsTransitioning(false);
    }, [clearHideTimeout, clearShowTimeout]);

    const scheduleHideOverlay = React.useCallback(
        (remaining: number) => {
            if (remaining <= 0) {
                hideOverlay();
                return;
            }

            clearHideTimeout();

            if (typeof window === 'undefined') {
                hideOverlay();
                return;
            }

            hideTimeoutRef.current = window.setTimeout(() => {
                hideOverlay();
            }, remaining);
        },
        [clearHideTimeout, hideOverlay],
    );

    const handleStart = React.useCallback(
        (event: unknown) => {
            if (isPrefetchEvent(event)) {
                return;
            }

            const now = getNow();
            startedAtRef.current = now;

            clearHideTimeout();

            if (delayMs <= 0) {
                showOverlay();
                return;
            }

            clearShowTimeout();

            if (typeof window === 'undefined') {
                showOverlay();
                return;
            }

            showTimeoutRef.current = window.setTimeout(() => {
                showOverlay();
            }, delayMs);
        },
        [clearHideTimeout, clearShowTimeout, delayMs, showOverlay],
    );

    const handleFinish = React.useCallback(
        (event: unknown) => {
            if (isPrefetchEvent(event)) {
                return;
            }

            const now = getNow();
            const startedAt = startedAtRef.current ?? now;
            const elapsedSinceStart = now - startedAt;

            clearShowTimeout();

            if (!isVisibleRef.current) {
                if (elapsedSinceStart >= delayMs) {
                    hideOverlay();
                    return;
                }

                startedAtRef.current = null;
                return;
            }

            const visibleSince = visibleSinceRef.current ?? startedAt;
            const visibleDuration = now - visibleSince;
            const remainingVisible = minimumVisibleMs - visibleDuration;

            scheduleHideOverlay(Math.max(remainingVisible, 0));
        },
        [delayMs, hideOverlay, minimumVisibleMs, scheduleHideOverlay, clearShowTimeout],
    );

    React.useEffect(() => {
        const unsubscribeStart = router.on('start', handleStart);
        const unsubscribeFinish = router.on('finish', handleFinish);
        const unsubscribeError = router.on('error', handleFinish);
        const unsubscribeSuccess = router.on('success', handleFinish);

        return () => {
            unsubscribeStart();
            unsubscribeFinish();
            unsubscribeError();
            unsubscribeSuccess();
            clearShowTimeout();
            clearHideTimeout();
        };
    }, [clearHideTimeout, clearShowTimeout, handleFinish, handleStart]);

    React.useEffect(() => {
        return () => {
            clearShowTimeout();
            clearHideTimeout();
        };
    }, [clearHideTimeout, clearShowTimeout]);

    return { isTransitioning };
}
