import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { validateDriver, type ValidationErrors } from '@/lib/validation';
import { toast } from '@/hooks/use-toast';
import {
    AlertCircle,
    Info,
    User,
    MapPin,
    Calendar,
    CheckCircle,
    HelpCircle,
    Save,
    User as UserIcon,
    Hash,
    ArrowUp,
    ArrowLeft,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Drivers',
        href: '/drivers',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

interface Driver {
    id: number
    driverid: string
    name: string
    sex: string
    birthdate?: string
    zone?: string
    woreda?: string
    kebele?: string
    housenumber?: string
    mobile?: string
    hireddate?: string
    status: string
}

interface DriversEditProps {
    driver: Driver
}

export default function DriversEdit({ driver }: DriversEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        driverid: driver.driverid ?? '',
        name: driver.name ?? '',
        sex: driver.sex ?? '',
        birthdate: driver.birthdate ?? '',
        zone: driver.zone ?? '',
        woreda: driver.woreda ?? '',
        kebele: driver.kebele ?? '',
        housenumber: driver.housenumber ?? '',
        mobile: driver.mobile ?? '',
        hireddate: driver.hireddate ?? '',
        status: driver.status ?? 'active',
    })

    const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({})
    const [isDirty, setIsDirty] = useState(false)
    const scrollContainerRef = useRef<HTMLFormElement | null>(null)
    const [showScrollTop, setShowScrollTop] = useState(false)

    const validateField = (field: string, value: string) => {
        const fieldErrors = { ...frontendErrors }

        if (field === 'driverid') {
            const sanitizedValue = value.toUpperCase().slice(0, 255)
            const error = validateDriver({ ...data, driverid: sanitizedValue }).driverid
            if (error) {
                fieldErrors.driverid = error
            } else {
                delete fieldErrors.driverid
            }
        } else if (field === 'name') {
            const error = validateDriver({ ...data, name: value }).name
            if (error) {
                fieldErrors.name = error
            } else {
                delete fieldErrors.name
            }
        } else if (field === 'sex') {
            const error = validateDriver({ ...data, sex: value }).sex
            if (error) {
                fieldErrors.sex = error
            } else {
                delete fieldErrors.sex
            }
        } else if (field === 'mobile') {
            const error = validateDriver({ ...data, mobile: value }).mobile
            if (error) {
                fieldErrors.mobile = error
            } else {
                delete fieldErrors.mobile
            }
        } else if (field === 'hireddate') {
            const error = validateDriver({ ...data, hireddate: value }).hireddate
            if (error) {
                fieldErrors.hireddate = error
            } else {
                delete fieldErrors.hireddate
            }
        } else if (field === 'birthdate') {
            const error = validateDriver({ ...data, birthdate: value }).birthdate
            if (error) {
                fieldErrors.birthdate = error
            } else {
                delete fieldErrors.birthdate
            }
        } else if (field === 'status') {
            const error = validateDriver({ ...data, status: value }).status
            if (error) {
                fieldErrors.status = error
            } else {
                delete fieldErrors.status
            }
        } else if (field === 'zone') {
            const error = validateDriver({ ...data, zone: value }).zone
            if (error) {
                fieldErrors.zone = error
            } else {
                delete fieldErrors.zone
            }
        } else if (field === 'woreda') {
            const error = validateDriver({ ...data, woreda: value }).woreda
            if (error) {
                fieldErrors.woreda = error
            } else {
                delete fieldErrors.woreda
            }
        } else if (field === 'kebele') {
            const error = validateDriver({ ...data, kebele: value }).kebele
            if (error) {
                fieldErrors.kebele = error
            } else {
                delete fieldErrors.kebele
            }
        } else if (field === 'housenumber') {
            const error = validateDriver({ ...data, housenumber: value }).housenumber
            if (error) {
                fieldErrors.housenumber = error
            } else {
                delete fieldErrors.housenumber
            }
        }

        setFrontendErrors(fieldErrors)
    }

    useEffect(() => {
        const errorMessages = Object.entries(errors).map(([_, message]) => {
            if (typeof message === 'string') return message
            return String(message)
        })

        if (errorMessages.length > 0) {
            toast({
                title: '⚠️ Validation Error',
                description: errorMessages.join(', '),
                variant: 'destructive',
            })
        }
    }, [errors])

    useEffect(() => {
        const container = scrollContainerRef.current
        if (!container) {
            return
        }

        const handleScroll = () => {
            setShowScrollTop(container.scrollTop > 240)
        }

        handleScroll()
        container.addEventListener('scroll', handleScroll)

        return () => {
            container.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const handleScrollToTop = () => {
        const container = scrollContainerRef.current
        container?.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleFieldChange = (field: string, value: string) => {
        let nextValue = value

        if (field === 'driverid') {
            nextValue = value.toUpperCase().slice(0, 255)
        } else if (field === 'mobile') {
            nextValue = value.slice(0, 20)
        }

        setData(field as any, nextValue)
        validateField(field, nextValue)
        setIsDirty(true)
    }

    const submit: FormEventHandler = (event) => {
        event.preventDefault()

        const allErrors = validateDriver(data)
        if (Object.keys(allErrors).length > 0) {
            setFrontendErrors(allErrors)
            toast({
                title: '⚠️ Validation Error',
                description: 'Please fix the validation errors before submitting',
                variant: 'destructive',
            })
            return
        }

        put(`/drivers/${driver.id}`)
    }

    const getFieldError = (fieldName: string) => errors[fieldName as keyof typeof errors] || frontendErrors[fieldName] || ''

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Driver" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
                    <CardHeader className="px-6 pb-0">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="rounded-xl bg-blue-100 p-2 text-blue-600 shadow-sm dark:bg-blue-900/30 dark:text-blue-400">
                                    <UserIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                        Update Driver
                                    </CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                                        Modify identification, employment, and contact details for {driver.name}.
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/drivers">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Drivers
                                    </Link>
                                </Button>
                                {isDirty && (
                                    <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                        <Save className="h-3 w-3" />
                                        Unsaved Changes
                                    </div>
                                )}
                                <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
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
                        >
                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                        <Info className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">General Details</h2>
                                        <p className="text-sm text-muted-foreground">Core identification and status information for the driver.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="driverid" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                Driver ID <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="group relative">
                                                <HelpCircle className="h-4 w-4 cursor-help text-slate-400 hover:text-slate-600" />
                                                <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                                    Unique identifier for the driver
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                id="driverid"
                                                type="text"
                                                value={data.driverid}
                                                onChange={(event) => handleFieldChange('driverid', event.target.value)}
                                                placeholder="e.g., DRV001"
                                                maxLength={255}
                                                className={`pl-10 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${getFieldError('driverid') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                                            />
                                        </div>
                                        {getFieldError('driverid') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('driverid')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            <span className="text-red-500">*</span> Full Name
                                        </Label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                id="name"
                                                type="text"
                                                value={data.name}
                                                onChange={(event) => handleFieldChange('name', event.target.value)}
                                                placeholder="Enter full name"
                                                maxLength={255}
                                                className={`pl-10 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${getFieldError('name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
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
                                        <Label htmlFor="sex" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            <span className="text-red-500">*</span> Gender
                                        </Label>
                                        <Select value={data.sex} onValueChange={(value) => handleFieldChange('sex', value)}>
                                            <SelectTrigger className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('sex') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent className="z-50 bg-white shadow-lg dark:bg-slate-800">
                                                <SelectItem value="male" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                                    👨 Male
                                                </SelectItem>
                                                <SelectItem value="female" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                                    👩 Female
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('sex') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('sex')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            <span className="text-red-500">*</span> Status
                                        </Label>
                                        <Select value={data.status} onValueChange={(value) => handleFieldChange('status', value)}>
                                            <SelectTrigger className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('status') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent className="z-50 bg-white shadow-lg dark:bg-slate-800">
                                                <SelectItem value="active" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                                    Active
                                                </SelectItem>
                                                <SelectItem value="inactive" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                                    Inactive
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('status') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('status')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Personal Details</h2>
                                        <p className="text-sm text-muted-foreground">Capture birth and employment lifecycle information.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="birthdate" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Date of Birth
                                        </Label>
                                        <div className="group relative">
                                            <Input
                                                id="birthdate"
                                                type="date"
                                                value={data.birthdate}
                                                onChange={(event) => handleFieldChange('birthdate', event.target.value)}
                                                className={`pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${getFieldError('birthdate') ? 'border-red-500 focus:border-red-500' : ''}`}
                                            />
                                            <div
                                                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 cursor-pointer"
                                                onClick={() => {
                                                    const input = document.getElementById('birthdate') as HTMLInputElement | null
                                                    input?.showPicker?.()
                                                }}
                                            >
                                                <Calendar className="h-4 w-4 text-slate-500 transition-colors duration-200 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300" />
                                            </div>
                                        </div>
                                        {getFieldError('birthdate') && <p className="text-sm text-red-500">{getFieldError('birthdate')}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="hireddate" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Hire Date
                                        </Label>
                                        <div className="group relative">
                                            <Input
                                                id="hireddate"
                                                type="date"
                                                value={data.hireddate}
                                                onChange={(event) => handleFieldChange('hireddate', event.target.value)}
                                                className={`pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${getFieldError('hireddate') ? 'border-red-500 focus:border-red-500' : ''}`}
                                            />
                                            <div
                                                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 cursor-pointer"
                                                onClick={() => {
                                                    const input = document.getElementById('hireddate') as HTMLInputElement | null
                                                    input?.showPicker?.()
                                                }}
                                            >
                                                <Calendar className="h-4 w-4 text-slate-500 transition-colors duration-200 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300" />
                                            </div>
                                        </div>
                                        {getFieldError('hireddate') && <p className="text-sm text-red-500">{getFieldError('hireddate')}</p>}
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Contact & Address</h2>
                                        <p className="text-sm text-muted-foreground">Ensure we can reach the driver and locate their residence.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="mobile" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Mobile Number
                                        </Label>
                                        <Input
                                            id="mobile"
                                            type="tel"
                                            value={data.mobile}
                                            onChange={(event) => handleFieldChange('mobile', event.target.value)}
                                            placeholder="e.g., +251911123456"
                                            maxLength={20}
                                            className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${getFieldError('mobile') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                                        />
                                        {getFieldError('mobile') && <p className="text-sm text-red-500">{getFieldError('mobile')}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="zone">Zone</Label>
                                        <Input
                                            id="zone"
                                            type="text"
                                            value={data.zone}
                                            onChange={(event) => handleFieldChange('zone', event.target.value)}
                                            placeholder="Zone/District"
                                            maxLength={255}
                                            className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                        />
                                        {getFieldError('zone') && <p className="text-sm text-red-500">{getFieldError('zone')}</p>}
                                        <p className="text-xs text-muted-foreground">Optional - Administrative zone</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="woreda">Woreda</Label>
                                        <Input
                                            id="woreda"
                                            type="text"
                                            value={data.woreda}
                                            onChange={(event) => handleFieldChange('woreda', event.target.value)}
                                            placeholder="Woreda/Sub-district"
                                            maxLength={255}
                                            className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                        />
                                        {getFieldError('woreda') && <p className="text-sm text-red-500">{getFieldError('woreda')}</p>}
                                        <p className="text-xs text-muted-foreground">Optional - Sub-district</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="kebele">Kebele</Label>
                                        <Input
                                            id="kebele"
                                            type="text"
                                            value={data.kebele}
                                            onChange={(event) => handleFieldChange('kebele', event.target.value)}
                                            placeholder="Kebele/Neighborhood"
                                            maxLength={255}
                                            className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover-border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                        />
                                        {getFieldError('kebele') && <p className="text-sm text-red-500">{getFieldError('kebele')}</p>}
                                        <p className="text-xs text-muted-foreground">Optional - Neighborhood</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="housenumber">House Number</Label>
                                        <Input
                                            id="housenumber"
                                            type="text"
                                            value={data.housenumber}
                                            onChange={(event) => handleFieldChange('housenumber', event.target.value)}
                                            placeholder="House number"
                                            maxLength={255}
                                            className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover-border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                        />
                                        {getFieldError('housenumber') && <p className="text-sm text-red-500">{getFieldError('housenumber')}</p>}
                                        <p className="text-xs text-muted-foreground">Optional - House/building number</p>
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
                                        <Link href="/drivers">Cancel</Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || Object.keys(frontendErrors).length > 0}
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 min-w-[140px]"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Update Driver
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
    )
}
