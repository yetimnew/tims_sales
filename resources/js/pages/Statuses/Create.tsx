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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { validateStatus } from '@/lib/validation';
import { CircleAlert, Tag } from 'lucide-react';

interface StatusType {
  id: number;
  name: string;
}

interface StatusFormData {
  name: string;
  status_type_id: string;
  description: string;
}

interface StatusCreateProps {
  statusTypes: StatusType[];
}

export default function StatusesCreate({ statusTypes }: StatusCreateProps) {
  const { toast } = useToast();
  const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({});
  const { data, setData, post, processing, errors } = useForm<StatusFormData>({
    name: '',
    status_type_id: '',
    description: '',
  });

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      toast({ title: 'Validation Error', description: 'Please fix the errors', variant: 'destructive' });
    }
  }, [errors, toast]);

  const handleFieldChange = (field: string, value: string) => {
    setData(field as keyof StatusFormData, value);
    if (frontendErrors[field]) {
      const validationErrors = validateStatus({ ...data, [field]: value });
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
    const validationErrors = validateStatus(data);
    if (Object.keys(validationErrors).length > 0) {
      setFrontendErrors(validationErrors);
      toast({ title: 'Validation Error', description: 'Please fix all errors', variant: 'destructive' });
      return;
    }
    post('/statuses');
  };

  const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0;

  return (
    <FormPageLayout
      title="Create Status"
      headTitle="Create Status"
      description="Define a new status with its type and description."
      icon={<Tag className="h-5 w-5" />}
    >
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24">
        {hasErrors && (
          <Alert variant="destructive">
            <CircleAlert className="h-4 w-4" />
            <AlertDescription>Please fix all errors in the form below</AlertDescription>
          </Alert>
        )}

        <FormSection title="Status Details" description="Provide a name, type, and optional description for the status.">
          <div className="space-y-6">
            <FormField label="Name" required error={frontendErrors.name || (errors.name as string)}>
              <Input
                id="name"
                type="text"
                value={data.name}
                onChange={e => handleFieldChange('name', e.target.value)}
                placeholder="Enter status name"
              />
            </FormField>

            <FormField label="Status Type" required error={frontendErrors.status_type_id || (errors.status_type_id as string)}>
              <Select value={data.status_type_id} onValueChange={value => handleFieldChange('status_type_id', value)}>
                <SelectTrigger id="status_type_id" className={frontendErrors.status_type_id || errors.status_type_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a status type" />
                </SelectTrigger>
                <SelectContent>
                  {statusTypes.map(statusType => (
                    <SelectItem key={statusType.id} value={statusType.id.toString()}>
                      {statusType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Description" error={frontendErrors.description || (errors.description as string)}>
              <Textarea
                id="description"
                value={data.description}
                onChange={e => handleFieldChange('description', e.target.value)}
                placeholder="Enter status description"
                rows={4}
              />
            </FormField>
          </div>
        </FormSection>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href="/statuses">Cancel</Link>
        </Button>
        <Button type="submit" disabled={processing || hasErrors} onClick={handleSubmit}>
          Create Status
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
