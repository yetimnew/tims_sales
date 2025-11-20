import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { FormEventHandler, useEffect, useMemo, useRef, useState } from 'react';
import { validateVehicleType, type ValidationErrors } from '@/lib/validation';
import { toast } from '@/hooks/use-toast';
import { Package, Info, Save, ArrowLeft, CheckCircle, AlertCircle, ArrowUp } from 'lucide-react';

interface VehicleType {
    id: number;
    name: string;
    description?: string;
}

interface VehicleTypesEditProps {
    vehicleType: VehicleType;
}

export default function VehicleTypesEdit({ vehicleType }: VehicleTypesEditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Vehicle Types',
            href: '/vehicletypes',
        },
        {
            title: 'Edit',
            href: `/vehicletypes/${vehicleType.id}/edit`,
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: vehicleType.name,
        description: vehicleType.description || '',
    });
    const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
    const [isDirty, setIsDirty] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const scrollContainerRef = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        const errorMessages = Object.entries(errors).map(([_, message]) => (typeof message === 'string' ? message : String(message)));
        if (errorMessages.length) {
            toast({
                title: '⚠️ Validation Error',
                description: errorMessages.join(', '),
                variant: 'destructive',
            });
        }
    }, [errors]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) {
            return;
        }

        const handleScroll = () => setShowScrollTop(container.scrollTop > 240);
        handleScroll();
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const handleScrollToTop = () => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const validateField = (field: 'name' | 'description', value: string) => {
        const draft = { ...data, [field]: value };
        const all = validateVehicleType(draft);
        setFrontendErrors(prev => {
            const next = { ...prev };
            if (all[field]) {
                next[field] = all[field];
            } else {
                delete next[field];
            }
            return next;
        });
    };

    const handleFieldChange = (field: 'name' | 'description', value: string) => {
        setData(field, value);
        validateField(field, value);
        setIsDirty(true);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const allErrors = validateVehicleType(data);
        if (Object.keys(allErrors).length) {
            setFrontendErrors(allErrors);
            toast({
                title: '⚠️ Validation Error',
                description: 'Please fix the validation errors before submitting.',
                variant: 'destructive',
            });
            return;
        }

        put(`/vehicletypes/${vehicleType.id}`, {
            onSuccess: () => {
                setFrontendErrors({});
                setIsDirty(false);
            },
        });
    };

    const getFieldError = (field: 'name' | 'description') => errors[field] || frontendErrors[field] || '';
    const hasErrors = useMemo(() => Boolean(getFieldError('name') || getFieldError('description')), [errors, frontendErrors]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${vehicleType.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
                    <CardHeader className="px-6 pb-0">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="rounded-xl bg-blue-100 p-2 text-blue-600 shadow-sm dark:bg-blue-900/30 dark:text-blue-400">
                                    <Package className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Edit Vehicle Type</CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                                        Update the vehicle classification details used across the fleet.
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/vehicletypes">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Vehicle Types
                                    </Link>
                                </Button>
                                {isDirty && (
                                    <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                        <Save className="h-3 w-3" />
                                        Unsaved Changes
                                    </div>
                                )}
                                <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
                                    Fleet Operations
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
                        <form
                            ref={scrollContainerRef}
                            onSubmit={submit}
                            className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24"
                            style={{ minHeight: 0 }}
                            noValidate
                        >
                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                        <Info className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Vehicle Type Details</h2>
                                        <p className="text-sm text-muted-foreground">Edit the name or optional description to keep records accurate.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            <span className="text-red-500">*</span> Name
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => handleFieldChange('name', e.target.value)}
                                            placeholder="e.g. Heavy Truck, Light Truck"
                                            className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                        />
                                        {getFieldError('name') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('name')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Description
                                        </Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => handleFieldChange('description', e.target.value)}
                                            placeholder="Optional description of the vehicle type"
                                            rows={4}
                                            className={`resize-none transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('description') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                        />
                                        {getFieldError('description') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('description')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <span className="text-red-500">*</span>
                                        <span>All required fields must be completed</span>
                                    </div>
                                    {isDirty && (
                                        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                                            <Save className="h-3 w-3" />
                                            <span>You have unsaved changes</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" asChild className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <Link href="/vehicletypes">Cancel</Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || hasErrors || !data.name.trim()}
                                        className="min-w-[160px] bg-gradient-to-r from-blue-600 to-blue-700 px-6 text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Update Vehicle Type
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
                        onClick={handleScrollToTop}
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



