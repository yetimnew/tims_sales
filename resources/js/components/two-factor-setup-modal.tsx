import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { router } from '@inertiajs/react';
import { Shield, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface TwoFactorSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    qrCodeUrl: string;
    secretKey: string;
    recoveryCodes: string[];
}

export default function TwoFactorSetupModal({
    isOpen,
    onClose,
    qrCodeUrl,
    secretKey,
    recoveryCodes,
}: TwoFactorSetupModalProps) {
    const { toast } = useToast();
    const [code, setCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerify = () => {
        if (!code) {
            toast({
                title: 'Error',
                description: 'Please enter the authentication code.',
                variant: 'destructive',
            });
            return;
        }

        setIsVerifying(true);
        router.post('/two-factor-challenge', {
            code,
        }, {
            onSuccess: () => {
                toast({
                    title: 'Two-factor authentication enabled',
                    description: 'Your account is now protected with two-factor authentication.',
                });
                onClose();
            },
            onError: (errors) => {
                toast({
                    title: 'Verification failed',
                    description: errors.code || 'Invalid authentication code.',
                    variant: 'destructive',
                });
            },
            onFinish: () => setIsVerifying(false),
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: 'Copied',
            description: 'Secret key copied to clipboard.',
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Set Up Two-Factor Authentication
                    </DialogTitle>
                    <DialogDescription>
                        Scan the QR code with your authenticator app and enter the verification code to complete setup.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* QR Code */}
                    <div className="text-center">
                        <div className="inline-block p-4 bg-white border rounded-lg">
                            <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            Scan this QR code with your authenticator app
                        </p>
                    </div>

                    <Separator />

                    {/* Secret Key */}
                    <div>
                        <Label htmlFor="secret">Secret Key</Label>
                        <div className="flex gap-2 mt-1">
                            <Input
                                id="secret"
                                value={secretKey}
                                readOnly
                                className="font-mono"
                            />
                            <Button
                                variant="outline"
                                onClick={() => copyToClipboard(secretKey)}
                            >
                                Copy
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Enter this key manually if you can't scan the QR code
                        </p>
                    </div>

                    <Separator />

                    {/* Recovery Codes */}
                    <div>
                        <h4 className="text-sm font-medium mb-2">Recovery Codes</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                            Save these recovery codes in a safe place. You can use them to access your account if you lose your authenticator device.
                        </p>
                        <div className="bg-muted p-4 rounded-md">
                            <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                                {recoveryCodes.map((code, index) => (
                                    <div key={index} className="p-2 bg-background rounded">
                                        {code}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Verification */}
                    <div>
                        <Label htmlFor="verification-code">Enter Verification Code</Label>
                        <div className="flex gap-2 mt-1">
                            <Input
                                id="verification-code"
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="000000"
                                maxLength={6}
                                className="font-mono"
                            />
                            <Button
                                onClick={handleVerify}
                                disabled={isVerifying || code.length !== 6}
                            >
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                {isVerifying ? 'Verifying...' : 'Verify & Enable'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

