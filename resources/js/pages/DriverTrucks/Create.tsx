import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { AlertCircle, ArrowLeft, ArrowUp, Calendar, CheckCircle, HelpCircle, Info, Save, Share2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { validateDriverTruck, type ValidationErrors } from '@/lib/validation';
import { type FormEventHandler } from 'react';

interface Truck {
    id: number;
    plate: string;
    status: number;
}

interface Driver {
    id: number;
    name: string;
    driverid: string;
    status: number;
}

interface Props {
    trucks: Truck[];
    drivers: Driver[];
    error?: string;
}

type DriverTruckFormData = {
    truck_id: string;
    driver_id: string;
    date_recived: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Driver-Truck Assignments',
        href: '/driver-trucks',
    },
    {
        title: 'Create Assignment',
        href: '/driver-trucks/create',
    },
];

export default function DriverTrucksCreate({ trucks, drivers, error }: Props) {
    const todayString = useMemo(() => toLocalDateString(new Date()), []);
    const minDateString = useMemo(() => {
        const base = new Date();
        base.setHours(0, 0, 0, 0);
        base.setDate(base.getDate() - 30);
        return toLocalDateString(base);
    }, []);

    const searchParams = useMemo(() => {
        if (typeof window === 'undefined') {
            return null;
        }

        return new URLSearchParams(window.location.search);
    }, []);

    const defaultDriverId = searchParams?.get('driver_id')?.trim() ?? '';
    const defaultTruckId = searchParams?.get('truck_id')?.trim() ?? '';

    const { data, setData, post, processing, errors } = useForm<DriverTruckFormData>({
        truck_id: defaultTruckId,
        driver_id: defaultDriverId,
        date_recived: todayString,
    });

    const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
    const [isDirty, setIsDirty] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [truckSearch, setTruckSearch] = useState('');
    const [driverSearch, setDriverSearch] = useState('');
    const scrollContainerRef = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        if (error) {
            toast({
                title: '⚠️ Error',
                description: error,
                variant: 'destructive',
            });
        }
    }, [error]);

    useEffect(() => {
        const errorMessages = Object.entries(errors).map(([_, message]) => {
            if (typeof message === 'string') return message;
            return String(message);
        });

        if (errorMessages.length > 0) {
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
        const container = scrollContainerRef.current;
        container?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const validateField = (field: keyof DriverTruckFormData, value: string) => {
        const updated = { ...data, [field]: value };
        const fieldError = validateDriverTruck(updated)[field];
        setFrontendErrors((prev) => {
            const next = { ...prev };
            if (fieldError) {
                next[field] = fieldError;
            } else {
                delete next[field];
            }
            return next;
        });
    };

    const handleFieldChange = (field: keyof DriverTruckFormData, value: string) => {
        let nextValue = value;

        if (field === 'date_recived') {
            nextValue = value.slice(0, 10);
        }

        setData(field, nextValue);
        validateField(field, nextValue);
        setIsDirty(true);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const allErrors = validateDriverTruck(data);
        if (Object.keys(allErrors).length > 0) {
            setFrontendErrors(allErrors);
            toast({
                title: '⚠️ Validation Error',
                description: 'Please fix the validation errors before submitting.',
                variant: 'destructive',
            });
            return;
        }

        post('/driver-trucks', {
            data: {
                ...data,
                truck_id: data.truck_id ? Number(data.truck_id) : '',
                driver_id: data.driver_id ? Number(data.driver_id) : '',
            },
            preserveScroll: true,
            onSuccess: () => {
                setFrontendErrors({});
                setIsDirty(false);
            },
        });
    };

    const getFieldError = (field: keyof DriverTruckFormData) => {
        return errors[field] || frontendErrors[field] || '';
    };

    const safeTrucks = useMemo(() => (Array.isArray(trucks) ? trucks : []), [trucks]);
    const safeDrivers = useMemo(() => (Array.isArray(drivers) ? drivers : []), [drivers]);

    const filteredTrucks = useMemo(() => {
        if (!truckSearch.trim()) {
            return safeTrucks;
        }

        const query = truckSearch.toLowerCase();
        return safeTrucks.filter((truck) => {
            const plateMatch = truck.plate?.toLowerCase().includes(query);
            const statusMatch = String(truck.status).includes(query);
            return Boolean(plateMatch || statusMatch);
        });
    }, [safeTrucks, truckSearch]);

    const filteredDrivers = useMemo(() => {
        if (!driverSearch.trim()) {
            return safeDrivers;
        }

        const query = driverSearch.toLowerCase();
        return safeDrivers.filter((driver) => {
            const nameMatch = driver.name?.toLowerCase().includes(query);
            const driverIdMatch = driver.driverid?.toLowerCase().includes(query);
            const statusMatch = String(driver.status).includes(query);
            return Boolean(nameMatch || driverIdMatch || statusMatch);
        });
    }, [safeDrivers, driverSearch]);

    const selectedTruck = safeTrucks.find((truck) => truck.id.toString() === data.truck_id);
    const selectedDriver = safeDrivers.find((driver) => driver.id.toString() === data.driver_id);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Driver-Truck Assignment" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
                    <CardHeader className="px-6 pb-0">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="rounded-xl bg-blue-100 p-2 text-blue-600 shadow-sm dark:bg-blue-900/30 dark:text-blue-400">
                                    <Share2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                        Assign Driver to Truck
                                    </CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                                        Pair an active driver with an available truck and record the assignment start date.
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/driver-trucks">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Assignments
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
                                    Assignment Operations
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
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Assignment Selection</h2>
                                        <p className="text-sm text-muted-foreground">Select the active truck and driver you want to pair together.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="truck_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                <span className="text-red-500">*</span> Available Trucks
                                            </Label>
                                            <div className="group relative">
                                                <HelpCircle className="h-4 w-4 cursor-help text-slate-400 hover:text-slate-600" />
                                                <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                                    Only trucks currently marked as active are shown in this list.
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <Select
                                            value={data.truck_id}
                                            onValueChange={(value) => handleFieldChange('truck_id', value)}
                                            onOpenChange={(open) => {
                                                if (!open) {
                                                    setTruckSearch('');
                                                }
                                            }}
                                        >
                                            <SelectTrigger className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('truck_id') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                                <SelectValue placeholder="Choose a truck" />
                                            </SelectTrigger>
                                            <SelectContent className="z-50 bg-white shadow-lg dark:bg-slate-800">
                                                <div className="sticky top-0 z-10 bg-white p-2 dark:bg-slate-800 dark:shadow-[0_1px_0_0_rgba(148,163,184,0.35)] shadow-[0_1px_0_0_rgba(148,163,184,0.35)]">
                                                    <Input
                                                        autoComplete="off"
                                                        value={truckSearch}
                                                        onChange={(event) => setTruckSearch(event.target.value)}
                                                        placeholder="Search trucks..."
                                                        className="h-9 w-full border-slate-200 bg-slate-50 text-sm focus-visible:ring-1 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                                                    />
                                                </div>
                                                {filteredTrucks.length > 0 ? (
                                                    filteredTrucks.map((truck) => (
                                                        <SelectItem key={truck.id} value={truck.id.toString()} className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                                            {truck.plate}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="no-trucks" disabled>
                                                        No available trucks found
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('truck_id') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('truck_id')}
                                            </p>
                                        )}

                                        {selectedTruck && (
                                            <div className="rounded-lg border border-slate-200 bg-white/70 p-4 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
                                                <h4 className="mb-2 font-semibold text-slate-800 dark:text-slate-200">Selected Truck</h4>
                                                <p className="text-slate-600 dark:text-slate-400">
                                                    <strong>Plate:</strong> {selectedTruck.plate}
                                                </p>
                                                <p className="text-slate-600 dark:text-slate-400">
                                                    <strong>Status:</strong> {selectedTruck.status === 1 ? 'Active' : 'Inactive'}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="driver_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                <span className="text-red-500">*</span> Available Drivers
                                            </Label>
                                            <div className="group relative">
                                                <HelpCircle className="h-4 w-4 cursor-help text-slate-400 hover:text-slate-600" />
                                                <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                                    Drivers already attached to another active truck are filtered out automatically.
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <Select
                                            value={data.driver_id}
                                            onValueChange={(value) => handleFieldChange('driver_id', value)}
                                            onOpenChange={(open) => {
                                                if (!open) {
                                                    setDriverSearch('');
                                                }
                                            }}
                                        >
                                            <SelectTrigger className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('driver_id') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                                <SelectValue placeholder="Choose a driver" />
                                            </SelectTrigger>
                                            <SelectContent className="z-50 bg-white shadow-lg dark:bg-slate-800">
                                                <div className="sticky top-0 z-10 bg-white p-2 dark:bg-slate-800 dark:shadow-[0_1px_0_0_rgba(148,163,184,0.35)] shadow-[0_1px_0_0_rgba(148,163,184,0.35)]">
                                                    <Input
                                                        autoComplete="off"
                                                        value={driverSearch}
                                                        onChange={(event) => setDriverSearch(event.target.value)}
                                                        placeholder="Search drivers..."
                                                        className="h-9 w-full border-slate-200 bg-slate-50 text-sm focus-visible:ring-1 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                                                    />
                                                </div>
                                                {filteredDrivers.length > 0 ? (
                                                    filteredDrivers.map((driver) => (
                                                        <SelectItem key={driver.id} value={driver.id.toString()} className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                                            {driver.name} (ID: {driver.driverid})
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="no-drivers" disabled>
                                                        No available drivers found
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('driver_id') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('driver_id')}
                                            </p>
                                        )}

                                        {selectedDriver && (
                                            <div className="rounded-lg border border-slate-200 bg-white/70 p-4 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
                                                <h4 className="mb-2 font-semibold text-slate-800 dark:text-slate-200">Selected Driver</h4>
                                                <p className="text-slate-600 dark:text-slate-400">
                                                    <strong>Name:</strong> {selectedDriver.name}
                                                </p>
                                                <p className="text-slate-600 dark:text-slate-400">
                                                    <strong>Driver ID:</strong> {selectedDriver.driverid}
                                                </p>
                                                <p className="text-slate-600 dark:text-slate-400">
                                                    <strong>Status:</strong> {selectedDriver.status === 1 ? 'Active' : 'Inactive'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        <Calendar className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Assignment Details</h2>
                                        <p className="text-sm text-muted-foreground">Set the official handover date and review the pairing before submission.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="date_recived" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            <span className="text-red-500">*</span> Assignment Date
                                        </Label>
                                        <div className="group relative">
                                            <Input
                                                id="date_recived"
                                                type="date"
                                                value={data.date_recived}
                                                onChange={(e) => handleFieldChange('date_recived', e.target.value)}
                                                min={minDateString}
                                                max={todayString}
                                                className={`pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${getFieldError('date_recived') ? 'border-red-500 focus:border-red-500' : ''}`}
                                            />
                                            <div
                                                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 cursor-pointer"
                                                onClick={() => {
                                                    const input = document.getElementById('date_recived') as HTMLInputElement | null;
                                                    input?.showPicker?.();
                                                }}
                                            >
                                                <Calendar className="h-4 w-4 text-slate-500 transition-colors duration-200 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300" />
                                            </div>
                                        </div>
                                        {getFieldError('date_recived') && <p className="text-sm text-red-500">{getFieldError('date_recived')}</p>}
                                        <p className="text-xs text-muted-foreground">Must be today or within the last 30 days.</p>
                                    </div>

                                    {(selectedTruck || selectedDriver) && (
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm shadow-sm dark:border-blue-800/60 dark:bg-blue-900/40">
                                            <h4 className="mb-3 font-semibold text-blue-900 dark:text-blue-200">Assignment Summary</h4>
                                            <div className="space-y-2 text-blue-900 dark:text-blue-100">
                                                {selectedDriver && (
                                                    <p>
                                                        <strong>Driver:</strong> {selectedDriver.name} ({selectedDriver.driverid})
                                                    </p>
                                                )}
                                                {selectedTruck && (
                                                    <p>
                                                        <strong>Truck:</strong> {selectedTruck.plate}
                                                    </p>
                                                )}
                                                {data.date_recived && (
                                                    <p>
                                                        <strong>Assignment Date:</strong> {new Date(data.date_recived).toLocaleDateString()}
                                                    </p>
                                                )}
                                                <p>
                                                    <strong>Status:</strong> Active Assignment
                                                </p>
                                            </div>
                                        </div>
                                    )}
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
                                        <Link href="/driver-trucks">Cancel</Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || Object.keys(frontendErrors).length > 0 || !data.truck_id || !data.driver_id || !data.date_recived}
                                        className="min-w-[160px] bg-gradient-to-r from-blue-600 to-blue-700 px-6 text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Create Assignment
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

function toLocalDateString(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}
