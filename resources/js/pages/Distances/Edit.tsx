import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { Link, useForm } from '@inertiajs/react';
import { useMemo, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import type { BreadcrumbItem } from '@/types';
import { AlertCircle, CheckCircle, Map, MapPin } from 'lucide-react';

interface Place {
  id: number;
  name: string;
}

interface Distance {
  id: number;
  from_place_id: number;
  to_place_id: number;
  distance_km: number;
  estimated_time_hours: number;
  fromPlace?: { name: string };
  toPlace?: { name: string };
}

interface DistancesEditProps {
  distance: Distance;
  places: Place[];
}

export default function DistancesEdit({ distance, places }: DistancesEditProps) {
  const { toast } = useToast();
  const { data, setData, put, processing, errors } = useForm({
    from_place_id: distance.from_place_id.toString(),
    to_place_id: distance.to_place_id.toString(),
    distance_km: distance.distance_km.toString(),
    estimated_time_hours: distance.estimated_time_hours.toString(),
  });

  const [isDirty, setIsDirty] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const handleScroll = () => {
      setShowScrollTop(form.scrollTop > 300);
    };

    form.addEventListener('scroll', handleScroll);
    return () => form.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = () => {
    formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFieldChange = (field: string, value: string) => {
    setData(field as any, value);
    setIsDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/distances/${distance.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setIsDirty(false);
        toast({
          title: '✅ Distance Updated',
          description: 'Distance record has been saved successfully.',
        });
      },
      onError: () => {
        toast({
          title: '❌ Update Failed',
          description: 'Failed to update distance record.',
          variant: 'destructive',
        });
      },
    });
  };

  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: 'Distances', href: '/distances' },
      {
        title: `${distance.fromPlace?.name ?? 'Origin'} → ${distance.toPlace?.name ?? 'Destination'}`,
        href: `/distances/${distance.id}`,
      },
      { title: 'Edit', href: `/distances/${distance.id}/edit` },
    ],
    [distance.id, distance.fromPlace?.name, distance.toPlace?.name],
  );

  const distanceTitle = `${distance.fromPlace?.name ?? 'Origin'} → ${distance.toPlace?.name ?? 'Destination'}`;

  return (
    <FormPageLayout
      title="Edit Distance"
      headTitle={`Edit Distance: ${distanceTitle}`}
      description={`Update distance information between ${distance.fromPlace?.name} and ${distance.toPlace?.name}`}
      breadcrumbs={breadcrumbs}
      icon={<Map className="h-5 w-5" />}
      headerAside={isDirty && <UnsavedChangesBadge />}
    >
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24" noValidate>
        {Object.keys(errors).length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please correct the validation errors below before submitting.</AlertDescription>
          </Alert>
        )}

        <FormSection title="Distance Information" description="Define the route and travel parameters" icon={<MapPin className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField id="from_place_id" label="From Place" required error={errors.from_place_id}>
              <Select value={data.from_place_id} onValueChange={value => handleFieldChange('from_place_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select from place" />
                </SelectTrigger>
                <SelectContent>
                  {places.map(place => (
                    <SelectItem key={place.id} value={place.id.toString()}>
                      {place.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField id="to_place_id" label="To Place" required error={errors.to_place_id}>
              <Select value={data.to_place_id} onValueChange={value => handleFieldChange('to_place_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select to place" />
                </SelectTrigger>
                <SelectContent>
                  {places
                    .filter(place => place.id.toString() !== data.from_place_id)
                    .map(place => (
                      <SelectItem key={place.id} value={place.id.toString()}>
                        {place.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField id="distance_km" label="Distance (KM)" required error={errors.distance_km}>
              <Input id="distance_km" type="number" step="0.01" min="0" value={data.distance_km} onChange={e => handleFieldChange('distance_km', e.target.value)} placeholder="Enter distance in kilometers" />
            </FormField>

            <FormField id="estimated_time_hours" label="Estimated Time (Hours)" required error={errors.estimated_time_hours}>
              <Input
                id="estimated_time_hours"
                type="number"
                step="0.1"
                min="0"
                value={data.estimated_time_hours}
                onChange={e => handleFieldChange('estimated_time_hours', e.target.value)}
                placeholder="Enter estimated time in hours"
              />
            </FormField>
          </div>
        </FormSection>
      </form>

      <FormActionsBar
        left={
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
        }
        right={
          <Button type="submit" disabled={processing} onClick={handleSubmit}>
            {processing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Update Distance
              </>
            )}
          </Button>
        }
      />

      <ScrollToTopFab visible={showScrollTop} onClick={handleScrollToTop} />
    </FormPageLayout>
  );
}
