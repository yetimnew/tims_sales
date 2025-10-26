import { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorAuthState {
    enabled: boolean;
    recoveryCodes: string[];
    qrCodeUrl?: string;
    secretKey?: string;
}

interface UseTwoFactorAuthReturn {
    state: TwoFactorAuthState;
    isLoading: boolean;
    enable: () => void;
    disable: () => void;
    regenerateCodes: () => void;
    verifyCode: (code: string) => Promise<boolean>;
    setupComplete: (code: string) => Promise<boolean>;
}

export function useTwoFactorAuth(initialState: TwoFactorAuthState): UseTwoFactorAuthReturn {
    const { toast } = useToast();
    const [state, setState] = useState<TwoFactorAuthState>(initialState);
    const [isLoading, setIsLoading] = useState(false);

    const enable = useCallback(() => {
        setIsLoading(true);
        router.post('/settings/two-factor', {}, {
            onSuccess: (page) => {
                setState(prev => ({
                    ...prev,
                    enabled: true,
                    recoveryCodes: page.props.recoveryCodes || [],
                }));
                toast({
                    title: 'Two-factor authentication enabled',
                    description: 'Your account is now protected with two-factor authentication.',
                });
            },
            onError: (errors) => {
                toast({
                    title: 'Error',
                    description: 'Failed to enable two-factor authentication.',
                    variant: 'destructive',
                });
            },
            onFinish: () => setIsLoading(false),
        });
    }, [toast]);

    const disable = useCallback(() => {
        setIsLoading(true);
        router.delete('/settings/two-factor', {
            onSuccess: () => {
                setState(prev => ({
                    ...prev,
                    enabled: false,
                    recoveryCodes: [],
                }));
                toast({
                    title: 'Two-factor authentication disabled',
                    description: 'Your account is no longer protected with two-factor authentication.',
                });
            },
            onError: (errors) => {
                toast({
                    title: 'Error',
                    description: 'Failed to disable two-factor authentication.',
                    variant: 'destructive',
                });
            },
            onFinish: () => setIsLoading(false),
        });
    }, [toast]);

    const regenerateCodes = useCallback(() => {
        setIsLoading(true);
        router.put('/settings/two-factor', {}, {
            onSuccess: (page) => {
                setState(prev => ({
                    ...prev,
                    recoveryCodes: page.props.recoveryCodes || [],
                }));
                toast({
                    title: 'Recovery codes regenerated',
                    description: 'New recovery codes have been generated.',
                });
            },
            onError: (errors) => {
                toast({
                    title: 'Error',
                    description: 'Failed to regenerate recovery codes.',
                    variant: 'destructive',
                });
            },
            onFinish: () => setIsLoading(false),
        });
    }, [toast]);

    const verifyCode = useCallback(async (code: string): Promise<boolean> => {
        return new Promise((resolve) => {
            router.post('/two-factor-challenge', { code }, {
                onSuccess: () => {
                    toast({
                        title: 'Authentication successful',
                        description: 'You have been logged in successfully.',
                    });
                    resolve(true);
                },
                onError: (errors) => {
                    toast({
                        title: 'Authentication failed',
                        description: errors.code || 'Invalid authentication code.',
                        variant: 'destructive',
                    });
                    resolve(false);
                },
            });
        });
    }, [toast]);

    const setupComplete = useCallback(async (code: string): Promise<boolean> => {
        return new Promise((resolve) => {
            router.post('/two-factor-challenge', { code }, {
                onSuccess: () => {
                    setState(prev => ({
                        ...prev,
                        enabled: true,
                    }));
                    toast({
                        title: 'Two-factor authentication enabled',
                        description: 'Your account is now protected with two-factor authentication.',
                    });
                    resolve(true);
                },
                onError: (errors) => {
                    toast({
                        title: 'Verification failed',
                        description: errors.code || 'Invalid authentication code.',
                        variant: 'destructive',
                    });
                    resolve(false);
                },
            });
        });
    }, [toast]);

    return {
        state,
        isLoading,
        enable,
        disable,
        regenerateCodes,
        verifyCode,
        setupComplete,
    };
}

