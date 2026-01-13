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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
          title: t('distances.form.edit.successTitle'),
          description: t('distances.form.edit.successDescription'),
        });
      },
      onError: () => {
        toast({
          title: t('distances.form.edit.failedTitle'),
          description: t('distances.form.edit.failedDescription'),
          variant: 'destructive',
        });
      },
    });
  };

  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: t('distances.title'), href: '/distances' },
      {
        title: `${distance.fromPlace?.name ?? t('distances.fallbacks.origin')} → ${distance.toPlace?.name ?? t('distances.fallbacks.destination')}`,
        href: `/distances/${distance.id}`,
      },
      { title: t('distances.form.edit.breadcrumb'), href: `/distances/${distance.id}/edit` },
    ],
    [distance.id, distance.fromPlace?.name, distance.toPlace?.name, t],
  );

  const distanceTitle = `${distance.fromPlace?.name ?? t('distances.fallbacks.origin')} → ${distance.toPlace?.name ?? t('distances.fallbacks.destination')}`;

  return (
    <FormPageLayout
      title={t('distances.form.edit.title')}
      headTitle={t('distances.form.edit.headTitle', { route: distanceTitle })}
      description={t('distances.form.edit.description', {
        from: distance.fromPlace?.name ?? t('distances.fallbacks.origin'),
        to: distance.toPlace?.name ?? t('distances.fallbacks.destination'),
      })}
      breadcrumbs={breadcrumbs}
      icon={<Map className="h-5 w-5" />}
      headerAside={isDirty && <UnsavedChangesBadge />}
    >
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24" noValidate>
        {Object.keys(errors).length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t('distances.form.validation.resolveEdit')}</AlertDescription>
          </Alert>
        )}

        <FormSection
          title={t('distances.form.edit.section.title')}
          description={t('distances.form.edit.section.description')}
          icon={<MapPin className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField id="from_place_id" label={t('distances.form.fields.fromPlace.label')} required error={errors.from_place_id}>
              <Select value={data.from_place_id} onValueChange={value => handleFieldChange('from_place_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('distances.form.fields.fromPlace.placeholder')} />
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

            <FormField id="to_place_id" label={t('distances.form.fields.toPlace.label')} required error={errors.to_place_id}>
              <Select value={data.to_place_id} onValueChange={value => handleFieldChange('to_place_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('distances.form.fields.toPlace.placeholder')} />
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

            <FormField id="distance_km" label={t('distances.form.fields.distance.label')} required error={errors.distance_km}>
              <Input
                id="distance_km"
                type="number"
                step="0.01"
                min="0"
                value={data.distance_km}
                onChange={e => handleFieldChange('distance_km', e.target.value)}
                placeholder={t('distances.form.edit.fields.distancePlaceholder')}
              />
            </FormField>

            <FormField id="estimated_time_hours" label={t('distances.form.fields.time.label')} required error={errors.estimated_time_hours}>
              <Input
                id="estimated_time_hours"
                type="number"
                step="0.1"
                min="0"
                value={data.estimated_time_hours}
                onChange={e => handleFieldChange('estimated_time_hours', e.target.value)}
                placeholder={t('distances.form.edit.fields.timePlaceholder')}
              />
            </FormField>
          </div>
        </FormSection>
      </form>

      <FormActionsBar
        left={
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            {t('distances.actions.cancel')}
          </Button>
        }
        right={
          <Button type="submit" disabled={processing} onClick={handleSubmit}>
            {processing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                {t('distances.form.actions.updating')}
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('distances.form.actions.update')}
              </>
            )}
          </Button>
        }
      />

      <ScrollToTopFab visible={showScrollTop} onClick={handleScrollToTop} />
    </FormPageLayout>
  );
}
