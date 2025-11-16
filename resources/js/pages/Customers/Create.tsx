import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { toast } from '@/hooks/use-toast';
import { customerValidation, validateCustomer, type ValidationErrors } from '@/lib/validation';
import { useEffect, useRef, useState, type FormEventHandler } from 'react';
import { AlertCircle, ArrowLeft, ArrowUp, Building2, CheckCircle, Info, Mail, Phone, Save, UserCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Customers',
        href: '/customers',
    },
    {
        title: 'Create',
        href: '/customers/create',
    },
];

export default function CustomersCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        status: 'active',
    });

    const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
    const [isDirty, setIsDirty] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const formRef = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        const container = formRef.current;
        if (!container) {
            return;
        }

        const handleScroll = () => {
            setShowScrollTop(container.scrollTop > 240);
        };

        handleScroll();
        container.addEventListener('scroll', handleScroll);

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        const messages = Object.values(errors)
            .map((message) => (typeof message === 'string' ? message : String(message)));

        if (messages.length > 0) {
            toast({
                title: '⚠️ Validation Error',
                description: messages.join(', '),
                variant: 'destructive',
            });
        }
    }, [errors]);

    const validateField = (field: string, value: string) => {
        const fieldErrors = { ...frontendErrors };

        if (field === 'name') {
            const message = customerValidation.name(value);
            if (message) {
                fieldErrors.name = message;
            } else {
                delete fieldErrors.name;
            }
        }

        if (field === 'email') {
            const message = value ? customerValidation.email(value) : '';
            if (message) {
                fieldErrors.email = message;
            } else {
                delete fieldErrors.email;
            }
        }

        if (field === 'phone') {
            const message = value ? customerValidation.phone(value) : '';
            if (message) {
                fieldErrors.phone = message;
            } else {
                delete fieldErrors.phone;
            }
        }

        if (field === 'status') {
            if (!value) {
                fieldErrors.status = 'Status is required';
            } else if (!['active', 'inactive'].includes(value)) {
                fieldErrors.status = 'Invalid status';
            } else {
                delete fieldErrors.status;
            }
        }

        setFrontendErrors(fieldErrors);
    };

    const handleFieldChange = (field: keyof typeof data, value: string) => {
        setData(field, value);
        validateField(field, value);
        setIsDirty(true);
    };

    const handleSubmit: FormEventHandler = (event) => {
        event.preventDefault();

        const collectedErrors = validateCustomer(data);
        if (!data.status) {
            collectedErrors.status = 'Status is required';
        }

        if (Object.keys(collectedErrors).length > 0) {
            setFrontendErrors(collectedErrors);
            toast({
                title: '⚠️ Validation Error',
                description: 'Please resolve the highlighted fields before submitting.',
                variant: 'destructive',
            });
            return;
        }

        post('/customers', {
            onSuccess: () => {
                setIsDirty(false);
                setFrontendErrors({});
            },
        });
    };

    const getFieldError = (field: keyof typeof data | 'status') => {
        return (errors[field] as string | undefined) || (frontendErrors[field] as string | undefined) || '';
    };

    const scrollToTop = () => {
        formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Customer" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
                    <CardHeader className="px-6 pb-0">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="rounded-xl bg-blue-100 p-2 text-blue-600 shadow-sm dark:bg-blue-900/30 dark:text-blue-400">
                                    <UserCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                        Register New Customer
                                    </CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                                        Capture the relationship profile, primary contacts, and operating status.
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/customers">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Customers
                                    </Link>
                                </Button>
                                {isDirty && (
                                    <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                        <Save className="h-3 w-3" />
                                        Unsaved Changes
                                    </div>
                                )}
                                <div className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                                    CRM Intake
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
                        <form
                            ref={formRef}
                            onSubmit={handleSubmit}
                            className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24"
                            style={{ minHeight: 0 }}
                        >
                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                        <Info className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Relationship Profile</h2>
                                        <p className="text-sm text-muted-foreground">Core identifiers and client health metadata.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Customer Name <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(event) => handleFieldChange('name', event.target.value)}
                                                placeholder="e.g., Horizon Logistics PLC"
                                                className={`pl-9 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${getFieldError('name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                                            />
                                        </div>
                                        {getFieldError('name') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('name')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Status <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={data.status}
                                            onValueChange={(value) => handleFieldChange('status', value)}
                                        >
                                            <SelectTrigger className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('status') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent className="z-50 bg-white shadow-lg dark:bg-slate-800">
                                                <SelectItem value="active" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">Active</SelectItem>
                                                <SelectItem value="inactive" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('status') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('status')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="address" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Headquarters / Billing Address
                                        </Label>
                                        <Textarea
                                            id="address"
                                            value={data.address}
                                            onChange={(event) => handleFieldChange('address', event.target.value)}
                                            placeholder="Street, city, and any billing instructions"
                                            className="min-h-[96px] resize-y bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                        />
                                        {getFieldError('address') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('address')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Primary Contacts</h2>
                                        <p className="text-sm text-muted-foreground">Keep outreach routing and channel hygiene current.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="contact_person" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Relationship Owner
                                        </Label>
                                        <div className="relative">
                                            <UserCircle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                id="contact_person"
                                                value={data.contact_person}
                                                onChange={(event) => handleFieldChange('contact_person', event.target.value)}
                                                placeholder="e.g., Selam Tesfaye"
                                                className="pl-9 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500"
                                            />
                                        </div>
                                        {getFieldError('contact_person') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('contact_person')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Phone Number
                                        </Label>
                                        <div className="relative">
                                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={data.phone}
                                                onChange={(event) => handleFieldChange('phone', event.target.value)}
                                                placeholder="e.g., +251 91 123 4567"
                                                className={`pl-9 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${getFieldError('phone') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                                            />
                                        </div>
                                        {getFieldError('phone') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('phone')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Email Address
                                        </Label>
                                        <div className="relative">
                                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(event) => handleFieldChange('email', event.target.value)}
                                                placeholder="e.g., partnerships@horizon-logistics.com"
                                                className={`pl-9 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${getFieldError('email') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                                            />
                                        </div>
                                        {getFieldError('email') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('email')}
                                            </p>
                                        )}
                                    </div>

                                </div>
                            </section>

                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <span className="text-red-500">*</span>
                                        <span>Required for onboarding</span>
                                    </div>
                                    {isDirty && (
                                        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                                            <Save className="h-3 w-3" />
                                            <span>Unsaved changes detected</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" asChild className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <Link href="/customers">Cancel</Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || Object.keys(frontendErrors).length > 0}
                                        className="min-w-[150px] bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Create Customer
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {showScrollTop && (
                    <Button
                        type="button"
                        onClick={scrollToTop}
                        className="fixed bottom-6 right-6 z-50 shadow-lg"
                        variant="secondary"
                        aria-label="Scroll to top"
                    >
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </AppLayout>
    );
}

