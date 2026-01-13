import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { useCallback, useEffect, useMemo, useState, type FormEventHandler } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateOutsource, type ValidationErrors } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Building2, CheckCircle, MapPin, Phone, UserCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Option = {
  label: string;
  value: string;
};

type OutsourceFormData = {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  service_type: string;
  status: string;
};

type OutsourcesCreateProps = {
  statusOptions?: Option[];
  serviceTypeOptions?: Option[];
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OutsourcesCreate({ statusOptions, serviceTypeOptions }: OutsourcesCreateProps) {
  const { t } = useTranslation();
  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: t('outsources.title'), href: '/outsources' },
      { title: t('outsources.form.create.breadcrumb'), href: '/outsources/create' },
    ],
    [t],
  );
  const resolvedStatusOptions = useMemo<Option[]>(
    () =>
      statusOptions?.length
        ? statusOptions
        : [
            { label: t('outsources.status.active'), value: 'active' },
            { label: t('outsources.status.inactive'), value: 'inactive' },
          ],
    [statusOptions, t],
  );

  const resolvedServiceTypes = useMemo<Option[]>(() => (serviceTypeOptions?.length ? serviceTypeOptions : []), [serviceTypeOptions]);

  const defaultStatus = resolvedStatusOptions[0]?.value ?? 'active';

  const { toast } = useToast();

  const { data, setData, post, processing, errors, reset, transform } = useForm<OutsourceFormData>({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    service_type: '',
    status: defaultStatus,
  });

  const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (Object.keys(errors).length === 0) {
      return;
    }

    const backendMessages = Object.values(errors)
      .flat()
      .map(message => (Array.isArray(message) ? message.join(', ') : String(message)));

    if (backendMessages.length > 0) {
      toast({
        variant: 'destructive',
        title: t('outsources.form.validation.backendTitle'),
        description: backendMessages.join('\n'),
      });
    }
  }, [errors, t, toast]);

  const setFieldError = useCallback((field: keyof OutsourceFormData | 'email' | 'status', message: string) => {
    setFrontendErrors(previous => {
      const next = { ...previous };
      if (message) {
        next[field] = message;
      } else {
        delete next[field];
      }

      return next;
    });
  }, []);

  const validateField = useCallback(
    (field: keyof OutsourceFormData, value: string) => {
      const nextValues: OutsourceFormData = { ...data, [field]: value } as OutsourceFormData;
      const fieldErrors = validateOutsource(nextValues);

      if (field === 'email' && value && !emailRegex.test(value)) {
        fieldErrors.email = t('outsources.form.errors.email');
      }

      if (field === 'status' && !value) {
        fieldErrors.status = t('outsources.form.errors.status');
      }

      if (field === 'service_type' && value.length > 255) {
        fieldErrors.service_type = t('outsources.form.errors.serviceTypeMax');
      }

      if (field === 'address' && value.length > 500) {
        fieldErrors.address = t('outsources.form.errors.addressMax');
      }

      setFieldError(field, fieldErrors[field] ?? '');
    },
    [data, setFieldError, t],
  );

  const handleFieldChange = useCallback(
    (field: keyof OutsourceFormData, value: string) => {
      setData(field, value);
      validateField(field, value);
      setIsDirty(true);
    },
    [setData, validateField],
  );

  const submit: FormEventHandler = event => {
    event.preventDefault();

    const trimmedData: OutsourceFormData = {
      ...data,
      name: data.name.trim(),
      contact_person: data.contact_person.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      address: data.address.trim(),
      service_type: data.service_type.trim(),
      status: data.status.trim(),
    };

    const validationResults: ValidationErrors = validateOutsource(trimmedData);

    if (trimmedData.email && !emailRegex.test(trimmedData.email)) {
      validationResults.email = t('outsources.form.errors.email');
    }

    if (!trimmedData.status) {
      validationResults.status = t('outsources.form.errors.status');
    }

    if (trimmedData.service_type && trimmedData.service_type.length > 255) {
      validationResults.service_type = t('outsources.form.errors.serviceTypeMax');
    }

    if (trimmedData.address && trimmedData.address.length > 500) {
      validationResults.address = t('outsources.form.errors.addressMax');
    }

    if (Object.keys(validationResults).length > 0) {
      setFrontendErrors(validationResults);
      toast({
        variant: 'destructive',
        title: t('outsources.form.validation.reviewCreate.title'),
        description: t('outsources.form.validation.reviewCreate.description'),
      });
      return;
    }

    transform(() => trimmedData);

    post('/outsources', {
      preserveScroll: true,
      onSuccess: () => {
        setFrontendErrors({});
        setIsDirty(false);
        reset();
        transform(data => data);
        toast({
          title: t('outsources.form.create.successTitle'),
          description: t('outsources.form.create.successDescription'),
        });
      },
      onError: () => {
        transform(data => data);
      },
      onFinish: () => {
        transform(data => data);
      },
    });
  };

  const getFieldError = useCallback(
    (field: keyof OutsourceFormData | 'email' | 'status') => {
      return errors[field] || frontendErrors[field] || '';
    },
    [errors, frontendErrors],
  );

  const generalError = errors.error ? String(errors.error) : '';

  return (
    <FormPageLayout
      title={t('outsources.form.create.title')}
      headTitle={t('outsources.form.create.headTitle')}
      description={t('outsources.form.create.description')}
      breadcrumbs={breadcrumbs}
      icon={<Building2 className="h-5 w-5" />}
      headerAside={isDirty && <UnsavedChangesBadge />}
    >
      <form onSubmit={submit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24" noValidate>
        {generalError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{generalError}</AlertDescription>
          </Alert>
        )}

        <FormSection
          title={t('outsources.form.sections.identity.title')}
          description={t('outsources.form.sections.identity.descriptionCreate')}
          icon={<UserCircle2 className="h-4 w-4" />}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField label={t('outsources.form.fields.name.label')} required error={getFieldError('name')}>
                <Input
                  id="name"
                  type="text"
                  value={data.name}
                  onChange={event => handleFieldChange('name', event.target.value)}
                  placeholder={t('outsources.form.fields.name.placeholder')}
                />
              </FormField>

              <FormField label={t('outsources.form.fields.status.label')} required error={getFieldError('status')}>
                <Select value={data.status} onValueChange={value => handleFieldChange('status', value)}>
                  <SelectTrigger className={getFieldError('status') ? 'border-red-500' : ''}>
                    <SelectValue placeholder={t('outsources.form.fields.status.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {resolvedStatusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="space-y-2">
              <FormField label={t('outsources.form.fields.serviceType.label')} error={getFieldError('service_type')}>
                <Input
                  id="service_type"
                  type="text"
                  value={data.service_type}
                  onChange={event => handleFieldChange('service_type', event.target.value)}
                  placeholder={t('outsources.form.fields.serviceType.placeholder')}
                />
              </FormField>
              {resolvedServiceTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {resolvedServiceTypes.map(option => (
                    <Badge
                      key={option.value}
                      variant={option.value === data.service_type ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleFieldChange('service_type', option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection
          title={t('outsources.form.sections.contact.title')}
          description={t('outsources.form.sections.contact.descriptionCreate')}
          icon={<Phone className="h-4 w-4" />}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField label={t('outsources.form.fields.contact.label')} required error={getFieldError('contact_person')}>
                <Input
                  id="contact_person"
                  type="text"
                  value={data.contact_person}
                  onChange={event => handleFieldChange('contact_person', event.target.value)}
                  placeholder={t('outsources.form.fields.contact.placeholder')}
                />
              </FormField>

              <FormField label={t('outsources.form.fields.phone.label')} error={getFieldError('phone')}>
                <Input
                  id="phone"
                  type="tel"
                  value={data.phone}
                  onChange={event => handleFieldChange('phone', event.target.value)}
                  placeholder={t('outsources.form.fields.phone.placeholder')}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField label={t('outsources.form.fields.email.label')} error={getFieldError('email')}>
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={event => handleFieldChange('email', event.target.value)}
                  placeholder={t('outsources.form.fields.email.placeholder')}
                />
              </FormField>

              <FormField label={t('outsources.form.fields.address.label')}>
                <Textarea
                  id="address"
                  value={data.address}
                  onChange={event => handleFieldChange('address', event.target.value)}
                  placeholder={t('outsources.form.fields.address.placeholder')}
                  className="min-h-[96px]"
                />
              </FormField>
            </div>
          </div>
        </FormSection>

        <FormSection
          title={t('outsources.form.sections.hints.title')}
          description={t('outsources.form.sections.hints.descriptionCreate')}
          icon={<MapPin className="h-4 w-4" />}
        >
          {resolvedServiceTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('outsources.form.hints.empty')}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('outsources.form.hints.suggestions', {
                suggestions: resolvedServiceTypes
                  .slice(0, 3)
                  .map(option => option.label)
                  .join(', '),
              })}
            </p>
          )}
        </FormSection>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href="/outsources">{t('outsources.actions.cancel')}</Link>
        </Button>
        <Button
          type="submit"
          disabled={processing || Object.keys(frontendErrors).length > 0 || Boolean(Object.keys(errors).length > 0)}
          onClick={submit}
        >
          {processing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              {t('outsources.actions.createProcessing')}
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              {t('outsources.actions.create')}
            </>
          )}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
