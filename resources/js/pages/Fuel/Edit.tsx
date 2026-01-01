import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';
import { validateFuel, type ValidationErrors } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Droplet, FileText, Truck } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';

interface FuelRecord {
  id: number;
  truck_id: number;
  driver_id: number;
  driver_truck_id: number | null;
  fuel_date: string;
  fuel_quantity_liters: number;
  fuel_price_per_liter: number;
  fuel_type: string;
  fuel_station?: string;
  odometer_reading?: number;
  receipt_number?: string;
  notes?: string;
}

interface DriverTruckOption {
  id: number;
  truck_id: number | null;
  truck_plate: string | null;
  driver_id: number | null;
  driver_name: string | null;
  driver_code: string | null;
  assigned_on: string | null;
}

interface FuelEditProps {
  fuel: FuelRecord;
  assignments: DriverTruckOption[];
}

export default function FuelEdit({ fuel, assignments }: FuelEditProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Fuel', href: '/fuel' },
    { title: 'Edit', href: '#' },
  ];

  const { data, setData, put, processing, errors } = useForm({
    driver_truck_id: fuel.driver_truck_id ? fuel.driver_truck_id.toString() : '',
    truck_id: fuel.truck_id ? fuel.truck_id.toString() : '',
    driver_id: fuel.driver_id ? fuel.driver_id.toString() : '',
    fuel_date: fuel.fuel_date,
    fuel_quantity_liters: fuel.fuel_quantity_liters.toString(),
    fuel_price_per_liter: fuel.fuel_price_per_liter.toString(),
    fuel_type: fuel.fuel_type,
    fuel_station: fuel.fuel_station || '',
    odometer_reading: fuel.odometer_reading?.toString() || '',
    receipt_number: fuel.receipt_number || '',
    notes: fuel.notes || '',
  });

  const { toast } = useToast();
  const assignmentOptions = useMemo(() => (Array.isArray(assignments) ? assignments : []), [assignments]);
  const selectedAssignment = useMemo(() => {
    return assignmentOptions.find(option => option.id.toString() === data.driver_truck_id) || null;
  }, [assignmentOptions, data.driver_truck_id]);
  const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  const totalCost = useMemo(() => {
    const quantity = parseFloat(data.fuel_quantity_liters) || 0;
    const price = parseFloat(data.fuel_price_per_liter) || 0;
    return quantity * price;
  }, [data.fuel_quantity_liters, data.fuel_price_per_liter]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix the errors below',
      });
    }
  }, [errors, toast]);

  const validateField = (fieldName: keyof typeof data, value: string) => {
    const validationData = { ...data, [fieldName]: value };

    const allErrors = validateFuel(validationData);
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

  const handleFieldChange = (fieldName: keyof typeof data, value: string) => {
    setData(fieldName, value);
    validateField(fieldName, value);
    setIsDirty(true);
  };

  const submit: FormEventHandler = e => {
    e.preventDefault();

    // Run full validation
    const allErrors = validateFuel({ ...data });

    if (Object.keys(allErrors).length > 0) {
      setFrontendErrors(allErrors);
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix all errors before submitting',
      });
      return;
    }

    put(`/fuel/${fuel.id}`, {
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
      title="Edit Fuel Record"
      headTitle="Edit Fuel Record"
      description="Update the fuel consumption information"
      breadcrumbs={breadcrumbs}
      icon={<Droplet className="h-5 w-5" />}
      headerAside={isDirty && <UnsavedChangesBadge />}
    >
      <form onSubmit={submit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24" noValidate>
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please fix the errors below before submitting the form</AlertDescription>
          </Alert>
        )}

        <FormSection title="Assignment" description="Select the driver and truck for this fuel record" icon={<Truck className="h-4 w-4" />}>
          <FormField label="Driver & Truck Assignment" required error={allErrors.driver_truck_id}>
            <Select
              value={data.driver_truck_id}
              onValueChange={value => {
                handleFieldChange('driver_truck_id', value);
                const assignment = assignmentOptions.find(option => option.id.toString() === value);
                setData('truck_id', assignment?.truck_id ? assignment.truck_id.toString() : '');
                setData('driver_id', assignment?.driver_id ? assignment.driver_id.toString() : '');
              }}
            >
              <SelectTrigger className={allErrors.driver_truck_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select driver & truck" />
              </SelectTrigger>
              <SelectContent>
                {assignmentOptions.length > 0 ? (
                  assignmentOptions.map(assignment => (
                    <SelectItem key={assignment.id} value={assignment.id.toString()}>
                      {`${assignment.truck_plate ?? 'Unknown Truck'} — ${assignment.driver_name ?? 'Unknown Driver'}`}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    No active driver-truck assignments available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </FormField>

          {selectedAssignment && (
            <div className="mt-3 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/40 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Truck</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{selectedAssignment.truck_plate ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Driver</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{selectedAssignment.driver_name ?? '—'}</p>
                {selectedAssignment.driver_code && <p className="text-xs text-muted-foreground">ID: {selectedAssignment.driver_code}</p>}
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Assigned On</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">{selectedAssignment.assigned_on ?? '—'}</p>
              </div>
            </div>
          )}
        </FormSection>

        <FormSection title="Fuel Details" description="Enter the fuel consumption information" icon={<Droplet className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Fuel Date" required error={allErrors.fuel_date}>
              <DatePicker
                value={data.fuel_date || ''}
                onChange={next => handleFieldChange('fuel_date', next ?? '')}
                className={cn(
                  'w-full justify-start text-left h-11 border-slate-300 hover:border-slate-400 focus-visible:border-amber-500 focus-visible:ring-amber-500/20 dark:border-slate-600 dark:hover:border-slate-500',
                  allErrors.fuel_date ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20' : undefined,
                )}
              />
            </FormField>

            <FormField label="Fuel Type" required error={allErrors.fuel_type}>
              <Select value={data.fuel_type} onValueChange={value => handleFieldChange('fuel_type', value)}>
                <SelectTrigger className={allErrors.fuel_type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="gas">Gas</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Quantity (Liters)" required error={allErrors.fuel_quantity_liters}>
              <Input id="fuel_quantity_liters" type="number" step="0.01" value={data.fuel_quantity_liters} onChange={e => handleFieldChange('fuel_quantity_liters', e.target.value)} placeholder="0.00" />
            </FormField>

            <FormField label="Price per Liter" required error={allErrors.fuel_price_per_liter}>
              <Input id="fuel_price_per_liter" type="number" step="0.01" value={data.fuel_price_per_liter} onChange={e => handleFieldChange('fuel_price_per_liter', e.target.value)} placeholder="0.00" />
            </FormField>

            <FormField label="Fuel Station">
              <Input id="fuel_station" type="text" value={data.fuel_station} onChange={e => setData('fuel_station', e.target.value)} placeholder="e.g., Shell, Mobil" />
            </FormField>

            <FormField label="Odometer Reading">
              <Input id="odometer_reading" type="number" value={data.odometer_reading} onChange={e => setData('odometer_reading', e.target.value)} placeholder="0" />
            </FormField>

            <FormField label="Receipt Number">
              <Input id="receipt_number" type="text" value={data.receipt_number} onChange={e => setData('receipt_number', e.target.value)} placeholder="e.g., RCP-12345" />
            </FormField>

            <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="text-center">
                <p className="text-xs uppercase text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalCost.toFixed(2)} ETB</p>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title="Additional Information" description="Optional notes about this fuel record" icon={<FileText className="h-4 w-4" />}>
          <FormField label="Notes">
            <Textarea id="notes" value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Additional notes..." rows={3} />
          </FormField>
        </FormSection>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href="/fuel">Cancel</Link>
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
              Update Fuel Record
            </>
          )}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
