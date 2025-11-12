import { useMemo, useEffect, useRef, useState, type FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { validateFuel, type ValidationErrors } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Fuel, Truck, User, Calendar, GaugeCircle, AlertCircle, Save, ArrowUp, Receipt, NotepadText, Calculator, ArrowLeft } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Fuel',
        href: '/fuel',
    },
    {
        title: 'Create',
        href: '/fuel/create',
    },
];

interface DriverTruckOption {
    id: number;
    truck_id: number | null;
    truck_plate: string | null;
    driver_id: number | null;
    driver_name: string | null;
    driver_code: string | null;
    assigned_on: string | null;
}

interface FuelCreateProps {
    assignments: DriverTruckOption[];
}

export default function FuelCreate({ assignments }: FuelCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        driver_truck_id: '',
        truck_id: '',
        driver_id: '',
        fuel_date: '',
        fuel_quantity_liters: '',
        fuel_price_per_liter: '',
        fuel_type: '',
        fuel_station: '',
        odometer_reading: '',
        receipt_number: '',
        notes: '',
    });
    const { toast } = useToast();
    const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const scrollContainerRef = useRef<HTMLFormElement | null>(null);

    const mergedErrors = { ...frontendErrors, ...errors } as Record<string, string | string[]>;
    const assignmentOptions = useMemo(() => (Array.isArray(assignments) ? assignments : []), [assignments]);

    const selectedAssignment = useMemo(() => {
        return assignmentOptions.find((option) => option.id.toString() === data.driver_truck_id) || null;
    }, [assignmentOptions, data.driver_truck_id]);

    const totalCost = useMemo(() => {
        const quantity = Number.parseFloat(data.fuel_quantity_liters || '0');
        const price = Number.parseFloat(data.fuel_price_per_liter || '0');
        if (Number.isNaN(quantity) || Number.isNaN(price)) {
            return null;
        }
        const result = quantity * price;
        return Number.isFinite(result) ? result : null;
    }, [data.fuel_quantity_liters, data.fuel_price_per_liter]);

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const message = Object.values(errors)
                .map((value) => (Array.isArray(value) ? value.join(', ') : value))
                .filter(Boolean)
                .join(', ');
            toast({
                variant: 'destructive',
                title: 'Validation error',
                description: message || 'Please review the highlighted fields.',
            });
        }
    }, [errors, toast]);

    useEffect(() => {
        const container = scrollContainerRef.current;
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

    const handleScrollToTop = () => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const validateField = (fieldName: string, value: string) => {
        const payload = { ...data, [fieldName]: value };
        const validationErrors = validateFuel(payload);
        const fieldError = validationErrors[fieldName] || '';

        setFrontendErrors((prev) => {
            const next = { ...prev };
            if (fieldError) {
                next[fieldName] = fieldError;
            } else {
                delete next[fieldName];
            }
            return next;
        });
    };

    const handleFieldChange = (fieldName: keyof typeof data, value: string, shouldValidate = true) => {
        setData(fieldName, value);
        setIsDirty(true);

        if (shouldValidate) {
            validateField(fieldName, value);
        } else {
            setFrontendErrors((prev) => {
                const next = { ...prev };
                delete next[fieldName];
                return next;
            });
        }
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        const validationResult = validateFuel({ ...data });
        if (Object.keys(validationResult).length > 0) {
            setFrontendErrors(validationResult);
            toast({
                variant: 'destructive',
                title: 'Validation error',
                description: 'Please resolve the highlighted issues before saving.',
            });
            return;
        }

        post('/fuel');
    };

    const getFieldError = (fieldName: keyof typeof data) => {
        const value = mergedErrors[fieldName];
        if (!value) {
            return '';
        }
        return Array.isArray(value) ? value.join(', ') : value;
    };
    const hasErrors = Object.keys(mergedErrors).length > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Record Fuel" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
                    <CardHeader className="px-6 pb-0">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="rounded-xl bg-amber-100 p-2 text-amber-600 shadow-sm dark:bg-amber-900/30 dark:text-amber-400">
                                    <Fuel className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                        Record Fuel Consumption
                                    </CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                                        Capture fueling details for downstream cost analysis and efficiency reporting.
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/fuel">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Fuel Records
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
                                    Fuel Operations
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
                        {hasErrors && (
                            <div className="mx-6 mt-6">
                                <Alert variant="destructive" className="border-red-500/50">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Please resolve the highlighted fields before submitting the form.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}

                        <form
                            ref={scrollContainerRef}
                            onSubmit={submit}
                            className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24"
                            style={{ minHeight: 0 }}
                        >
                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                        <Receipt className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Fuel Transaction</h2>
                                        <p className="text-sm text-muted-foreground">Assign the fueling event to the correct assets and team.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="driver_truck_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Driver &amp; Truck Assignment <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={data.driver_truck_id}
                                            onValueChange={(value) => {
                                                handleFieldChange('driver_truck_id', value);
                                                const assignment = assignmentOptions.find((option) => option.id.toString() === value);
                                                setData('truck_id', assignment?.truck_id ? assignment.truck_id.toString() : '');
                                                setData('driver_id', assignment?.driver_id ? assignment.driver_id.toString() : '');
                                            }}
                                        >
                                            <SelectTrigger className={`bg-white dark:bg-slate-800 transition-all duration-200 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-amber-500/20 focus:border-amber-500 ${getFieldError('driver_truck_id') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                                <SelectValue placeholder="Select driver & truck" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white shadow-lg dark:bg-slate-800">
                                                {assignmentOptions.length > 0 ? (
                                                    assignmentOptions.map((assignment) => (
                                                        <SelectItem
                                                            key={assignment.id}
                                                            value={assignment.id.toString()}
                                                            className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
                                                        >
                                                            {`${assignment.truck_plate ?? 'Unknown Truck'} — ${assignment.driver_name ?? 'Unknown Driver'}`}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="" disabled>
                                                        No active driver-truck assignments available
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('driver_truck_id') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('driver_truck_id')}
                                            </p>
                                        )}
                                        {selectedAssignment && (
                                            <div className="mt-3 grid gap-3 rounded-lg border border-slate-200/80 bg-white/70 p-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/50 md:grid-cols-3">
                                                <div>
                                                    <p className="text-xs uppercase text-muted-foreground">Truck</p>
                                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{selectedAssignment.truck_plate ?? '—'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs uppercase text-muted-foreground">Driver</p>
                                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{selectedAssignment.driver_name ?? '—'}</p>
                                                    {selectedAssignment.driver_code && (
                                                        <p className="text-xs text-muted-foreground">ID: {selectedAssignment.driver_code}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs uppercase text-muted-foreground">Assigned On</p>
                                                    <p className="font-medium text-slate-800 dark:text-slate-100">{selectedAssignment.assigned_on ?? '—'}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="fuel_type" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Fuel Type <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={data.fuel_type}
                                            onValueChange={(value) => handleFieldChange('fuel_type', value)}
                                        >
                                            <SelectTrigger className={`bg-white dark:bg-slate-800 transition-all duration-200 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-amber-500/20 focus:border-amber-500 ${getFieldError('fuel_type') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                                <SelectValue placeholder="Select fuel type" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white shadow-lg dark:bg-slate-800">
                                                <SelectItem value="diesel">Diesel</SelectItem>
                                                <SelectItem value="petrol">Petrol</SelectItem>
                                                <SelectItem value="gas">Gas</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('fuel_type') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('fuel_type')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="fuel_station" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Fuel Station
                                        </Label>
                                        <Input
                                            id="fuel_station"
                                            type="text"
                                            value={data.fuel_station}
                                            onChange={(event) => handleFieldChange('fuel_station', event.target.value, false)}
                                            placeholder="e.g., National Oil"
                                            className="transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-amber-500/20 focus:border-amber-500"
                                        />
                                        <p className="text-xs text-muted-foreground">Optional: specify supplier for analytics.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="receipt_number" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Receipt Number
                                        </Label>
                                        <Input
                                            id="receipt_number"
                                            type="text"
                                            value={data.receipt_number}
                                            onChange={(event) => handleFieldChange('receipt_number', event.target.value, false)}
                                            placeholder="e.g., RCP-12345"
                                            className="transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-amber-500/20 focus:border-amber-500"
                                        />
                                        <p className="text-xs text-muted-foreground">Optional supporting reference.</p>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                        <GaugeCircle className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Consumption Details</h2>
                                        <p className="text-sm text-muted-foreground">Track timing, volumes, and mileage to monitor efficiency.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="fuel_date" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Fuel Date <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="group relative">
                                            <Input
                                                id="fuel_date"
                                                type="date"
                                                value={data.fuel_date}
                                                onChange={(event) => handleFieldChange('fuel_date', event.target.value)}
                                                className={`pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${getFieldError('fuel_date') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                            />
                                            <div
                                                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 cursor-pointer"
                                                onClick={() => {
                                                    const input = document.getElementById('fuel_date') as HTMLInputElement | null;
                                                    input?.showPicker?.();
                                                }}
                                            >
                                                <Calendar className="h-4 w-4 text-slate-500 transition-colors duration-200 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300" />
                                            </div>
                                        </div>
                                        {getFieldError('fuel_date') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('fuel_date')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="odometer_reading" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Odometer Reading
                                        </Label>
                                        <Input
                                            id="odometer_reading"
                                            type="number"
                                            inputMode="numeric"
                                            value={data.odometer_reading}
                                            onChange={(event) => handleFieldChange('odometer_reading', event.target.value, false)}
                                            placeholder="e.g., 125000"
                                            className="transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-amber-500/20 focus:border-amber-500"
                                        />
                                        <p className="text-xs text-muted-foreground">Optional: captured at refuel time.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="fuel_quantity_liters" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Quantity (Liters) <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="fuel_quantity_liters"
                                            type="number"
                                            inputMode="decimal"
                                            step="0.01"
                                            value={data.fuel_quantity_liters}
                                            onChange={(event) => handleFieldChange('fuel_quantity_liters', event.target.value)}
                                            placeholder="0.00"
                                            className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-amber-500/20 focus:border-amber-500 ${getFieldError('fuel_quantity_liters') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                        />
                                        {getFieldError('fuel_quantity_liters') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('fuel_quantity_liters')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="fuel_price_per_liter" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Price per Liter <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="fuel_price_per_liter"
                                            type="number"
                                            inputMode="decimal"
                                            step="0.01"
                                            value={data.fuel_price_per_liter}
                                            onChange={(event) => handleFieldChange('fuel_price_per_liter', event.target.value)}
                                            placeholder="0.00"
                                            className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-amber-500/20 focus:border-amber-500 ${getFieldError('fuel_price_per_liter') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                        />
                                        {getFieldError('fuel_price_per_liter') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('fuel_price_per_liter')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <div className="flex items-center justify-between rounded-lg border border-dashed border-amber-300/60 bg-amber-50/70 p-4 dark:border-amber-400/40 dark:bg-amber-500/10">
                                            <div className="flex items-center gap-3">
                                                <Calculator className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                                                <div>
                                                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-200">Estimated Total Cost</p>
                                                    <p className="text-xs text-amber-700/80 dark:text-amber-200/80">Auto-calculated from quantity × price.</p>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="text-base font-semibold">
                                                {totalCost !== null ? totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
                                        <NotepadText className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Operational Notes</h2>
                                        <p className="text-sm text-muted-foreground">Capture context such as route, conditions, or anomalies.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Notes
                                    </Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(event) => handleFieldChange('notes', event.target.value, false)}
                                        placeholder="Add any operational context about this fueling event..."
                                        rows={4}
                                        className="transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-amber-500/20 focus:border-amber-500"
                                    />
                                    <p className="text-xs text-muted-foreground">Optional: helps maintenance and finance teams understand anomalies.</p>
                                </div>
                            </section>

                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400 md:flex-row md:items-center md:gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-500">*</span>
                                        <span>Required fields</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Truck className="h-3 w-3" />
                                        <span>Ensure truck assignments reflect current fleet status.</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" asChild className="hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600">
                                        <Link href="/fuel">Cancel</Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || hasErrors}
                                        className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 min-w-[150px]"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <User className="mr-2 h-4 w-4" />
                                                Record Fuel
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
