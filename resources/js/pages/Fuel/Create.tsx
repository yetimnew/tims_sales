import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { useMemo, useEffect, useState, type FormEventHandler } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { validateFuel, type ValidationErrors } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { Fuel, Truck, User, GaugeCircle, AlertCircle, Receipt, NotepadText, Calculator } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Fuel', href: '/fuel' },
  { title: 'Create', href: '/fuel/create' },
];

interface DriverTruckOption {
  id: number;
  truck_id: number | null;
  truck_plate: string | null;
  driver_id: number | null;
  driver_name: string | null;
  driver_code: string | null;
  assigned_on: string | null;
}

interface FuelCreateProps {
  assignments: DriverTruckOption[];
}

export default function FuelCreate({ assignments }: FuelCreateProps) {
  const { data, setData, post, processing, errors } = useForm({
    driver_truck_id: '',
    truck_id: '',
    driver_id: '',
    fuel_date: '',
    fuel_quantity_liters: '',
    fuel_price_per_liter: '',
    fuel_type: '',
    fuel_station: '',
    odometer_reading: '',
    receipt_number: '',
    notes: '',
  });
  const { toast } = useToast();
  const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  const mergedErrors = { ...frontendErrors, ...errors } as Record<string, string | string[]>;
  const assignmentOptions = useMemo(() => (Array.isArray(assignments) ? assignments : []), [assignments]);

  const selectedAssignment = useMemo(() => {
    return assignmentOptions.find(option => option.id.toString() === data.driver_truck_id) || null;
  }, [assignmentOptions, data.driver_truck_id]);

  const totalCost = useMemo(() => {
    const quantity = Number.parseFloat(data.fuel_quantity_liters || '0');
    const price = Number.parseFloat(data.fuel_price_per_liter || '0');
    if (Number.isNaN(quantity) || Number.isNaN(price)) {
      return null;
    }
    const result = quantity * price;
    return Number.isFinite(result) ? result : null;
  }, [data.fuel_quantity_liters, data.fuel_price_per_liter]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const message = Object.values(errors)
        .map(value => (Array.isArray(value) ? value.join(', ') : value))
        .filter(Boolean)
        .join(', ');
      toast({
        variant: 'destructive',
        title: 'Validation error',
        description: message || 'Please review the highlighted fields.',
      });
    }
  }, [errors, toast]);

  const validateField = (fieldName: string, value: string) => {
    const payload = { ...data, [fieldName]: value };
    const validationErrors = validateFuel(payload);
    const fieldError = validationErrors[fieldName] || '';

    setFrontendErrors(prev => {
      const next = { ...prev };
      if (fieldError) {
        next[fieldName] = fieldError;
      } else {
        delete next[fieldName];
      }
      return next;
    });
  };

  const handleFieldChange = (fieldName: keyof typeof data, value: string, shouldValidate = true) => {
    setData(fieldName, value);
    setIsDirty(true);

    if (shouldValidate) {
      validateField(fieldName, value);
    } else {
      setFrontendErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const submit: FormEventHandler = event => {
    event.preventDefault();

    const validationResult = validateFuel({ ...data });
    if (Object.keys(validationResult).length > 0) {
      setFrontendErrors(validationResult);
      toast({
        variant: 'destructive',
        title: 'Validation error',
        description: 'Please resolve the highlighted issues before saving.',
      });
      return;
    }

    post('/fuel');
  };

  const getFieldError = (fieldName: keyof typeof data) => {
    const value = mergedErrors[fieldName];
    if (!value) {
      return '';
    }
    return Array.isArray(value) ? value.join(', ') : value;
  };
  const hasErrors = Object.keys(mergedErrors).length > 0;

  return (
    <FormPageLayout
      title="Record Fuel Consumption"
      headTitle="Record Fuel"
      description="Capture fueling details for downstream cost analysis and efficiency reporting."
      breadcrumbs={breadcrumbs}
      icon={<Fuel className="h-5 w-5" />}
      headerAside={isDirty && <UnsavedChangesBadge />}
    >
      <form onSubmit={submit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24" noValidate>
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please resolve the highlighted fields before submitting the form.</AlertDescription>
          </Alert>
        )}

        <FormSection title="Fuel Transaction" description="Assign the fueling event to the correct assets and team." icon={<Receipt className="h-4 w-4" />}>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="driver_truck_id" className="text-sm font-semibold">
                Driver & Truck Assignment <span className="text-red-500">*</span>
              </Label>
              <Select
                value={data.driver_truck_id}
                onValueChange={value => {
                  handleFieldChange('driver_truck_id', value);
                  const assignment = assignmentOptions.find(option => option.id.toString() === value);
                  setData('truck_id', assignment?.truck_id ? assignment.truck_id.toString() : '');
                  setData('driver_id', assignment?.driver_id ? assignment.driver_id.toString() : '');
                }}
              >
                <SelectTrigger className={getFieldError('driver_truck_id') ? 'border-red-500' : ''}>
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
              {getFieldError('driver_truck_id') && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('driver_truck_id')}
                </p>
              )}
              {selectedAssignment && (
                <div className="mt-3 grid gap-3 rounded-lg border bg-muted/50 p-3 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Truck</p>
                    <p className="font-semibold">{selectedAssignment.truck_plate ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Driver</p>
                    <p className="font-semibold">{selectedAssignment.driver_name ?? '—'}</p>
                    {selectedAssignment.driver_code && <p className="text-xs text-muted-foreground">ID: {selectedAssignment.driver_code}</p>}
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Assigned On</p>
                    <p className="font-medium">{selectedAssignment.assigned_on ?? '—'}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField label="Fuel Type" required error={getFieldError('fuel_type')}>
                <Select value={data.fuel_type} onValueChange={value => handleFieldChange('fuel_type', value)}>
                  <SelectTrigger className={getFieldError('fuel_type') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="petrol">Petrol</SelectItem>
                    <SelectItem value="gas">Gas</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <div className="space-y-2">
                <Label htmlFor="fuel_station">Fuel Station</Label>
                <Input
                  id="fuel_station"
                  type="text"
                  value={data.fuel_station}
                  onChange={event => handleFieldChange('fuel_station', event.target.value, false)}
                  placeholder="e.g., National Oil"
                />
                <p className="text-xs text-muted-foreground">Optional: specify supplier for analytics.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt_number">Receipt Number</Label>
                <Input
                  id="receipt_number"
                  type="text"
                  value={data.receipt_number}
                  onChange={event => handleFieldChange('receipt_number', event.target.value, false)}
                  placeholder="e.g., RCP-12345"
                />
                <p className="text-xs text-muted-foreground">Optional supporting reference.</p>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Consumption Details"
          description="Track timing, volumes, and mileage to monitor efficiency."
          icon={<GaugeCircle className="h-4 w-4" />}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fuel_date">
                  Fuel Date <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  value={data.fuel_date || ''}
                  onChange={next => handleFieldChange('fuel_date', next ?? '')}
                  className={cn('w-full justify-start text-left h-11', getFieldError('fuel_date') ? 'border-red-500' : undefined)}
                />
                {getFieldError('fuel_date') && (
                  <p className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError('fuel_date')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="odometer_reading">Odometer Reading</Label>
                <Input
                  id="odometer_reading"
                  type="number"
                  inputMode="numeric"
                  value={data.odometer_reading}
                  onChange={event => handleFieldChange('odometer_reading', event.target.value, false)}
                  placeholder="e.g., 125000"
                />
                <p className="text-xs text-muted-foreground">Optional: captured at refuel time.</p>
              </div>

              <FormField label="Quantity (Liters)" required error={getFieldError('fuel_quantity_liters')}>
                <Input
                  id="fuel_quantity_liters"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={data.fuel_quantity_liters}
                  onChange={event => handleFieldChange('fuel_quantity_liters', event.target.value)}
                  placeholder="0.00"
                />
              </FormField>

              <FormField label="Price per Liter" required error={getFieldError('fuel_price_per_liter')}>
                <Input
                  id="fuel_price_per_liter"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={data.fuel_price_per_liter}
                  onChange={event => handleFieldChange('fuel_price_per_liter', event.target.value)}
                  placeholder="0.00"
                />
              </FormField>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-dashed border-amber-300/60 bg-amber-50/70 p-4 dark:border-amber-400/40 dark:bg-amber-500/10">
              <div className="flex items-center gap-3">
                <Calculator className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-200">Estimated Total Cost</p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-200/80">Auto-calculated from quantity × price.</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-base font-semibold">
                {totalCost !== null ? totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
              </Badge>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Operational Notes"
          description="Capture context such as route, conditions, or anomalies."
          icon={<NotepadText className="h-4 w-4" />}
        >
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={data.notes}
              onChange={event => handleFieldChange('notes', event.target.value, false)}
              placeholder="Add any operational context about this fueling event..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">Optional: helps maintenance and finance teams understand anomalies.</p>
          </div>
        </FormSection>
      </form>

      <FormActionsBar>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Truck className="h-3 w-3" />
          <span>Ensure truck assignments reflect current fleet status.</span>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/fuel">Cancel</Link>
          </Button>
          <Button type="submit" disabled={processing || hasErrors} onClick={submit}>
            {processing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                Saving...
              </>
            ) : (
              <>
                <User className="mr-2 h-4 w-4" />
                Record Fuel
              </>
            )}
          </Button>
        </div>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
