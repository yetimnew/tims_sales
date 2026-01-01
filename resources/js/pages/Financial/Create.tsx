import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
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
import { CircleAlert, DollarSign } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Financial', href: '/financial' },
  { title: 'Create', href: '/financial/create' },
];

interface FinancialCreateProps {
  trucks: Array<{ id: number; plate: string }>;
}

export default function FinancialCreate({ trucks }: FinancialCreateProps) {
  const { data, setData, post, processing, errors } = useForm({
    truck_id: '',
    record_date: '',
    period_type: '',
    revenue: '',
    fuel_cost: '',
    maintenance_cost: '',
    driver_salary: '',
    insurance_cost: '',
    depreciation: '',
    other_costs: '',
  });

  const { toast } = useToast();
  const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});

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

    post('/financial');
  };

  const hasErrors = Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0;
  const allErrors = { ...frontendErrors, ...errors };

  return (
    <FormPageLayout
      title="Record Financial Data"
      headTitle="Record Financial Data"
      description="Add a new financial record for truck analysis"
      breadcrumbs={breadcrumbs}
      icon={<DollarSign className="h-5 w-5" />}
    >
      <form onSubmit={submit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24">
        {hasErrors && (
          <Alert variant="destructive">
            <CircleAlert className="h-4 w-4" />
            <AlertDescription>Please fix the errors below before submitting the form</AlertDescription>
          </Alert>
        )}

        <FormSection title="Financial Record" description="Enter revenue and cost information">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField label="Truck" required error={allErrors.truck_id as string}>
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

              <FormField label="Record Date" required error={allErrors.record_date as string}>
                <Input
                  id="record_date"
                  type="date"
                  value={data.record_date}
                  onChange={e => handleFieldChange('record_date', e.target.value)}
                />
              </FormField>

              <FormField label="Period Type" required error={allErrors.period_type as string}>
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

              <FormField label="Revenue" required error={allErrors.revenue as string}>
                <Input
                  id="revenue"
                  type="number"
                  step="0.01"
                  value={data.revenue}
                  onChange={e => handleFieldChange('revenue', e.target.value)}
                  placeholder="0.00"
                />
              </FormField>
            </div>
          </div>
        </FormSection>

        <FormSection title="Costs Breakdown" description="Enter all cost components for this period">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Fuel Cost" required error={allErrors.fuel_cost as string}>
              <Input
                id="fuel_cost"
                type="number"
                step="0.01"
                value={data.fuel_cost}
                onChange={e => handleFieldChange('fuel_cost', e.target.value)}
                placeholder="0.00"
              />
            </FormField>

            <FormField label="Maintenance Cost" required error={allErrors.maintenance_cost as string}>
              <Input
                id="maintenance_cost"
                type="number"
                step="0.01"
                value={data.maintenance_cost}
                onChange={e => handleFieldChange('maintenance_cost', e.target.value)}
                placeholder="0.00"
              />
            </FormField>

            <FormField label="Driver Salary" required error={allErrors.driver_salary as string}>
              <Input
                id="driver_salary"
                type="number"
                step="0.01"
                value={data.driver_salary}
                onChange={e => handleFieldChange('driver_salary', e.target.value)}
                placeholder="0.00"
              />
            </FormField>

            <FormField label="Insurance Cost" required error={allErrors.insurance_cost as string}>
              <Input
                id="insurance_cost"
                type="number"
                step="0.01"
                value={data.insurance_cost}
                onChange={e => handleFieldChange('insurance_cost', e.target.value)}
                placeholder="0.00"
              />
            </FormField>

            <FormField label="Depreciation" required error={allErrors.depreciation as string}>
              <Input
                id="depreciation"
                type="number"
                step="0.01"
                value={data.depreciation}
                onChange={e => handleFieldChange('depreciation', e.target.value)}
                placeholder="0.00"
              />
            </FormField>

            <FormField label="Other Costs" required error={allErrors.other_costs as string}>
              <Input
                id="other_costs"
                type="number"
                step="0.01"
                value={data.other_costs}
                onChange={e => handleFieldChange('other_costs', e.target.value)}
                placeholder="0.00"
              />
            </FormField>
          </div>
        </FormSection>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href="/financial">Cancel</Link>
        </Button>
        <Button type="submit" disabled={processing || hasErrors} onClick={submit}>
          {processing ? 'Saving...' : 'Record Financial Data'}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
