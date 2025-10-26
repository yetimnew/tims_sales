import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';

interface TwoFactorRecoveryCodesProps {
    recoveryCodes: string[];
    onRegenerate?: () => void;
    isRegenerating?: boolean;
}

export default function TwoFactorRecoveryCodes({
    recoveryCodes,
    onRegenerate,
    isRegenerating = false,
}: TwoFactorRecoveryCodesProps) {
    const { toast } = useToast();

    const copyToClipboard = () => {
        const codesText = recoveryCodes.join('\n');
        navigator.clipboard.writeText(codesText);
        toast({
            title: 'Copied',
            description: 'Recovery codes copied to clipboard.',
        });
    };

    const downloadCodes = () => {
        const codesText = recoveryCodes.join('\n');
        const blob = new Blob([codesText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recovery-codes.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
            title: 'Downloaded',
            description: 'Recovery codes saved to your device.',
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Recovery Codes
                </CardTitle>
                <CardDescription>
                    Save these recovery codes in a safe place. You can use them to access your account if you lose your authenticator device.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-md">
                    <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                        {recoveryCodes.map((code, index) => (
                            <div key={index} className="p-2 bg-background rounded text-center">
                                {code}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={copyToClipboard}>
                        Copy Codes
                    </Button>
                    <Button variant="outline" onClick={downloadCodes}>
                        Download
                    </Button>
                    {onRegenerate && (
                        <Button
                            variant="outline"
                            onClick={onRegenerate}
                            disabled={isRegenerating}
                        >
                            {isRegenerating ? 'Regenerating...' : 'Regenerate Codes'}
                        </Button>
                    )}
                </div>

                <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Each recovery code can only be used once</li>
                        <li>Store these codes in a secure location</li>
                        <li>If you lose your authenticator device, these codes are your only way to access your account</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}

