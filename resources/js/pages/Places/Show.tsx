import { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2, MapPin, Landmark, Compass, Navigation, Users, Mountain, ThermometerSun, Warehouse, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import type { BreadcrumbItem } from '@/types';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Woreda {
  id: number;
  name: string;
  zone: {
    id: number;
    name: string;
    region: {
      id: number;
      name: string;
    };
  };
}

interface Place {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  code?: string | null;
  woreda_id: number;
  woreda: Woreda;
  latitude?: number | string | null;
  longitude?: number | string | null;
  elevation_m?: number | string | null;
  population?: number | string | null;
  is_logistics_hub?: boolean | null;
  accessibility_score?: number | string | null;
  description?: string | null;
  infrastructure_notes?: string | null;
  road_quality_notes?: string | null;
  created_at: string;
  updated_at: string;
}

interface ActivityLog {
  id: number;
  description: string;
  created_at: string;
  event?: 'created' | 'updated' | 'deleted';
  causer?: { id: number; name: string } | null;
  properties?: {
    old?: Record<string, unknown>;
    attributes?: Record<string, unknown>;
  } | null;
}

interface PlacesShowProps {
  place: Place;
  activityLogs: ActivityLog[];
}

const getStatusBadgeStyles = (status: string) => (status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200');

const formatNumber = (value?: number | string | null, options?: Intl.NumberFormatOptions) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 'N/A';
  return numeric.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  });
};

const formatCoordinate = (value?: number | string | null) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 'N/A';
  return `${numeric.toFixed(5)}°`;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function PlacesShow({ place, activityLogs }: PlacesShowProps) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => [{ title: 'Places', href: '/places' }, { title: place.name || `Place ${place.id}`, href: `/places/${place.id}` }], [place.id, place.name]);

  const activityLogRows = useMemo(
    () =>
      activityLogs.map(log => ({
        id: log.id,
        action: log.event ?? 'updated',
        description: log.description,
        user: log.causer ? { name: log.causer.name } : undefined,
        created_at: log.created_at,
        old_values: log.properties?.old ?? undefined,
        new_values: log.properties?.attributes ?? undefined,
      })),
    [activityLogs],
  );

  const kpiSummary: DetailSummaryItem[] = [
    { label: 'Population', value: formatNumber(place.population), helper: 'Local residents' },
    { label: 'Accessibility', value: formatNumber(place.accessibility_score), helper: 'Logistics score (0-100)' },
    { label: 'Elevation', value: `${formatNumber(place.elevation_m)} m`, helper: 'Above sea level' },
    { label: 'Hub Status', value: place.is_logistics_hub ? 'Yes' : 'No', helper: 'Logistics hub designation' },
  ];

  const confirmDelete = () => {
    setIsDeleting(true);
    router.delete(`/places/${place.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast({ title: '✅ Place Deleted', description: `${place.name} was removed successfully.` });
        setDeleteDialogOpen(false);
        setIsDeleting(false);
      },
      onError: errors => {
        const errorMessage = errors && typeof errors === 'object' && 'message' in errors ? String(errors.message) : 'Unable to delete the place. Try again later.';
        toast({
          title: '❌ Delete Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        setIsDeleting(false);
      },
    });
  };

  return (
    <DetailPageLayout
      title={place.name}
      subtitle={place.description || 'Granular service delivery location and logistics waypoint.'}
      breadcrumbs={breadcrumbs}
      icon={<MapPin className="h-6 w-6 text-purple-700 dark:text-purple-300" />}
      iconWrapperClassName="bg-purple-100 dark:bg-purple-900/30"
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/places')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Places
        </Button>
      }
      actions={
        <>
          <div className="flex flex-wrap gap-2">
            <Badge className={getStatusBadgeStyles(place.status)}>{place.status.charAt(0).toUpperCase() + place.status.slice(1)}</Badge>
            {place.is_logistics_hub && (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                <Warehouse className="h-3.5 w-3.5 mr-1" />
                Logistics Hub
              </Badge>
            )}
            {place.woreda && (
              <Badge variant="outline">
                {place.woreda.zone.region.name} → {place.woreda.zone.name} → {place.woreda.name}
              </Badge>
            )}
          </div>
          {(hasPermission('places.edit') || hasPermission('places.destroy')) && (
            <div className="flex items-center gap-2">
              {hasPermission('places.edit') && (
                <Button variant="outline" asChild>
                  <Link href={`/places/${place.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              )}
              {hasPermission('places.destroy') && (
                <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </>
      }
    >
      <DetailSummaryGrid items={kpiSummary} />

      <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
        <div className="space-y-6">
          <DetailSectionCard title="Place Overview" description="Identifiers and geographic data" icon={<MapPin className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Place Code</p>
                <p className="mt-2 text-sm font-semibold">{place.code || 'N/A'}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Woreda</p>
                <p className="mt-2 text-sm font-semibold">{place.woreda.name}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Coordinates</p>
                <p className="mt-2 text-sm font-semibold">
                  {formatCoordinate(place.latitude)} / {formatCoordinate(place.longitude)}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Elevation</p>
                <p className="mt-2 text-sm font-semibold">{formatNumber(place.elevation_m)} m</p>
              </div>
            </div>
          </DetailSectionCard>

          {(place.infrastructure_notes || place.road_quality_notes) && (
            <DetailSectionCard title="Infrastructure Notes" description="Accessibility and road conditions" icon={<ThermometerSun className="h-5 w-5" />}>
              {place.infrastructure_notes && (
                <div className="rounded-lg border p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide">Infrastructure</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{place.infrastructure_notes}</p>
                </div>
              )}
              {place.road_quality_notes && (
                <div className="rounded-lg border p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide">Road Quality</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{place.road_quality_notes}</p>
                </div>
              )}
            </DetailSectionCard>
          )}

          {activityLogRows.length > 0 && (
            <DetailSectionCard title="Activity History" description="Auditable timeline" icon={<ShieldCheck className="h-5 w-5" />}>
              <ActivityLogTable logs={activityLogRows} />
            </DetailSectionCard>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Record Info</CardTitle>
              <CardDescription>System tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Created</span>
                <span>{formatDate(place.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Updated</span>
                <span>{formatDate(place.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Place" description="Are you sure you want to delete this place? This action cannot be undone." itemName={place.name} onConfirm={confirmDelete} isLoading={isDeleting} />
    </DetailPageLayout>
  );
}
