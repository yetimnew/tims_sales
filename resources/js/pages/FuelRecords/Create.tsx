import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { FormField } from '@/components/forms/form-field';
import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { validateFuel } from '@/lib/validation';
import { type BreadcrumbItem } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, DollarSign, Fuel, Info, MapPin, Save, Truck } from 'lucide-react';
import { type FormEventHandler } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Fuel Records',
        href: '/fuel-records',
    },
    {
        title: 'Create',
        href: '/fuel-records/create',
    },
];

interface DriverTruck {
    id: number;
    truck_plate: string;
    truck_model: string;
    driver_name: string;
    driver_license: string;
    assigned_date: string;
}

interface FuelRecordsCreateProps {
    driverTrucks: DriverTruck[];
}

type FuelFormData = {
    driver_truck_id: string;
    fuel_date: string;
    fuel_quantity_liters: string;
    fuel_price_per_liter: string;
    total_cost: string;
    fuel_station: string;
    fuel_type: string;
    odometer_reading: string;
    receipt_number: string;
    notes: string;
};

type FuelFormField = keyof FuelFormData;

const customValidationMessage = (field: FuelFormField, value: string): string => {
    switch (field) {
        case 'fuel_station': {
            if (!value.trim()) {
                return 'Fuel station is required.';
            }
            return value.length > 255 ? 'Fuel station cannot exceed 255 characters.' : '';
        }
        case 'total_cost': {
            if (!value) {
                return '';
            }
            const num = Number.parseFloat(value);
            if (!Number.isFinite(num)) {
                return 'Total cost must be a valid number.';
            }
            if (num < 0) {
                return 'Total cost cannot be negative.';
            }
            return '';
        }
        case 'odometer_reading': {
            if (!value) {
                return '';
            }
            if (!/^\d+$/.test(value)) {
                return 'Odometer must be a whole number.';
            }
            return '';
        }
        case 'receipt_number':
            return value.length > 255 ? 'Receipt number cannot exceed 255 characters.' : '';
        case 'notes':
            return value.length > 1000 ? 'Notes cannot exceed 1000 characters.' : '';
        default:
            return '';
    }
};

export default function FuelRecordsCreate({ driverTrucks }: FuelRecordsCreateProps) {
    const { data, setData, post, processing, errors, clearErrors, reset } = useForm<FuelFormData>({
        driver_truck_id: '',
        fuel_date: new Date().toISOString().split('T')[0],
        fuel_quantity_liters: '',
        fuel_price_per_liter: '',
        total_cost: '',
        fuel_station: '',
        fuel_type: '',
        odometer_reading: '',
        receipt_number: '',
        notes: '',
    });

    const [frontendErrors, setFrontendErrors] = useState<Partial<Record<FuelFormField, string>>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const formRef = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        const container = formRef.current;
        if (!container) {
            return;
        }

        const handleScroll = () => setShowScrollTop(container.scrollTop > 240);
        handleScroll();
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const errorMessages = Object.values(errors)
            .map((message) => (typeof message === 'string' ? message : String(message)))
            .filter(Boolean);

        if (errorMessages.length > 0) {
            toast({
                title: '⚠️ Validation Error',
                description: errorMessages.join(', '),
                variant: 'destructive',
            });
        }
    }, [errors]);

    const backendErrors = useMemo(
        () =>
            Object.entries(errors).reduce<Partial<Record<FuelFormField, string>>>((acc, [key, value]) => {
                const message = typeof value === 'string' ? value : value ? String(value) : '';
                if (message) {
                    acc[key as FuelFormField] = message;
                }
                return acc;
            }, {}),
        [errors],
    );

    const fieldErrors = useMemo(
        () => ({
            ...frontendErrors,
            ...backendErrors,
        }),
        [frontendErrors, backendErrors],
    );

    const handleScrollToTop = () => {
        formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const calculateTotalCost = (quantity: string, price: string): string => {
        const quantityValue = Number.parseFloat(quantity);
        const priceValue = Number.parseFloat(price);
        if (!Number.isFinite(quantityValue) || !Number.isFinite(priceValue) || quantityValue <= 0 || priceValue <= 0) {
            return '';
        }

        return (quantityValue * priceValue).toFixed(2);
    };

    const validateField = (field: FuelFormField, value: string) => {
        const result = validateFuel({ ...data, [field]: value });
        const message = result[field] ?? customValidationMessage(field, value);

        setFrontendErrors((prev) => {
            const next = { ...prev };
            if (message) {
                next[field] = message;
            } else {
                delete next[field];
            }
            return next;
        });
    };

    const handleFieldChange = (field: FuelFormField, value: string) => {
        setData(field, value);
        clearErrors(field);
        validateField(field, value);
        setIsDirty(true);

        if (field === 'fuel_quantity_liters' || field === 'fuel_price_per_liter') {
            const nextQuantity = field === 'fuel_quantity_liters' ? value : data.fuel_quantity_liters;
            const nextPrice = field === 'fuel_price_per_liter' ? value : data.fuel_price_per_liter;
            const total = calculateTotalCost(nextQuantity, nextPrice);
            setData('total_cost', total);
            validateField('total_cost', total);
        }
    };

    const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const validationResult = validateFuel(data);
        const customResults = (Object.keys(data) as FuelFormField[]).reduce<Partial<Record<FuelFormField, string>>>((acc, key) => {
            const message = customValidationMessage(key, data[key]);
            if (message) {
                acc[key] = message;
            }
            return acc;
        }, {});

        const combinedErrors = { ...validationResult, ...customResults } as Partial<Record<FuelFormField, string>>;

        if (Object.keys(combinedErrors).length > 0) {
            setFrontendErrors(combinedErrors);
            toast({
                title: '⚠️ Validation Error',
                description: 'Please fix the highlighted errors before submitting.',
                variant: 'destructive',
            });
            return;
        }

        post('/fuel-records', {
            preserveScroll: true,
            onSuccess: () => {
                setIsDirty(false);
                setFrontendErrors({});
                clearErrors();
                reset();
                formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            },
            onError: (pageErrors) => {
                setFrontendErrors((prev) => ({ ...prev, ...(pageErrors as Partial<Record<FuelFormField, string>>) }));
            },
        });
    };

    const getFieldError = (field: FuelFormField): string => fieldErrors[field] ?? '';
    const hasErrors = Object.values(fieldErrors).some(Boolean);
    const calculatedTotal = useMemo(
        () => calculateTotalCost(data.fuel_quantity_liters, data.fuel_price_per_liter),
        [data.fuel_quantity_liters, data.fuel_price_per_liter],
    );
    const quantityDisplay = useMemo(() => Number.parseFloat(data.fuel_quantity_liters) || 0, [data.fuel_quantity_liters]);
    const priceDisplay = useMemo(() => Number.parseFloat(data.fuel_price_per_liter) || 0, [data.fuel_price_per_liter]);

    return (
        <FormPageLayout
            title="Create Fuel Record"
            headTitle="Create Fuel Record"
            description="Log a new fuel purchase for the selected driver and truck assignment."
            breadcrumbs={breadcrumbs}
            icon={<Fuel className="h-5 w-5" />}
            headerAside={
                <>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/fuel-records">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Fuel Records
                        </Link>
                    </Button>
                    {isDirty && <UnsavedChangesBadge />}
                    <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
                        Fuel Management
                    </div>
                </>
            }
        >
            <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24"
                style={{ minHeight: 0 }}
            >
                <FormSection
                    title="Driver & Truck"
                    description="Choose the active driver-truck assignment for this refuel."
                    icon={
                        <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <Truck className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-1"
                >
                    <div data-field="driver_truck_id">
                        <FormField
                            id="driver_truck_id"
                            label="Driver & Truck Assignment"
                            required
                            helperText="Only active assignments are listed."
                            error={getFieldError('driver_truck_id')}
                        >
                            <Select value={data.driver_truck_id} onValueChange={(value) => handleFieldChange('driver_truck_id', value)}>
                                <SelectTrigger
                                    id="driver_truck_id"
                                    className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-700 dark:focus:border-blue-400 ${getFieldError('driver_truck_id') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                                >
                                    <SelectValue placeholder="Select driver & truck" />
                                </SelectTrigger>
                                <SelectContent>
                                    {driverTrucks.map((assignment) => (
                                        <SelectItem key={assignment.id} value={String(assignment.id)}>
                                            {assignment.truck_plate} · {assignment.truck_model} — {assignment.driver_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                    </div>
                </FormSection>

                <FormSection
                    title="Fuel Details"
                    description="Capture when and where the refill took place."
                    icon={
                        <div className="rounded-lg bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                            <Info className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-2"
                >
                    <FormField id="fuel_date" label="Fuel Date" required error={getFieldError('fuel_date')}>
                        <Input
                            id="fuel_date"
                            name="fuel_date"
                            type="date"
                            value={data.fuel_date}
                            onChange={(event) => handleFieldChange('fuel_date', event.target.value)}
                            className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-700 dark:focus:border-blue-400 ${getFieldError('fuel_date') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                        />
                    </FormField>
                    <FormField
                        id="fuel_station"
                        label="Fuel Station"
                        required
                        helperText="Name of the fuel station (max 255 characters)."
                        error={getFieldError('fuel_station')}
                    >
                        <Input
                            id="fuel_station"
                            name="fuel_station"
                            type="text"
                            value={data.fuel_station}
                            onChange={(event) => handleFieldChange('fuel_station', event.target.value)}
                            placeholder="e.g. Total Bole Station"
                            className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-700 dark:focus:border-blue-400 ${getFieldError('fuel_station') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                        />
                    </FormField>
                    <FormField id="fuel_type" label="Fuel Type" required error={getFieldError('fuel_type')}>
                        <Select value={data.fuel_type} onValueChange={(value) => handleFieldChange('fuel_type', value)}>
                            <SelectTrigger
                                id="fuel_type"
                                className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-700 dark:focus:border-blue-400 ${getFieldError('fuel_type') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                            >
                                <SelectValue placeholder="Select fuel type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="diesel">Diesel</SelectItem>
                                <SelectItem value="petrol">Petrol</SelectItem>
                                <SelectItem value="gas">Gas</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>
                    <FormField id="fuel_station_summary" label="Station Summary" helperText="Helpful when reviewing records later.">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                            <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                                <MapPin className="h-4 w-4" />
                                {data.fuel_station ? data.fuel_station : 'No station provided yet'}
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Record the station name to make auditing refuels easier in the future.
                            </p>
                        </div>
                    </FormField>
                </FormSection>

                <FormSection
                    title="Quantities & Cost"
                    description="Enter quantities and pricing. Total cost calculates automatically."
                    icon={
                        <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-3"
                >
                    <FormField
                        id="fuel_quantity_liters"
                        label="Quantity (Liters)"
                        required
                        helperText="Use decimals if needed."
                        error={getFieldError('fuel_quantity_liters')}
                    >
                        <Input
                            id="fuel_quantity_liters"
                            name="fuel_quantity_liters"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.fuel_quantity_liters}
                            onChange={(event) => handleFieldChange('fuel_quantity_liters', event.target.value)}
                            placeholder="0.00"
                            className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-700 dark:focus:border-blue-400 ${getFieldError('fuel_quantity_liters') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                        />
                    </FormField>
                    <FormField
                        id="fuel_price_per_liter"
                        label="Price per Liter"
                        required
                        helperText="Enter the unit price in ETB."
                        error={getFieldError('fuel_price_per_liter')}
                    >
                        <Input
                            id="fuel_price_per_liter"
                            name="fuel_price_per_liter"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.fuel_price_per_liter}
                            onChange={(event) => handleFieldChange('fuel_price_per_liter', event.target.value)}
                            placeholder="0.00"
                            className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-700 dark:focus:border-blue-400 ${getFieldError('fuel_price_per_liter') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                        />
                    </FormField>
                    <FormField
                        id="total_cost"
                        label="Total Cost"
                        helperText="Automatically calculated. Adjust if surcharges apply."
                        error={getFieldError('total_cost')}
                    >
                        <Input
                            id="total_cost"
                            name="total_cost"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.total_cost}
                            onChange={(event) => handleFieldChange('total_cost', event.target.value)}
                            placeholder={calculatedTotal || '0.00'}
                            className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-700 dark:focus:border-blue-400 ${getFieldError('total_cost') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                        />
                    </FormField>
                    <div className="md:col-span-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-2 font-semibold">
                                    <DollarSign className="h-4 w-4 text-emerald-500" />
                                    Estimated Total Cost
                                </div>
                                <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                                    {calculatedTotal ? `${calculatedTotal} ETB` : '—'}
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 text-xs text-muted-foreground md:grid-cols-3">
                                <div>
                                    <span className="font-medium text-slate-600 dark:text-slate-300">Quantity</span>
                                    <p>{quantityDisplay > 0 ? `${quantityDisplay.toFixed(2)} liters` : 'Awaiting input'}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-slate-600 dark:text-slate-300">Unit Price</span>
                                    <p>{priceDisplay > 0 ? `${priceDisplay.toFixed(2)} ETB` : 'Awaiting input'}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-slate-600 dark:text-slate-300">Manual Override</span>
                                    <p>{data.total_cost ? `${data.total_cost} ETB` : 'Not set'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </FormSection>

                <FormSection
                    title="Tracking Details"
                    description="Optional extras that make reconciliation easier."
                    icon={
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800/40 dark:text-slate-300">
                            <Info className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-2"
                >
                    <FormField
                        id="odometer_reading"
                        label="Odometer Reading"
                        helperText="Record the vehicle mileage at the time of refuel."
                        error={getFieldError('odometer_reading')}
                    >
                        <Input
                            id="odometer_reading"
                            name="odometer_reading"
                            type="number"
                            min="0"
                            value={data.odometer_reading}
                            onChange={(event) => handleFieldChange('odometer_reading', event.target.value)}
                            placeholder="Optional"
                            className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-700 dark:focus:border-blue-400 ${getFieldError('odometer_reading') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                        />
                    </FormField>
                    <FormField
                        id="receipt_number"
                        label="Receipt Number"
                        helperText="Add the receipt reference for auditing."
                        error={getFieldError('receipt_number')}
                    >
                        <Input
                            id="receipt_number"
                            name="receipt_number"
                            type="text"
                            value={data.receipt_number}
                            onChange={(event) => handleFieldChange('receipt_number', event.target.value)}
                            placeholder="Optional"
                            className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-700 dark:focus:border-blue-400 ${getFieldError('receipt_number') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                        />
                    </FormField>
                    <FormField
                        id="notes"
                        label="Notes"
                        helperText="Capture anything unusual about this refuel."
                        error={getFieldError('notes')}
                        contentClassName="md:col-span-2"
                    >
                        <Textarea
                            id="notes"
                            name="notes"
                            value={data.notes}
                            onChange={(event) => handleFieldChange('notes', event.target.value)}
                            placeholder="Optional notes about the fuel purchase"
                            rows={4}
                            className={`resize-none border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-700 dark:focus:border-blue-400 ${getFieldError('notes') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                        />
                    </FormField>
                </FormSection>

                <FormActionsBar
                    left={
                        <>
                            <span className="flex items-center gap-2 text-sm">
                                <span className="text-red-500">*</span>
                                Required fields must be completed before saving.
                            </span>
                            {isDirty && (
                                <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <Save className="h-4 w-4" />
                                    Unsaved changes detected.
                                </span>
                            )}
                        </>
                    }
                    right={
                        <>
                            <Button type="button" variant="outline" asChild className="border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                                <Link href="/fuel-records">Cancel</Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || hasErrors}
                                className="min-w-[180px] bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transition hover:from-blue-700 hover:to-blue-800"
                            >
                                {processing ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Create Fuel Record
                                    </>
                                )}
                            </Button>
                        </>
                    }
                />
            </form>
            <ScrollToTopFab visible={showScrollTop} onClick={handleScrollToTop} />
        </FormPageLayout>
    );
}
