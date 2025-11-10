import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';
import { validateDriver, type ValidationErrors } from '@/lib/validation';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, Info, User, MapPin, Calendar, CheckCircle, HelpCircle, Save, User as UserIcon, Hash } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Drivers',
        href: '/drivers',
    },
    {
        title: 'Create',
        href: '/drivers/create',
    },
];

export default function DriversCreate() {
    const { data, setData, post, processing, errors } = useForm({
        driverid: '',
        name: '',
        sex: '',
        birthdate: '',
        zone: '',
        woreda: '',
        kebele: '',
        housenumber: '',
        mobile: '',
        hireddate: '',
        status: 'active',
    });

    const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
    const [activeTab, setActiveTab] = useState('basic');
    const [isDirty, setIsDirty] = useState(false);

    // Real-time frontend validation - only validate the specific field
    const validateField = (field: string, value: string) => {
        const fieldErrors = { ...frontendErrors };

        // Only validate the specific field being changed
        if (field === 'driverid') {
            const error = validateDriver({ ...data, driverid: value }).driverid;
            if (error) {
                fieldErrors.driverid = error;
            } else {
                delete fieldErrors.driverid;
            }
        } else if (field === 'name') {
            const error = validateDriver({ ...data, name: value }).name;
            if (error) {
                fieldErrors.name = error;
            } else {
                delete fieldErrors.name;
            }
        } else if (field === 'sex') {
            const error = validateDriver({ ...data, sex: value }).sex;
            if (error) {
                fieldErrors.sex = error;
            } else {
                delete fieldErrors.sex;
            }
        } else if (field === 'mobile') {
            const error = validateDriver({ ...data, mobile: value }).mobile;
            if (error) {
                fieldErrors.mobile = error;
            } else {
                delete fieldErrors.mobile;
            }
        } else if (field === 'hireddate') {
            const error = validateDriver({ ...data, hireddate: value }).hireddate;
            if (error) {
                fieldErrors.hireddate = error;
            } else {
                delete fieldErrors.hireddate;
            }
        } else if (field === 'birthdate') {
            const error = validateDriver({ ...data, birthdate: value }).birthdate;
            if (error) {
                fieldErrors.birthdate = error;
            } else {
                delete fieldErrors.birthdate;
            }
        } else if (field === 'status') {
            const error = validateDriver({ ...data, status: value }).status;
            if (error) {
                fieldErrors.status = error;
            } else {
                delete fieldErrors.status;
            }
        }

        setFrontendErrors(fieldErrors);
    };

    // Show validation errors as toast
    useEffect(() => {
        const errorMessages = Object.entries(errors).map(([field, message]) => {
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

    const handleFieldChange = (field: string, value: string) => {
        setData(field as any, value);
        validateField(field, value);
        setIsDirty(true);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Check frontend validation
        const allErrors = validateDriver(data);
        if (Object.keys(allErrors).length > 0) {
            setFrontendErrors(allErrors);
            toast({
                title: '⚠️ Validation Error',
                description: 'Please fix the validation errors before submitting',
                variant: 'destructive',
            });
            return;
        }

        post('/drivers');
    };

    const hasErrors = Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0;
    const getFieldError = (fieldName: string) => errors[fieldName as keyof typeof errors] || frontendErrors[fieldName] || '';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Driver" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Enhanced Professional Header */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/20 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Create New Driver</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Add a new driver to your workforce with comprehensive details</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {isDirty && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-sm font-medium">
                                    <Save className="h-3 w-3" />
                                    Unsaved Changes
                                </div>
                            )}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                Workforce Management
                            </div>
                        </div>
                    </div>

                    {/* Progress Indicator */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                            <span>Form Progress</span>
                            <span>{activeTab === 'basic' ? '1/3' : activeTab === 'personal' ? '2/3' : '3/3'}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{width: activeTab === 'basic' ? '33%' : activeTab === 'personal' ? '66%' : '100%'}}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Professional Form */}
                <Card className="flex-1 shadow-xl border-0 bg-white dark:bg-slate-900/50 backdrop-blur-sm">
                    <CardHeader className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-950/20">
                        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            Driver Details
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Enter comprehensive information for the new driver
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={submit} className="space-y-4">
                            <Tabs defaultValue="basic" className="space-y-4" onValueChange={setActiveTab}>
                                <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <TabsTrigger value="basic" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200">
                                        <Info className="h-4 w-4" />
                                        <span className="font-medium">Basic Info</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="personal" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200">
                                        <User className="h-4 w-4" />
                                        <span className="font-medium">Personal</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="contact" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200">
                                        <MapPin className="h-4 w-4" />
                                        <span className="font-medium">Contact</span>
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="basic" className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="driverid" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Driver ID <span className="text-red-500">*</span></Label>
                                                <div className="group relative">
                                                    <HelpCircle className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help" />
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                                        Unique identifier for the driver
                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    id="driverid"
                                                    type="text"
                                                    value={data.driverid}
                                                    onChange={(e) => handleFieldChange('driverid', e.target.value.toUpperCase())}
                                                    placeholder="e.g., DRV001"
                                                    className={`pl-10 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${getFieldError('driverid') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                                                />
                                            </div>
                                            {getFieldError('driverid') && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
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
                                                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    id="name"
                                                    type="text"
                                                    value={data.name}
                                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                                    placeholder="Enter full name"
                                                    className={`pl-10 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${getFieldError('name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                                                />
                                            </div>
                                            {getFieldError('name') && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {getFieldError('name')}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="sex" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                <span className="text-red-500">*</span> Gender
                                            </Label>
                                            <Select
                                                value={data.sex}
                                                onValueChange={(value) => handleFieldChange('sex', value)}
                                            >
                                                <SelectTrigger className={`bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${getFieldError('sex') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                                    <SelectValue placeholder="Select gender" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg z-50">
                                                    <SelectItem value="male" className="hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700">👨 Male</SelectItem>
                                                    <SelectItem value="female" className="hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700">👩 Female</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {getFieldError('sex') && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {getFieldError('sex')}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                <span className="text-red-500">*</span> Status
                                            </Label>
                                            <Select
                                                value={data.status}
                                                onValueChange={(value) => handleFieldChange('status', value)}
                                            >
                                                <SelectTrigger className={`bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${getFieldError('status') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg z-50">
                                                    <SelectItem value="active" className="hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700">Active</SelectItem>
                                                    <SelectItem value="inactive" className="hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {getFieldError('status') && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {getFieldError('status')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="personal" className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="birthdate" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                Date of Birth
                                            </Label>
                                            <div className="relative group">
                                                <Input
                                                    id="birthdate"
                                                    type="date"
                                                    value={data.birthdate}
                                                    onChange={(e) => handleFieldChange('birthdate', e.target.value)}
                                                    className={`pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer ${getFieldError('birthdate') ? 'border-red-500 focus:border-red-500' : ''}`}
                                                />
                                                <div
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer z-20"
                                                    onClick={() => {
                                                        const input = document.getElementById('birthdate') as HTMLInputElement | null;
                                                        input?.showPicker?.();
                                                    }}
                                                >
                                                    <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-200" />
                                                </div>
                                            </div>
                                            {getFieldError('birthdate') && (
                                                <p className="text-sm text-red-500">{getFieldError('birthdate')}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="hireddate" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                <span className="text-red-500">*</span> Hire Date
                                            </Label>
                                            <div className="relative group">
                                                <Input
                                                    id="hireddate"
                                                    type="date"
                                                    value={data.hireddate}
                                                    onChange={(e) => handleFieldChange('hireddate', e.target.value)}
                                                    className={`pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer ${getFieldError('hireddate') ? 'border-red-500 focus:border-red-500' : ''}`}
                                                />
                                                <div
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer z-20"
                                                    onClick={() => {
                                                        const input = document.getElementById('hireddate') as HTMLInputElement | null;
                                                        input?.showPicker?.();
                                                    }}
                                                >
                                                    <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-200" />
                                                </div>
                                            </div>
                                            {getFieldError('hireddate') && (
                                                <p className="text-sm text-red-500">{getFieldError('hireddate')}</p>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="contact" className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="mobile" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                <span className="text-red-500">*</span> Mobile Number
                                            </Label>
                                            <Input
                                                id="mobile"
                                                type="tel"
                                                value={data.mobile}
                                                onChange={(e) => handleFieldChange('mobile', e.target.value)}
                                                placeholder="e.g., +251911123456"
                                                className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${getFieldError('mobile') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                                            />
                                            {getFieldError('mobile') && (
                                                <p className="text-sm text-red-500">{getFieldError('mobile')}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="zone">Zone</Label>
                                            <Input
                                                id="zone"
                                                type="text"
                                                value={data.zone}
                                                onChange={(e) => setData('zone', e.target.value)}
                                                placeholder="Zone/District"
                                                className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            />
                                            <p className="text-xs text-muted-foreground">Optional - Administrative zone</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="woreda">Woreda</Label>
                                            <Input
                                                id="woreda"
                                                type="text"
                                                value={data.woreda}
                                                onChange={(e) => setData('woreda', e.target.value)}
                                                placeholder="Woreda/Sub-district"
                                                className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            />
                                            <p className="text-xs text-muted-foreground">Optional - Sub-district</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="kebele">Kebele</Label>
                                            <Input
                                                id="kebele"
                                                type="text"
                                                value={data.kebele}
                                                onChange={(e) => setData('kebele', e.target.value)}
                                                placeholder="Kebele/Neighborhood"
                                                className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            />
                                            <p className="text-xs text-muted-foreground">Optional - Neighborhood</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="housenumber">House Number</Label>
                                            <Input
                                                id="housenumber"
                                                type="text"
                                                value={data.housenumber}
                                                onChange={(e) => setData('housenumber', e.target.value)}
                                                placeholder="House number"
                                                className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            />
                                            <p className="text-xs text-muted-foreground">Optional - House/building number</p>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-950/20 -mx-6 px-6 -mb-6 rounded-b-lg">
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
                                    <Button type="button" variant="outline" asChild className="hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600">
                                        <a href="/drivers">Cancel</a>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || Object.keys(frontendErrors).length > 0}
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 min-w-[140px]"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Create Driver
                                            </>
                                        )}
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
