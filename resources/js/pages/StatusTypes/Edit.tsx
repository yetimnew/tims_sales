import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { useState, useEffect } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { validateStatusType } from '@/lib/validation';
import { AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

interface StatusType {
  id: number;
  name: string;
  description: string;
}

interface StatusTypeEditProps {
  statusType: StatusType;
}

export default function StatusTypesEdit({ statusType }: StatusTypeEditProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Status Types', href: route('status-types.index') },
    { title: 'Edit', href: route('status-types.edit', statusType.id) },
  ];

  const { toast } = useToast();
  const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const { data, setData, put, processing, errors } = useForm<StatusType>({
    id: statusType.id,
    name: statusType.name,
    description: statusType.description || '',
  });

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      toast({ title: 'Validation Error', description: 'Please fix the errors', variant: 'destructive' });
    }
  }, [errors]);

  const handleFieldChange = (field: string, value: string) => {
    setData(field as keyof StatusType, value);
    setIsDirty(true);
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
      toast({ title: 'Validation Error', description: 'Please fix all errors', variant: 'destructive' });
      return;
    }
    put(route('status-types.update', statusType.id), {
      preserveScroll: true,
      onSuccess: () => {
        setFrontendErrors({});
        setIsDirty(false);
      },
    });
  };

  const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0;

  return (
    <FormPageLayout
      title="Edit Status Type"
      headTitle="Edit Status Type"
      description="Update status type details"
      breadcrumbs={breadcrumbs}
      icon={<FileText className="h-5 w-5" />}
      headerAside={isDirty && <UnsavedChangesBadge />}
    >
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24" noValidate>
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please fix all errors in the form below</AlertDescription>
          </Alert>
        )}

        <FormSection title="Status Type Details" description="Update the status type information" icon={<FileText className="h-4 w-4" />}>
          <FormField label="Name" required error={frontendErrors.name || errors.name}>
            <Input id="name" type="text" value={data.name} onChange={e => handleFieldChange('name', e.target.value)} placeholder="Enter status type name" />
          </FormField>

          <FormField label="Description" error={frontendErrors.description || errors.description}>
            <Textarea id="description" value={data.description} onChange={e => handleFieldChange('description', e.target.value)} placeholder="Enter status type description" rows={4} />
          </FormField>
        </FormSection>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href={route('status-types.index')}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={processing || hasErrors} onClick={handleSubmit}>
          {processing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              Updating...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Update Status Type
            </>
          )}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
