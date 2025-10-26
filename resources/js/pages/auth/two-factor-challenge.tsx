import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { router } from '@inertiajs/react';
import { Shield } from 'lucide-react';
import { useState } from 'react';

export default function TwoFactorChallenge() {
    const { toast } = useToast();
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post('/two-factor-challenge', {
            code,
        }, {
            onSuccess: () => {
                toast({
                    title: 'Authentication successful',
                    description: 'You have been logged in successfully.',
                });
            },
            onError: (errors) => {
                toast({
                    title: 'Authentication failed',
                    description: errors.code || 'Invalid authentication code.',
                    variant: 'destructive',
                });
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <Shield className="mx-auto h-12 w-12 text-blue-600" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Two-Factor Authentication
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Please enter the authentication code from your authenticator app
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Enter Authentication Code</CardTitle>
                        <CardDescription>
                            Enter the 6-digit code from your authenticator app
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="code">Authentication Code</Label>
                                <Input
                                    id="code"
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                    className="mt-1"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting || code.length !== 6}
                            >
                                {isSubmitting ? 'Verifying...' : 'Verify Code'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

