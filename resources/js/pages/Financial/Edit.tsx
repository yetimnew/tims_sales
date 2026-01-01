import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';
import { validateFinancial, type ValidationErrors } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, DollarSign, Truck } from 'lucide-react';

interface FinancialRecord {
  id: number;
  truck_id: number;
  record_date: string;
  period_type: string;
  revenue: number;
  fuel_cost: number;
  maintenance_cost: number;
  driver_salary: number;
  insurance_cost: number;
  depreciation: number;
  other_costs: number;
}

interface FinancialEditProps {
  financial: FinancialRecord;
  trucks: Array<{ id: number; plate: string }>;
}

export default function FinancialEdit({ financial, trucks }: FinancialEditProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Financial', href: '/financial' },
    { title: 'Edit', href: '#' },
  ];

  const { data, setData, put, processing, errors } = useForm({
    truck_id: financial.truck_id.toString(),
    record_date: financial.record_date,
    period_type: financial.period_type,
    revenue: financial.revenue.toString(),
    fuel_cost: financial.fuel_cost.toString(),
    maintenance_cost: financial.maintenance_cost.toString(),
    driver_salary: financial.driver_salary.toString(),
    insurance_cost: financial.insurance_cost.toString(),
    depreciation: financial.depreciation.toString(),
    other_costs: financial.other_costs.toString(),
  });

  const { toast } = useToast();
  const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix the errors below',
      });
    }
  }, [errors, toast]);

  const validateField = (fieldName: string, value: string) => {
    const validationData = {
      truck_id: data.truck_id,
      record_date: data.record_date,
      revenue: data.revenue,
      fuel_cost: data.fuel_cost,
      maintenance_cost: data.maintenance_cost,
      driver_salary: data.driver_salary,
      insurance_cost: data.insurance_cost,
      depreciation: data.depreciation,
      other_costs: data.other_costs,
      period_type: data.period_type,
      [fieldName]: value,
    };

    const allErrors = validateFinancial(validationData);
    const fieldError = allErrors[fieldName] || '';

    setFrontendErrors(prev => {
      const updated = { ...prev };
      if (fieldError) {
        updated[fieldName] = fieldError;
      } else {
        delete updated[fieldName];
      }
      return updated;
    });
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setData(fieldName as any, value);
    validateField(fieldName, value);
    setIsDirty(true);
  };

  const submit: FormEventHandler = e => {
    e.preventDefault();

    // Run full validation
    const allErrors = validateFinancial({
      truck_id: data.truck_id,
      record_date: data.record_date,
      revenue: data.revenue,
      fuel_cost: data.fuel_cost,
      maintenance_cost: data.maintenance_cost,
      driver_salary: data.driver_salary,
      insurance_cost: data.insurance_cost,
      depreciation: data.depreciation,
      other_costs: data.other_costs,
      period_type: data.period_type,
    });

    if (Object.keys(allErrors).length > 0) {
      setFrontendErrors(allErrors);
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix all errors before submitting',
      });
      return;
    }

    put(`/financial/${financial.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setFrontendErrors({});
        setIsDirty(false);
      },
    });
  };

  const hasErrors = Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0;
  const allErrors = { ...frontendErrors, ...errors };

  return (
    <FormPageLayout
      title="Edit Financial Record"
      headTitle="Edit Financial Record"
      description="Update the financial record information"
      breadcrumbs={breadcrumbs}
      icon={<DollarSign className="h-5 w-5" />}
      headerAside={isDirty && <UnsavedChangesBadge />}
    >
      <form onSubmit={submit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24" noValidate>
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please fix the errors below before submitting the form</AlertDescription>
          </Alert>
        )}

        <FormSection title="Basic Information" description="Select truck and record period" icon={<Truck className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Truck" required error={allErrors.truck_id}>
              <Select value={data.truck_id} onValueChange={value => handleFieldChange('truck_id', value)}>
                <SelectTrigger className={allErrors.truck_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select truck" />
                </SelectTrigger>
                <SelectContent>
                  {trucks.map(truck => (
                    <SelectItem key={truck.id} value={truck.id.toString()}>
                      {truck.plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Record Date" required error={allErrors.record_date}>
              <Input id="record_date" type="date" value={data.record_date} onChange={e => handleFieldChange('record_date', e.target.value)} />
            </FormField>

            <FormField label="Period Type" required error={allErrors.period_type}>
              <Select value={data.period_type} onValueChange={value => handleFieldChange('period_type', value)}>
                <SelectTrigger className={allErrors.period_type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Revenue" required error={allErrors.revenue}>
              <Input id="revenue" type="number" step="0.01" value={data.revenue} onChange={e => handleFieldChange('revenue', e.target.value)} placeholder="0.00" />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Costs Breakdown" description="Enter all cost components" icon={<DollarSign className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Fuel Cost" required error={allErrors.fuel_cost}>
              <Input id="fuel_cost" type="number" step="0.01" value={data.fuel_cost} onChange={e => handleFieldChange('fuel_cost', e.target.value)} placeholder="0.00" />
            </FormField>

            <FormField label="Maintenance Cost" required error={allErrors.maintenance_cost}>
              <Input id="maintenance_cost" type="number" step="0.01" value={data.maintenance_cost} onChange={e => handleFieldChange('maintenance_cost', e.target.value)} placeholder="0.00" />
            </FormField>

            <FormField label="Driver Salary" required error={allErrors.driver_salary}>
              <Input id="driver_salary" type="number" step="0.01" value={data.driver_salary} onChange={e => handleFieldChange('driver_salary', e.target.value)} placeholder="0.00" />
            </FormField>

            <FormField label="Insurance Cost" required error={allErrors.insurance_cost}>
              <Input id="insurance_cost" type="number" step="0.01" value={data.insurance_cost} onChange={e => handleFieldChange('insurance_cost', e.target.value)} placeholder="0.00" />
            </FormField>

            <FormField label="Depreciation" required error={allErrors.depreciation}>
              <Input id="depreciation" type="number" step="0.01" value={data.depreciation} onChange={e => handleFieldChange('depreciation', e.target.value)} placeholder="0.00" />
            </FormField>

            <FormField label="Other Costs" required error={allErrors.other_costs}>
              <Input id="other_costs" type="number" step="0.01" value={data.other_costs} onChange={e => handleFieldChange('other_costs', e.target.value)} placeholder="0.00" />
            </FormField>
          </div>
        </FormSection>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href="/financial">Cancel</Link>
        </Button>
        <Button type="submit" disabled={processing || hasErrors} onClick={submit}>
          {processing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              Updating...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Update Financial Record
            </>
          )}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
