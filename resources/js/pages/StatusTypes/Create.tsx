import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { useState, useEffect } from 'react';
import { useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { validateStatusType } from '@/lib/validation';
import { CircleAlert, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StatusTypeFormData {
  name: string;
  description: string;
}

export default function StatusTypesCreate() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({});
  const { data, setData, post, processing, errors } = useForm<StatusTypeFormData>({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      toast({
        title: t('statusTypes.validation.title'),
        description: t('statusTypes.validation.description'),
        variant: 'destructive',
      });
    }
  }, [errors, t, toast]);

  const handleFieldChange = (field: string, value: string) => {
    setData(field as keyof StatusTypeFormData, value);
    if (frontendErrors[field]) {
      const validationErrors = validateStatusType({ ...data, [field]: value });
      const error = validationErrors[field] || '';
      if (error) {
        setFrontendErrors(prev => ({ ...prev, [field]: error }));
      } else {
        setFrontendErrors(prev => {
          const updated = { ...prev };
          delete updated[field];
          return updated;
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateStatusType(data);
    if (Object.keys(validationErrors).length > 0) {
      setFrontendErrors(validationErrors);
      toast({
        title: t('statusTypes.validation.title'),
        description: t('statusTypes.validation.allDescription'),
        variant: 'destructive',
      });
      return;
    }
    post(route('status-types.store'));
  };

  const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0;

  return (
    <FormPageLayout
      title={t('statusTypes.create.title')}
      headTitle={t('statusTypes.create.headTitle')}
      description={t('statusTypes.create.description')}
      icon={<Tag className="h-5 w-5" />}
    >
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24">
        {hasErrors && (
          <Alert variant="destructive">
            <CircleAlert className="h-4 w-4" />
            <AlertDescription>{t('statusTypes.validation.formDescription')}</AlertDescription>
          </Alert>
        )}

        <FormSection title={t('statusTypes.form.sections.details.title')} description={t('statusTypes.form.sections.details.description')}>
          <div className="space-y-6">
            <FormField label={t('statusTypes.form.fields.name.label')} required error={frontendErrors.name || (errors.name as string)}>
              <Input
                id="name"
                type="text"
                value={data.name}
                onChange={e => handleFieldChange('name', e.target.value)}
                placeholder={t('statusTypes.form.fields.name.placeholder')}
              />
            </FormField>

            <FormField label={t('statusTypes.form.fields.description.label')} error={frontendErrors.description || (errors.description as string)}>
              <Textarea
                id="description"
                value={data.description}
                onChange={e => handleFieldChange('description', e.target.value)}
                placeholder={t('statusTypes.form.fields.description.placeholder')}
                rows={4}
              />
            </FormField>
          </div>
        </FormSection>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href={route('status-types.index')}>{t('statusTypes.actions.cancel')}</Link>
        </Button>
        <Button type="submit" disabled={processing || hasErrors} onClick={handleSubmit}>
          {t('statusTypes.create.submit')}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
