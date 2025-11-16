import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useCallback, useState, type FormEventHandler } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PlaceCombobox } from '@/components/place-combobox';
import { AlertCircle, CheckCircle, Save, ArrowLeft, ClipboardList, Loader2 } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performances', href: '/performances' },
    { title: 'Create', href: '/performances/create' },
];

interface Customer { id: number; name: string }
interface Operation { id: number; operationid: string; customer?: Customer | null }
interface Driver { id: number; name: string }
interface Truck { id: number; plate?: string | null }
interface DriverTruck { id: number; driver?: Driver | null; truck?: Truck | null }
interface Place { id: number; name: string }
interface PerformancesCreateProps { operations: Operation[]; driverTrucks: DriverTruck[]; places: Place[] }

interface PerformanceFormData {
    load_phase: '' | 'main' | 'return';
    load_completion: '' | 'full' | 'partial';
    FOnumber: string;
    operation_id: string;
    driver_truck_id: string;
    DateDispach: string;
    orgion_id: string;
    destination_id: string;
    DistanceWCargo: string;
    DistanceWOCargo: string;
    CargoVolumMT: string;
    fuelInLitter: string;
    fuelInBirr: string;
    perdiem: string;
    other: string;
    comment: string;
    satus: 'active' | 'inactive';
    is_returned: boolean;
    returned_date: string;
    tonkm: string;
}

const RECENT_PERFORMANCE_KEY = 'performance_recent_selections';
interface RecentSelections { operations: string[]; driverTrucks: string[] }

export default function PerformancesCreate({ operations, driverTrucks, places }: PerformancesCreateProps) {
    const { data, setData, post, processing, errors, reset } = useForm<PerformanceFormData>({
        load_phase: '',
        load_completion: '',
        FOnumber: '',
        operation_id: '',
        driver_truck_id: '',
        DateDispach: '',
        orgion_id: '',
        destination_id: '',
        DistanceWCargo: '',
        DistanceWOCargo: '',
        CargoVolumMT: '',
        fuelInLitter: '',
        fuelInBirr: '',
        perdiem: '',
        other: '',
        comment: '',
        satus: 'active',
        is_returned: false,
        returned_date: '',
        tonkm: '0.00',
    });

    const [recent, setRecent] = useState<RecentSelections>({ operations: [], driverTrucks: [] });
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
    const [distanceStatus, setDistanceStatus] = useState<{ found: boolean; message: string } | null>(null);
    const [distanceLoading, setDistanceLoading] = useState(false);

    const computeTonKilometers = useCallback((distanceWithCargo: string, cargoVolume: string): string => {
        const distanceValue = parseFloat(distanceWithCargo || '0');
        const cargoValue = parseFloat(cargoVolume || '0');

        if (!Number.isFinite(distanceValue) || !Number.isFinite(cargoValue)) {
            return '0.00';
        }

        const tonKm = distanceValue * cargoValue;
        if (tonKm <= 0) {
            return '0.00';
        }

        return tonKm.toFixed(2);
    }, []);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(RECENT_PERFORMANCE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as RecentSelections;
                setRecent({
                    operations: Array.isArray(parsed.operations) ? parsed.operations.slice(0, 6) : [],
                    driverTrucks: Array.isArray(parsed.driverTrucks) ? parsed.driverTrucks.slice(0, 6) : [],
                });
            }
        } catch (_) {}
    }, []);

    const pushRecent = useCallback((type: keyof RecentSelections, value: string) => {
        setRecent(prev => {
            const nextList = [value, ...prev[type].filter(v => v !== value)].slice(0, 6);
            const next = { ...prev, [type]: nextList };
            try { localStorage.setItem(RECENT_PERFORMANCE_KEY, JSON.stringify(next)); } catch (_) {}
            return next;
        });
    }, []);

    const handleDistanceAutoFill = useCallback(async (originId: string, destinationId: string) => {
        if (!originId || !destinationId) {
            return;
        }

        setDistanceLoading(true);
        setDistanceStatus(null);

        try {
            const params = new URLSearchParams({
                from_place_id: originId,
                to_place_id: destinationId,
            });

            const response = await fetch(`/performances/calculate-distance?${params.toString()}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error(`Distance lookup failed with status ${response.status}`);
            }

            const result = await response.json() as { distance?: number | string; found?: boolean; note?: string };
            const numericDistance = typeof result.distance === 'number'
                ? result.distance
                : parseFloat(result.distance ?? '0');
            const safeDistance = Number.isFinite(numericDistance) ? numericDistance : 0;
            const formattedDistance = safeDistance.toFixed(2);
            if (result.found) {
                setData('DistanceWCargo', formattedDistance);
                setData('DistanceWOCargo', formattedDistance);
                setData('tonkm', computeTonKilometers(formattedDistance, data.CargoVolumMT));
                setDistanceStatus({
                    found: true,
                    message: `Distance auto-filled from registered route (${formattedDistance} km).`,
                });
            } else {
                setData('DistanceWCargo', '0.00');
                setData('DistanceWOCargo', '0.00');
                setData('tonkm', computeTonKilometers('0.00', data.CargoVolumMT));
                setDistanceStatus({
                    found: false,
                    message: result.note ?? 'Distance for this origin and destination is not registered yet. Value set to 0 km.',
                });
            }
        } catch (error) {
            console.error('Distance auto-fill failed:', error);
            setData('DistanceWCargo', '0.00');
            setData('DistanceWOCargo', '0.00');
            setData('tonkm', computeTonKilometers('0.00', data.CargoVolumMT));
            setDistanceStatus({
                found: false,
                message: 'Unable to resolve distance. Distance was set to 0 km.',
            });
        } finally {
            setDistanceLoading(false);
        }
    }, [computeTonKilometers, data.CargoVolumMT, setData]);

    const handleChange = useCallback(<K extends keyof PerformanceFormData>(field: K, value: PerformanceFormData[K]) => {
        const nextState: PerformanceFormData = { ...data, [field]: value } as PerformanceFormData;
        setData(field, value as any);
        if (clientErrors[field]) {
            setClientErrors(prev => { const { [field]: _, ...rest } = prev; return rest; });
        }

        if (field === 'CargoVolumMT') {
            const tonKm = computeTonKilometers(nextState.DistanceWCargo, String(value));
            setData('tonkm', tonKm);
        }

        if (field === 'orgion_id' || field === 'destination_id') {
            setDistanceStatus(null);
            if (!nextState.orgion_id || !nextState.destination_id) {
                setDistanceLoading(false);
                setData('DistanceWCargo', '');
                if (!nextState.DistanceWOCargo) {
                    setData('DistanceWOCargo', '');
                }
                setData('tonkm', computeTonKilometers('', nextState.CargoVolumMT));
                return;
            }

            void handleDistanceAutoFill(nextState.orgion_id, nextState.destination_id);
        }
    }, [clientErrors, computeTonKilometers, data, handleDistanceAutoFill, setData]);
    const getFieldError = (field: string): string | undefined => clientErrors[field] || (errors as Record<string,string>)[field];

    const validateClient = (): boolean => {
        const required: (keyof PerformanceFormData)[] = ['load_phase','load_completion','FOnumber','operation_id','driver_truck_id','DateDispach','orgion_id','destination_id','satus'];
        const newErrors: Record<string,string> = {};
        required.forEach(f => { if (!String(data[f]).trim()) newErrors[f] = 'Required'; });
        if (data.is_returned && !data.returned_date) newErrors['returned_date'] = 'Returned date required';
        setClientErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const submit: FormEventHandler = e => {
        e.preventDefault();
        if (!validateClient()) return;
        post('/performances', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setDistanceStatus(null);
                setDistanceLoading(false);
            },
        });
    };

    const isDirty = Object.keys(data).some(key => {
        const k = key as keyof PerformanceFormData;
        const initial: Record<string, unknown> = { load_phase:'',load_completion:'',FOnumber:'',operation_id:'',driver_truck_id:'',DateDispach:'',orgion_id:'',destination_id:'',DistanceWCargo:'',DistanceWOCargo:'',CargoVolumMT:'',fuelInLitter:'',fuelInBirr:'',perdiem:'',other:'',comment:'',satus:'active',is_returned:false,returned_date:'',tonkm:'0.00' };
        return data[k] !== initial[k];
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Performance" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
                    <CardHeader className="px-6 pb-0">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="rounded-xl bg-indigo-100 p-2 text-indigo-600 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-400">
                                    <CheckCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Record Performance</CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400">Log a trip’s operational metrics with quick favorites and inline validation.</CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/performances">
                                        <ArrowLeft className="mr-2 h-4 w-4" />Back to Performances
                                    </Link>
                                </Button>
                                {isDirty && (
                                    <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                        <Save className="h-3 w-3" />Unsaved Changes
                                    </div>
                                )}
                                <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />Performance Control
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
                        <form onSubmit={submit} className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24" noValidate>
                            <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                                <div className="flex items-center gap-2.5 text-sm">
                                    <div className="rounded-md bg-indigo-100 p-1.5 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                        <ClipboardList className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Trip Overview</h2>
                                        <p className="text-xs text-muted-foreground">Identify the trip and link operational actors.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                <div className="space-y-4 lg:col-span-1">
                                    <div className="space-y-2">
                                        <Label htmlFor="load_phase">Load Phase <span className="text-red-500">*</span></Label>
                                        <Select value={data.load_phase} onValueChange={v => handleChange('load_phase', v as PerformanceFormData['load_phase'])}>
                                            <SelectTrigger id="load_phase" className={getFieldError('load_phase') ? 'border-red-500' : ''}><SelectValue placeholder="Select phase" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="main">Main Load</SelectItem>
                                                <SelectItem value="return">Return Load</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('load_phase') && <p className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" />{getFieldError('load_phase')}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="load_completion">Load Completion <span className="text-red-500">*</span></Label>
                                        <Select value={data.load_completion} onValueChange={v => handleChange('load_completion', v as PerformanceFormData['load_completion'])}>
                                            <SelectTrigger id="load_completion" className={getFieldError('load_completion') ? 'border-red-500' : ''}><SelectValue placeholder="Select completion" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="full">Full Load</SelectItem>
                                                <SelectItem value="partial">Partial Load</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('load_completion') && <p className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" />{getFieldError('load_completion')}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="FOnumber">FO Number <span className="text-red-500">*</span></Label>
                                        <Input id="FOnumber" value={data.FOnumber} onChange={e => handleChange('FOnumber', e.target.value)} className={getFieldError('FOnumber') ? 'border-red-500' : ''} />
                                        {getFieldError('FOnumber') && <p className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" />{getFieldError('FOnumber')}</p>}
                                    </div>
                                </div>
                                <div className="space-y-4 lg:col-span-1">
                                    <div className="space-y-2">
                                        <Label htmlFor="operation_id">Operation <span className="text-red-500">*</span></Label>
                                        <Select value={data.operation_id} onValueChange={v => { handleChange('operation_id', v); pushRecent('operations', v); }}>
                                            <SelectTrigger id="operation_id" className={getFieldError('operation_id') ? 'border-red-500' : ''}><SelectValue placeholder="Select operation" /></SelectTrigger>
                                            <SelectContent>
                                                {operations.map(op => <SelectItem key={op.id} value={op.id.toString()}>{op.operationid}{op.customer?.name ? ` — ${op.customer.name}` : ''}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {recent.operations.length > 0 && (
                                            <div className="flex flex-wrap gap-1 pt-1">
                                                {recent.operations.map(id => {
                                                    const op = operations.find(o => o.id.toString() === id);
                                                    if (!op) return null;
                                                    return <button type="button" key={id} onClick={() => handleChange('operation_id', id)} className={`rounded px-2 py-0.5 text-xs border ${data.operation_id === id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>{op.operationid}</button>;
                                                })}
                                            </div>
                                        )}
                                        {getFieldError('operation_id') && <p className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" />{getFieldError('operation_id')}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="driver_truck_id">Driver & Truck <span className="text-red-500">*</span></Label>
                                        <Select value={data.driver_truck_id} onValueChange={v => { handleChange('driver_truck_id', v); pushRecent('driverTrucks', v); }}>
                                            <SelectTrigger id="driver_truck_id" className={getFieldError('driver_truck_id') ? 'border-red-500' : ''}><SelectValue placeholder="Select combo" /></SelectTrigger>
                                            <SelectContent>
                                                {driverTrucks.map(dt => <SelectItem key={dt.id} value={dt.id.toString()}>{dt.driver?.name || 'Driver'} / {dt.truck?.plate || 'Truck'}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {recent.driverTrucks.length > 0 && (
                                            <div className="flex flex-wrap gap-1 pt-1">
                                                {recent.driverTrucks.map(id => {
                                                    const dt = driverTrucks.find(d => d.id.toString() === id);
                                                    if (!dt) return null;
                                                    return <button type="button" key={id} onClick={() => handleChange('driver_truck_id', id)} className={`rounded px-2 py-0.5 text-xs border ${data.driver_truck_id === id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{dt.driver?.name?.split(' ')[0] || 'Driver'}</button>;
                                                })}
                                            </div>
                                        )}
                                        {getFieldError('driver_truck_id') && <p className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" />{getFieldError('driver_truck_id')}</p>}
                                    </div>
                                </div>
                                <div className="space-y-4 lg:col-span-1">
                                    <div className="space-y-2">
                                        <Label htmlFor="DateDispach">Dispatch Date <span className="text-red-500">*</span></Label>
                                        <Input id="DateDispach" type="date" value={data.DateDispach} onChange={e => handleChange('DateDispach', e.target.value)} className={getFieldError('DateDispach') ? 'border-red-500' : ''} />
                                        {getFieldError('DateDispach') && <p className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" />{getFieldError('DateDispach')}</p>}
                                    </div>
                                    <PlaceCombobox
                                        id="orgion_id"
                                        label="Origin"
                                        required
                                        value={data.orgion_id}
                                        places={places}
                                        placeholder="Search origin..."
                                        onSelect={(value: string) => handleChange('orgion_id', value)}
                                        error={getFieldError('orgion_id')}
                                    />
                                    <PlaceCombobox
                                        id="destination_id"
                                        label="Destination"
                                        required
                                        value={data.destination_id}
                                        places={places}
                                        placeholder="Search destination..."
                                        onSelect={(value: string) => handleChange('destination_id', value)}
                                        error={getFieldError('destination_id')}
                                    />
                                </div>
                                </div>
                            </section>

                            <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                                <div className="flex items-center gap-2.5 text-sm">
                                    <div className="rounded-md bg-indigo-100 p-1.5 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                        <ClipboardList className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Costs & Metrics</h2>
                                        <p className="text-xs text-muted-foreground">Capture distance, tonnage, and cost elements.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="DistanceWCargo">Distance with Cargo (km)</Label>
                                    <Input
                                        id="DistanceWCargo"
                                        type="number"
                                        step="0.01"
                                        value={data.DistanceWCargo}
                                        readOnly
                                        placeholder="Auto-filled from distance table"
                                        className="cursor-not-allowed bg-muted/50"
                                    />
                                    {distanceLoading && (
                                        <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Resolving distance...
                                        </p>
                                    )}
                                    {distanceStatus && (
                                        <Alert variant={distanceStatus.found ? 'default' : 'destructive'} className="mt-2">
                                            {distanceStatus.found ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-destructive" />}
                                            <AlertTitle>{distanceStatus.found ? 'Distance applied' : 'Distance missing'}</AlertTitle>
                                            <AlertDescription>{distanceStatus.message}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="DistanceWOCargo">Distance Empty (km)</Label>
                                    <Input id="DistanceWOCargo" type="number" step="0.01" value={data.DistanceWOCargo} onChange={e => handleChange('DistanceWOCargo', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="CargoVolumMT">Cargo Volume (MT)</Label>
                                    <Input id="CargoVolumMT" type="number" step="0.01" value={data.CargoVolumMT} onChange={e => handleChange('CargoVolumMT', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tonkm">Ton-Km</Label>
                                    <Input id="tonkm" value={data.tonkm} readOnly className="cursor-not-allowed bg-muted/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fuelInLitter">Fuel (L)</Label>
                                    <Input id="fuelInLitter" type="number" step="0.01" value={data.fuelInLitter} onChange={e => handleChange('fuelInLitter', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fuelInBirr">Fuel Cost (Birr)</Label>
                                    <Input id="fuelInBirr" type="number" step="0.01" value={data.fuelInBirr} onChange={e => handleChange('fuelInBirr', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="perdiem">Per Diem (Birr)</Label>
                                    <Input id="perdiem" type="number" step="0.01" value={data.perdiem} onChange={e => handleChange('perdiem', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="other">Other Cost (Birr)</Label>
                                    <Input id="other" type="number" step="0.01" value={data.other} onChange={e => handleChange('other', e.target.value)} />
                                </div>
                                </div>
                            </section>

                            <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                                <div className="flex items-center gap-2.5 text-sm">
                                    <div className="rounded-md bg-indigo-100 p-1.5 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                        <ClipboardList className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Status & Return</h2>
                                        <p className="text-xs text-muted-foreground">Update lifecycle state and return info.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="satus">Status <span className="text-red-500">*</span></Label>
                                    <Select value={data.satus} onValueChange={v => handleChange('satus', v as 'active'|'inactive')}>
                                        <SelectTrigger id="satus" className={getFieldError('satus') ? 'border-red-500' : ''}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {getFieldError('satus') && <p className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" />{getFieldError('satus')}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="is_returned" className="flex items-center gap-2">Returned?
                                        <input type="checkbox" id="is_returned" checked={data.is_returned} onChange={e => handleChange('is_returned', e.target.checked)} />
                                    </Label>
                                    {data.is_returned && (
                                        <div className="space-y-2">
                                            <Label htmlFor="returned_date">Returned Date</Label>
                                            <Input id="returned_date" type="date" value={data.returned_date} onChange={e => handleChange('returned_date', e.target.value)} className={getFieldError('returned_date') ? 'border-red-500' : ''} />
                                            {getFieldError('returned_date') && <p className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" />{getFieldError('returned_date')}</p>}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2 md:col-span-1">
                                    <Label htmlFor="comment">Comment / Notes</Label>
                                    <Textarea id="comment" value={data.comment} onChange={e => handleChange('comment', e.target.value)} className="min-h-[120px]" />
                                </div>
                                </div>
                            </section>

                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <span className="text-red-500">*</span>
                                        <span>All required fields must be completed</span>
                                    </div>
                                    {isDirty && <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400"><Save className="h-3 w-3" />Unsaved changes</div>}
                                </div>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" asChild><Link href="/performances">Cancel</Link></Button>
                                    <Button type="submit" disabled={processing} className="min-w-[160px] bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 text-white shadow-lg transition-all duration-200 hover:from-indigo-700 hover:to-indigo-800 hover:shadow-xl">
                                        {processing ? (<><div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />Saving...</>) : (<><CheckCircle className="mr-2 h-4 w-4" />Save Performance</>)}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

