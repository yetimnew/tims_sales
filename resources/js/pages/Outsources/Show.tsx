import { useCallback, useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, BarChart3, Building2, CircleDot, Edit, Mail, MapPin, Phone, Trash2, UserRound, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';

interface OutsourceResource {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  service_type: string | null;
  status: string | null;
  outsource_performances_count: number | null;
  created_at: string | null;
  updated_at: string | null;
}

interface OutsourceMetrics {
  totalTrips: number;
  activeTrips: number;
  totalDistance: number;
  totalCost: number;
}

interface RecentPerformance {
  id: number;
  trip_number: string | null;
  dispatch_date: string | null;
  status: string | null;
  distance_km: number | null;
  cargo_volume_mt: number | null;
  cost: number | null;
  from_place: string | null;
  to_place: string | null;
}

interface OutsourcesShowProps {
  outsource: OutsourceResource;
  metrics: OutsourceMetrics;
  recentPerformances: RecentPerformance[];
}

const getStatusBadgeClasses = (status: string | null | undefined) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'inactive':
      return 'bg-slate-200 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
};

const getTripStatusClasses = (status: string | null | undefined) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
    case 'active':
    case 'in-progress':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    case 'cancelled':
    case 'cancelled_by_vendor':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
    default:
      return 'bg-slate-200 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300';
  }
};

export default function OutsourcesShow({ outsource, metrics, recentPerformances }: OutsourcesShowProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || undefined;
  const notAvailableLabel = t('outsources.show.fallbacks.notAvailable');
  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: t('outsources.title'), href: '/outsources' },
      {
        title: outsource.name || t('outsources.form.edit.fallbackName', { id: outsource.id }),
        href: `/outsources/${outsource.id}`,
      },
    ],
    [outsource.id, outsource.name, t],
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { hasPermission } = usePermissions();

  const formatCurrency = useCallback(
    (value: number | null | undefined) => {
      if (value === null || value === undefined || Number.isNaN(value)) {
        return notAvailableLabel;
      }

      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 2,
        }).format(value);
      } catch {
        return value.toString();
      }
    },
    [locale, notAvailableLabel],
  );

  const formatDistance = useCallback(
    (value: number | null | undefined) => {
      if (value === null || value === undefined || Number.isNaN(value)) {
        return notAvailableLabel;
      }

      return t('outsources.show.metrics.distance', {
        value: Number(value).toLocaleString(locale, { maximumFractionDigits: 1 }),
      });
    },
    [locale, notAvailableLabel, t],
  );

  const formatVolume = useCallback(
    (value: number | null | undefined) => {
      if (value === null || value === undefined || Number.isNaN(value)) {
        return notAvailableLabel;
      }

      return t('outsources.show.metrics.volume', {
        value: Number(value).toLocaleString(locale, { maximumFractionDigits: 1 }),
      });
    },
    [locale, notAvailableLabel, t],
  );

  const formatCount = useCallback(
    (value: number | null | undefined) => {
      if (value === null || value === undefined || Number.isNaN(value)) {
        return notAvailableLabel;
      }

      return Number(value).toLocaleString(locale);
    },
    [locale, notAvailableLabel],
  );

  const formatDate = useCallback(
    (value: string | null | undefined) => {
      if (!value) {
        return notAvailableLabel;
      }

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return notAvailableLabel;
      }

      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    },
    [locale, notAvailableLabel],
  );

  const formatStatus = useCallback(
    (status: string | null | undefined) => {
      if (!status) {
        return t('outsources.status.unknown');
      }

      const normalized = status.toLowerCase();
      const translations: Record<string, string> = {
        active: t('outsources.status.active'),
        inactive: t('outsources.status.inactive'),
        completed: t('outsources.tripStatus.completed'),
        'in-progress': t('outsources.tripStatus.inProgress'),
        cancelled: t('outsources.tripStatus.cancelled'),
        cancelled_by_vendor: t('outsources.tripStatus.cancelledByVendor'),
      };

      if (translations[normalized]) {
        return translations[normalized];
      }

      return status
        .replace(/_/g, ' ')
        .toLowerCase()
        .split(' ')
        .map(chunk => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(' ');
    },
    [t],
  );

  const kpiSummary: DetailSummaryItem[] = [
    {
      label: t('outsources.show.stats.totalTrips.label'),
      value: formatCount(metrics.totalTrips),
      helper: t('outsources.show.stats.totalTrips.helper'),
    },
    {
      label: t('outsources.show.stats.activeTrips.label'),
      value: formatCount(metrics.activeTrips),
      helper: t('outsources.show.stats.activeTrips.helper'),
    },
    {
      label: t('outsources.show.stats.distanceCovered.label'),
      value: formatDistance(metrics.totalDistance),
      helper: t('outsources.show.stats.distanceCovered.helper'),
    },
    {
      label: t('outsources.show.stats.totalSpend.label'),
      value: formatCurrency(metrics.totalCost),
      helper: t('outsources.show.stats.totalSpend.helper'),
    },
  ];

  const canUpdate = hasPermission('outsources.update');
  const canDelete = hasPermission('outsources.destroy');

  const handleDeleteConfirm = () => {
    setIsDeleting(true);
    router.delete(`/outsources/${outsource.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
        toast({
          title: t('outsources.delete.successTitle'),
          description: t('outsources.delete.successDescription', { name: outsource.name }),
        });
      },
      onError: errors => {
        setIsDeleting(false);
        const fallback = t('outsources.delete.failedDescription');
        const errorMessage = errors && typeof errors === 'object' && 'message' in errors ? String(errors.message) : fallback;
        toast({
          title: t('outsources.delete.failedTitle'),
          description: errorMessage,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <DetailPageLayout
      title={outsource.name}
      subtitle={t('outsources.show.subtitle')}
      breadcrumbs={breadcrumbs}
      headTitle={t('outsources.show.headTitle', { name: outsource.name })}
      icon={<Building2 className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />}
      iconWrapperClassName="bg-emerald-100 dark:bg-emerald-900/30"
      leading={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/outsources">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('outsources.actions.back')}
          </Link>
        </Button>
      }
      actions={
        <>
          <Badge className={`${getStatusBadgeClasses(outsource.status)} capitalize`}>{formatStatus(outsource.status)}</Badge>
          {outsource.service_type && (
            <Badge variant="outline" className="border-emerald-400/50 bg-emerald-400/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-300">
              {outsource.service_type}
            </Badge>
          )}
          <Badge variant="outline">{t('outsources.show.badges.trips', { count: formatCount(outsource.outsource_performances_count) })}</Badge>
          <div className="flex gap-2">
            {canUpdate && (
              <Button variant="outline" asChild>
                <Link href={`/outsources/${outsource.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('outsources.actions.edit')}
                </Link>
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                {t('outsources.actions.delete')}
              </Button>
            )}
          </div>
        </>
      }
    >
      <DetailSummaryGrid items={kpiSummary} />

      <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
        <DetailSectionCard
          title={t('outsources.show.recent.title')}
          description={t('outsources.show.recent.description')}
          icon={<BarChart3 className="h-5 w-5" />}
        >
          {recentPerformances.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center">
              <CircleDot className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-base font-medium">{t('outsources.show.recent.emptyTitle')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('outsources.show.recent.emptyDescription')}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs uppercase">
                    <TableHead>{t('outsources.show.table.trip')}</TableHead>
                    <TableHead>{t('outsources.show.table.route')}</TableHead>
                    <TableHead>{t('outsources.show.table.dispatchDate')}</TableHead>
                    <TableHead className="text-right">{t('outsources.show.table.distance')}</TableHead>
                    <TableHead className="text-right">{t('outsources.show.table.cargo')}</TableHead>
                    <TableHead className="text-right">{t('outsources.show.table.cost')}</TableHead>
                    <TableHead className="text-right">{t('outsources.show.table.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPerformances.map(performance => (
                    <TableRow key={performance.id}>
                      <TableCell className="font-medium">{performance.trip_number ?? notAvailableLabel}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="font-medium">
                            {performance.from_place ?? notAvailableLabel}
                            <span className="mx-1 text-muted-foreground">→</span>
                            {performance.to_place ?? notAvailableLabel}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(performance.dispatch_date)}</TableCell>
                      <TableCell className="text-right">{formatDistance(performance.distance_km)}</TableCell>
                      <TableCell className="text-right">{formatVolume(performance.cargo_volume_mt)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(performance.cost)}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={`${getTripStatusClasses(performance.status)} capitalize`}>{formatStatus(performance.status)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DetailSectionCard>

        <div className="space-y-6">
          <DetailSectionCard
            title={t('outsources.show.contact.title')}
            description={t('outsources.show.contact.description')}
            icon={<UserRound className="h-4 w-4" />}
          >
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-xs uppercase text-muted-foreground">{t('outsources.show.contact.primaryLabel')}</p>
                <p className="mt-2 text-base font-semibold">{outsource.contact_person ?? notAvailableLabel}</p>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{t('outsources.show.contact.phoneLabel')}</p>
                  <p className="text-sm">{outsource.phone ?? t('outsources.show.contact.phoneFallback')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{t('outsources.show.contact.emailLabel')}</p>
                  <p className="break-all text-sm">{outsource.email ?? t('outsources.show.contact.emailFallback')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{t('outsources.show.contact.addressLabel')}</p>
                  <p className="text-sm">{outsource.address ?? t('outsources.show.contact.addressFallback')}</p>
                </div>
              </div>
            </div>
          </DetailSectionCard>

          <DetailSectionCard
            title={t('outsources.show.timeline.title')}
            description={t('outsources.show.timeline.description')}
            icon={<Activity className="h-4 w-4" />}
          >
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('outsources.show.timeline.created')}</span>
                <span className="font-semibold">{formatDate(outsource.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('outsources.show.timeline.updated')}</span>
                <span className="font-semibold">{formatDate(outsource.updated_at)}</span>
              </div>
            </div>
          </DetailSectionCard>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('outsources.delete.title')}
        description={t('outsources.delete.detailDescription')}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </DetailPageLayout>
  );
}
