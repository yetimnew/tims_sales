import * as React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { HelpSidebar } from '@/components/help/help-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Phone, Clock, CheckCircle2, MessageSquare, Search, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function HelpContact() {
    const { toast } = useToast();
    const [submitted, setSubmitted] = React.useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        subject: '',
        category: '',
        priority: 'medium',
        message: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // For now, just store in session storage
        // In production, this would POST to server
        const ticketId = `TICKET-${Date.now().toString().slice(-6)}`;
        
        sessionStorage.setItem('support-ticket', JSON.stringify({
            ...data,
            ticketId,
            timestamp: new Date().toISOString(),
        }));

        setSubmitted(true);
        toast({
            title: '✅ Support Request Submitted',
            description: `Your ticket ${ticketId} has been created. We'll respond within 24 hours.`,
            variant: 'success',
        });

        // Reset form
        setTimeout(() => {
            reset();
            setSubmitted(false);
        }, 5000);
    };

    if (submitted) {
        return (
            <>
                <Head title="Contact Support - Help & Documentation" />
                <SidebarProvider>
                    <HelpSidebar />
                    <main className="flex-1 overflow-auto">
                        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8 text-center">
                            <div className="mb-6 flex justify-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold mb-3">Thank You!</h1>
                            <p className="text-lg text-muted-foreground mb-6">
                                Your support request has been submitted successfully. Our team will review your message and respond within 24 hours.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Link href="/help">
                                    <Button variant="outline">
                                        Back to Help Center
                                    </Button>
                                </Link>
                                <Button onClick={() => setSubmitted(false)}>
                                    Submit Another Request
                                </Button>
                            </div>
                        </div>
                    </main>
                </SidebarProvider>
            </>
        );
    }

    return (
        <>
            <Head title="Contact Support - Help & Documentation" />
            <SidebarProvider>
                <HelpSidebar />
                <main className="flex-1 overflow-auto">
                    {/* Header */}
                    <div className="border-b bg-gradient-to-b from-primary/5 to-background">
                        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                            <Link 
                                href="/help" 
                                className="text-sm text-muted-foreground hover:text-primary mb-3 inline-block"
                            >
                                ← Back to Help Center
                            </Link>
                            <h1 className="text-4xl font-bold tracking-tight mb-4">
                                Contact Support
                            </h1>
                            <p className="text-lg text-muted-foreground">
                                Can't find what you're looking for? We're here to help. Send us a message and we'll get back to you as soon as possible.
                            </p>
                        </div>
                    </div>

                    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                        {/* Before You Contact */}
                        <Alert className="mb-8 border-primary/50 bg-primary/5">
                            <HelpCircle className="h-4 w-4" />
                            <AlertDescription>
                                <p className="font-semibold mb-2">Before submitting a request:</p>
                                <ul className="space-y-1 text-sm">
                                    <li>• Check our <Link href="/help/faq" className="text-primary hover:underline">FAQ page</Link> for quick answers</li>
                                    <li>• Search the <Link href="/help/search" className="text-primary hover:underline">documentation</Link> for guides and tutorials</li>
                                    <li>• Review the <Link href="/help/troubleshooting" className="text-primary hover:underline">troubleshooting section</Link> for common issues</li>
                                </ul>
                            </AlertDescription>
                        </Alert>

                        <div className="grid gap-8 md:grid-cols-3">
                            {/* Contact Form */}
                            <div className="md:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Submit a Support Request</CardTitle>
                                        <CardDescription>
                                            Fill out the form below and our support team will respond within 24 hours.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            {/* Name */}
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Full Name *</Label>
                                                <Input
                                                    id="name"
                                                    type="text"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    required
                                                    placeholder="John Doe"
                                                />
                                                {errors.name && (
                                                    <p className="text-sm text-destructive">{errors.name}</p>
                                                )}
                                            </div>

                                            {/* Email */}
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email Address *</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    required
                                                    placeholder="john@example.com"
                                                />
                                                {errors.email && (
                                                    <p className="text-sm text-destructive">{errors.email}</p>
                                                )}
                                            </div>

                                            {/* Category */}
                                            <div className="space-y-2">
                                                <Label htmlFor="category">Category *</Label>
                                                <Select
                                                    value={data.category}
                                                    onValueChange={(value) => setData('category', value)}
                                                    required
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="technical">Technical Issue</SelectItem>
                                                        <SelectItem value="account">Account & Access</SelectItem>
                                                        <SelectItem value="feature">Feature Request</SelectItem>
                                                        <SelectItem value="billing">Billing & Subscription</SelectItem>
                                                        <SelectItem value="data">Data & Reports</SelectItem>
                                                        <SelectItem value="training">Training & How-To</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.category && (
                                                    <p className="text-sm text-destructive">{errors.category}</p>
                                                )}
                                            </div>

                                            {/* Priority */}
                                            <div className="space-y-2">
                                                <Label htmlFor="priority">Priority *</Label>
                                                <Select
                                                    value={data.priority}
                                                    onValueChange={(value) => setData('priority', value)}
                                                    required
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="low">Low - General question</SelectItem>
                                                        <SelectItem value="medium">Medium - Issue affecting work</SelectItem>
                                                        <SelectItem value="high">High - Blocking critical operation</SelectItem>
                                                        <SelectItem value="urgent">Urgent - System down</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.priority && (
                                                    <p className="text-sm text-destructive">{errors.priority}</p>
                                                )}
                                            </div>

                                            {/* Subject */}
                                            <div className="space-y-2">
                                                <Label htmlFor="subject">Subject *</Label>
                                                <Input
                                                    id="subject"
                                                    type="text"
                                                    value={data.subject}
                                                    onChange={(e) => setData('subject', e.target.value)}
                                                    required
                                                    placeholder="Brief description of your issue"
                                                />
                                                {errors.subject && (
                                                    <p className="text-sm text-destructive">{errors.subject}</p>
                                                )}
                                            </div>

                                            {/* Message */}
                                            <div className="space-y-2">
                                                <Label htmlFor="message">Message *</Label>
                                                <Textarea
                                                    id="message"
                                                    value={data.message}
                                                    onChange={(e) => setData('message', e.target.value)}
                                                    required
                                                    rows={6}
                                                    placeholder="Please provide as much detail as possible about your issue or question..."
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Include any error messages, steps to reproduce, and what you expected to happen.
                                                </p>
                                                {errors.message && (
                                                    <p className="text-sm text-destructive">{errors.message}</p>
                                                )}
                                            </div>

                                            {/* Submit Button */}
                                            <div className="flex gap-3">
                                                <Button type="submit" disabled={processing} className="flex-1">
                                                    {processing ? 'Submitting...' : 'Submit Request'}
                                                </Button>
                                                <Link href="/help">
                                                    <Button type="button" variant="outline">
                                                        Cancel
                                                    </Button>
                                                </Link>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Contact Info Sidebar */}
                            <div className="space-y-6">
                                {/* Support Hours */}
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-primary" />
                                            <CardTitle className="text-lg">Support Hours</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-2">
                                        <div>
                                            <p className="font-semibold">Monday - Friday</p>
                                            <p className="text-muted-foreground">8:00 AM - 6:00 PM</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold">Saturday</p>
                                            <p className="text-muted-foreground">9:00 AM - 2:00 PM</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold">Sunday</p>
                                            <p className="text-muted-foreground">Closed</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground pt-2">
                                            All times in your local timezone
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Alternative Contact Methods */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Other Ways to Reach Us</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-sm">Email</p>
                                                <a 
                                                    href="mailto:support@yourcompany.com" 
                                                    className="text-sm text-primary hover:underline"
                                                >
                                                    support@yourcompany.com
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-sm">Phone</p>
                                                <a 
                                                    href="tel:+1234567890" 
                                                    className="text-sm text-primary hover:underline"
                                                >
                                                    +1 (234) 567-890
                                                </a>
                                                <p className="text-xs text-muted-foreground">
                                                    For urgent issues only
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Quick Links */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Quick Links</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <Link 
                                            href="/help/search" 
                                            className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                                        >
                                            <Search className="h-4 w-4" />
                                            Search Documentation
                                        </Link>
                                        <Link 
                                            href="/help/faq" 
                                            className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                                        >
                                            <HelpCircle className="h-4 w-4" />
                                            Frequently Asked Questions
                                        </Link>
                                        <Link 
                                            href="/help/troubleshooting" 
                                            className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            Troubleshooting Guide
                                        </Link>
                                    </CardContent>
                                </Card>

                                {/* Response Time */}
                                <div className="rounded-lg border bg-muted p-4">
                                    <p className="text-xs font-semibold mb-2">Expected Response Time</p>
                                    <ul className="text-xs space-y-1 text-muted-foreground">
                                        <li>• Urgent: Within 2 hours</li>
                                        <li>• High: Within 4 hours</li>
                                        <li>• Medium: Within 24 hours</li>
                                        <li>• Low: Within 48 hours</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t bg-muted/50 py-6 mt-8">
                        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                            <p className="text-sm text-muted-foreground">
                                We're committed to providing excellent support. Your feedback helps us improve!
                            </p>
                        </div>
                    </div>
                </main>
            </SidebarProvider>
        </>
    );
}

