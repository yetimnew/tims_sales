import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { router } from '@inertiajs/react';
import { Shield, ShieldCheck, ShieldX } from 'lucide-react';
import { useState } from 'react';

interface TwoFactorProps {
    enabled: boolean;
    recoveryCodes: string[];
}

export default function TwoFactor({ enabled, recoveryCodes }: TwoFactorProps) {
    const { toast } = useToast();
    const [isEnabling, setIsEnabling] = useState(false);
    const [isDisabling, setIsDisabling] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);

    const handleEnable = () => {
        setIsEnabling(true);
        router.post('/settings/two-factor', {}, {
            onSuccess: () => {
                toast({
                    title: 'Two-factor authentication enabled',
                    description: 'Your account is now protected with two-factor authentication.',
                });
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to enable two-factor authentication.',
                    variant: 'destructive',
                });
            },
            onFinish: () => setIsEnabling(false),
        });
    };

    const handleDisable = () => {
        setIsDisabling(true);
        router.delete('/settings/two-factor', {
            onSuccess: () => {
                toast({
                    title: 'Two-factor authentication disabled',
                    description: 'Your account is no longer protected with two-factor authentication.',
                });
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to disable two-factor authentication.',
                    variant: 'destructive',
                });
            },
            onFinish: () => setIsDisabling(false),
        });
    };

    const handleRegenerateCodes = () => {
        setIsRegenerating(true);
        router.put('/settings/two-factor', {}, {
            onSuccess: () => {
                toast({
                    title: 'Recovery codes regenerated',
                    description: 'New recovery codes have been generated.',
                });
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to regenerate recovery codes.',
                    variant: 'destructive',
                });
            },
            onFinish: () => setIsRegenerating(false),
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">
                    Add an additional layer of security to your account by enabling two-factor authentication.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {enabled ? (
                            <>
                                <ShieldCheck className="h-5 w-5 text-green-600" />
                                Two-Factor Authentication Enabled
                            </>
                        ) : (
                            <>
                                <Shield className="h-5 w-5 text-gray-400" />
                                Two-Factor Authentication Disabled
                            </>
                        )}
                    </CardTitle>
                    <CardDescription>
                        {enabled
                            ? 'Your account is protected with two-factor authentication.'
                            : 'Your account is not protected with two-factor authentication.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {enabled ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Status</p>
                                    <p className="text-sm text-green-600">Enabled</p>
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={handleDisable}
                                    disabled={isDisabling}
                                >
                                    <ShieldX className="h-4 w-4 mr-2" />
                                    {isDisabling ? 'Disabling...' : 'Disable'}
                                </Button>
                            </div>

                            <Separator />

                            <div>
                                <h4 className="text-sm font-medium mb-2">Recovery Codes</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Recovery codes can be used to access your account if you lose your authenticator device.
                                </p>

                                {recoveryCodes.length > 0 && (
                                    <div className="bg-muted p-4 rounded-md">
                                        <p className="text-sm font-medium mb-2">Your recovery codes:</p>
                                        <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                                            {recoveryCodes.map((code, index) => (
                                                <div key={index} className="p-2 bg-background rounded">
                                                    {code}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <Button
                                    variant="outline"
                                    onClick={handleRegenerateCodes}
                                    disabled={isRegenerating}
                                    className="mt-4"
                                >
                                    {isRegenerating ? 'Regenerating...' : 'Regenerate Recovery Codes'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Status</p>
                                    <p className="text-sm text-gray-600">Disabled</p>
                                </div>
                                <Button onClick={handleEnable} disabled={isEnabling}>
                                    <Shield className="h-4 w-4 mr-2" />
                                    {isEnabling ? 'Enabling...' : 'Enable Two-Factor Authentication'}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

