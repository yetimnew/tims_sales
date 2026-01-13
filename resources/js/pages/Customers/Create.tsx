import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { customerValidation, validateCustomer } from '@/lib/validation';
import { type BreadcrumbItem } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Building2, CheckCircle, Info, Mail, Phone, Save, UserCircle } from 'lucide-react';
import { type FormEventHandler, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function CustomersCreate() {
    const { t } = useTranslation();
    const breadcrumbs = useMemo<BreadcrumbItem[]>(
        () => [
            {
                title: t('customers.breadcrumb'),
                href: '/customers',
            },
            {
                title: t('customers.form.create.breadcrumb'),
                href: '/customers/create',
            },
        ],
        [t],
    );
    const { data, setData, post, processing, errors, clearErrors } = useForm<CustomerFormData>({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        status: 'active',
    });

    const [frontendErrors, setFrontendErrors] = useState<Partial<Record<CustomerFormField, string>>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const scrollContainerRef = useRef<HTMLFormElement | null>(null);

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

    useEffect(() => {
        const normalizedMessages = (Object.values(errors) as unknown[])
            .map((message) => {
                if (typeof message === 'string') {
                    return message;
                }

                if (Array.isArray(message)) {
                    return message.join(', ');
                }

                return String(message ?? '');
            })
            .filter((message) => Boolean(message));

        if (normalizedMessages.length > 0) {
            toast({
                title: t('customers.form.validation.title'),
                description: normalizedMessages.join(', '),
                variant: 'destructive',
            });
        }
    }, [errors, t]);

    const handleScrollToTop = () => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const validateField = (field: CustomerFormField, value: string) => {
        setFrontendErrors((prev) => {
            const next = { ...prev };
            let message = '';

            switch (field) {
                case 'name':
                    message = customerValidation.name(value);
                    break;
                case 'email':
                    message = value ? customerValidation.email(value) : '';
                    break;
                case 'phone':
                    message = value ? customerValidation.phone(value) : '';
                    break;
                case 'status':
                    if (!value) {
                        message = t('customers.form.validation.statusRequired');
                    } else if (!['active', 'inactive'].includes(value)) {
                        message = t('customers.form.validation.statusInvalid');
                    }
                    break;
                default:
                    message = '';
                    break;
            }

            if (message) {
                next[field] = message;
            } else {
                delete next[field];
            }

            return next;
        });
    };

    const handleFieldChange = (field: CustomerFormField, value: string) => {
        setData(field, value);
        clearErrors(field);
        validateField(field, value);
        setIsDirty(true);
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        const validationResult = validateCustomer(data);
        const nextErrors: Partial<Record<CustomerFormField, string>> = { ...validationResult };

        if (!data.status) {
            nextErrors.status = t('customers.form.validation.statusRequired');
        } else if (!['active', 'inactive'].includes(data.status)) {
            nextErrors.status = t('customers.form.validation.statusInvalid');
        }

        setFrontendErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            toast({
                title: t('customers.form.validation.title'),
                description: t('customers.form.validation.resolve'),
                variant: 'destructive',
            });
            return;
        }

        post('/customers', {
            preserveScroll: true,
            onSuccess: () => {
                setFrontendErrors({});
                setIsDirty(false);
                clearErrors();
                toast({
                    title: t('customers.form.create.successTitle'),
                    description: t('customers.form.create.successDescription'),
                });
            },
        });
    };

    const getFieldError = (field: CustomerFormField): string => {
        const backendError = errors[field];
        if (backendError) {
            return typeof backendError === 'string' ? backendError : String(backendError);
        }

        return frontendErrors[field] ?? '';
    };

    const nameError = useMemo(() => getFieldError('name'), [errors, frontendErrors, data.name]);
    const statusError = useMemo(() => getFieldError('status'), [errors, frontendErrors, data.status]);
    const addressError = useMemo(() => getFieldError('address'), [errors, frontendErrors, data.address]);
    const contactPersonError = useMemo(() => getFieldError('contact_person'), [errors, frontendErrors, data.contact_person]);
    const phoneError = useMemo(() => getFieldError('phone'), [errors, frontendErrors, data.phone]);
    const emailError = useMemo(() => getFieldError('email'), [errors, frontendErrors, data.email]);
    const hasErrors = Boolean(nameError || statusError || phoneError || emailError || contactPersonError || addressError);

    return (
        <FormPageLayout
            title={t('customers.form.create.title')}
            headTitle={t('customers.form.create.headTitle')}
            description={t('customers.form.create.description')}
            breadcrumbs={breadcrumbs}
            icon={<UserCircle className="h-5 w-5" />}
            headerAside={
                <>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/customers">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t('customers.form.create.backToList')}
                        </Link>
                    </Button>
                    {isDirty && <UnsavedChangesBadge />}
                    <div className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                        {t('customers.form.create.badge')}
                    </div>
                </>
            }
        >
            <form
                ref={scrollContainerRef}
                onSubmit={submit}
                className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24"
                style={{ minHeight: 0 }}
            >
                {hasErrors && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {t('customers.form.validation.resolveForm')}
                        </AlertDescription>
                    </Alert>
                )}
                <FormSection
                    title={t('customers.form.sections.profile.title')}
                    description={t('customers.form.sections.profile.description')}
                    icon={
                        <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <Info className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-2"
                >
                    <FormField
                        id="name"
                        label={t('customers.form.fields.name.label')}
                        required
                        tooltip={t('customers.form.fields.name.tooltip')}
                        error={nameError}
                    >
                        <div className="relative">
                            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(event) => handleFieldChange('name', event.target.value)}
                                placeholder={t('customers.form.fields.name.placeholder')}
                                className={`pl-9 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${nameError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:border-blue-500 focus:ring-blue-500/20 hover:border-slate-400 dark:hover:border-slate-500'}`}
                                autoComplete="off"
                            />
                        </div>
                    </FormField>

                    <FormField
                        id="status"
                        label={t('customers.form.fields.status.label')}
                        required
                        tooltip={t('customers.form.fields.status.tooltip')}
                        error={statusError}
                    >
                        <Select value={data.status} onValueChange={(value) => handleFieldChange('status', value)}>
                            <SelectTrigger
                                className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:border-blue-500 focus:ring-blue-500/20 ${statusError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                            >
                                <SelectValue placeholder={t('customers.form.fields.status.placeholder')} />
                            </SelectTrigger>
                            <SelectContent className="z-50 bg-white shadow-lg dark:bg-slate-800">
                                <SelectItem value="active" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                    {t('customers.status.active')}
                                </SelectItem>
                                <SelectItem value="inactive" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                    {t('customers.status.inactive')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField
                        id="address"
                        label={t('customers.form.fields.address.label')}
                        helperText={t('customers.form.fields.address.helper')}
                        error={addressError}
                        className="md:col-span-2"
                    >
                        <Textarea
                            id="address"
                            value={data.address}
                            onChange={(event) => handleFieldChange('address', event.target.value)}
                            placeholder={t('customers.form.fields.address.placeholder')}
                            rows={4}
                            className="min-h-[96px] resize-y transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                    </FormField>
                </FormSection>

                <FormSection
                    title={t('customers.form.sections.contacts.title')}
                    description={t('customers.form.sections.contacts.description')}
                    icon={
                        <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <Phone className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-2"
                >
                    <FormField
                        id="contact_person"
                        label={t('customers.form.fields.contactPerson.label')}
                        helperText={t('customers.form.fields.contactPerson.helper')}
                        error={contactPersonError}
                    >
                        <div className="relative">
                            <UserCircle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                id="contact_person"
                                value={data.contact_person}
                                onChange={(event) => handleFieldChange('contact_person', event.target.value)}
                                placeholder={t('customers.form.fields.contactPerson.placeholder')}
                                className="pl-9 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20 hover:border-slate-400 dark:hover:border-slate-500"
                            />
                        </div>
                    </FormField>

                    <FormField id="phone" label={t('customers.form.fields.phone.label')} helperText={t('customers.form.fields.phone.helper')} error={phoneError}>
                        <div className="relative">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                id="phone"
                                type="tel"
                                value={data.phone}
                                onChange={(event) => handleFieldChange('phone', event.target.value)}
                                placeholder={t('customers.form.fields.phone.placeholder')}
                                className={`pl-9 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${phoneError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:border-blue-500 focus:ring-blue-500/20 hover:border-slate-400 dark:hover:border-slate-500'}`}
                            />
                        </div>
                    </FormField>

                    <FormField id="email" label={t('customers.form.fields.email.label')} helperText={t('customers.form.fields.email.helper')} error={emailError}>
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(event) => handleFieldChange('email', event.target.value)}
                                placeholder={t('customers.form.fields.email.placeholder')}
                                className={`pl-9 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:border-blue-500 focus:ring-blue-500/20 hover:border-slate-400 dark:hover:border-slate-500'}`}
                                autoComplete="off"
                            />
                        </div>
                    </FormField>
                </FormSection>

                <FormActionsBar
                    left={
                        <>
                            <span className="flex items-center gap-2">
                                <span className="text-red-500">*</span>
                                {t('customers.form.requiredNote')}
                            </span>
                            {isDirty && (
                                <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <Save className="h-3 w-3" />
                                    {t('customers.form.unsavedNote')}
                                </span>
                            )}
                        </>
                    }
                    right={
                        <>
                            <Button type="button" variant="outline" asChild className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">
                                <Link href="/customers">{t('customers.actions.cancel')}</Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || hasErrors || !data.name.trim()}
                                className="min-w-[150px] bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
                            >
                                {processing ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                        {t('customers.form.create.submitting')}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        {t('customers.form.create.submit')}
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

type CustomerFormData = {
    name: string;
    contact_person: string;
    phone: string;
    email: string;
    address: string;
    status: string;
};

type CustomerFormField = keyof CustomerFormData;
