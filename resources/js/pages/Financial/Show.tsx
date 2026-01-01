import { Link, router } from '@inertiajs/react';
import { Edit, Trash2, ArrowLeft, BarChart3, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { useState } from 'react';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';

interface ActivityLog {
  id: number;
  action: 'created' | 'updated' | 'deleted';
  description: string;
  user?: { name: string };
  created_at: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
}

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
  net_profit: number;
  created_at?: string;
  updated_at?: string;
  truck?: { id: number; plate: string };
}

interface FinancialShowProps {
  financial: FinancialRecord;
  activityLogs?: ActivityLog[];
}

export default function FinancialShow({ financial, activityLogs = [] }: FinancialShowProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Financial', href: '/financial' },
    { title: financial.truck?.plate || `Record ${financial.id}`, href: `/financial/${financial.id}` },
  ];
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = () => {
    setIsDeleting(true);
    router.delete(`/financial/${financial.id}`, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
      },
      onError: () => {
        setIsDeleting(false);
      },
    });
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return `$${Number(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getPeriodBadgeColor = (type: string) => {
    switch (type) {
      case 'daily':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'weekly':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'monthly':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const totalCosts = financial.fuel_cost + financial.maintenance_cost + financial.driver_salary + financial.insurance_cost + financial.depreciation + financial.other_costs;
  const profitMargin = financial.revenue > 0 ? (financial.net_profit / financial.revenue) * 100 : 0;

  const kpiSummary: DetailSummaryItem[] = [
    { label: 'Revenue', value: formatCurrency(financial.revenue), helper: 'Total income', valueClassName: 'text-green-600 dark:text-green-400' },
    { label: 'Total Costs', value: formatCurrency(totalCosts), helper: 'All expenses', valueClassName: 'text-red-600 dark:text-red-400' },
    { label: 'Net Profit', value: formatCurrency(financial.net_profit), helper: 'After costs', valueClassName: financial.net_profit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400' },
    { label: 'Profit Margin', value: `${profitMargin.toFixed(2)}%`, helper: 'Revenue percentage' },
  ];

  return (
    <DetailPageLayout
      title={`Financial Record - ${financial.truck?.plate || 'Record'}`}
      subtitle={`Period: ${formatDate(financial.record_date)}`}
      breadcrumbs={breadcrumbs}
      headTitle={`Financial Record - ${financial.truck?.plate || 'Record'}`}
      icon={<BarChart3 className="h-6 w-6 text-green-700 dark:text-green-300" />}
      iconWrapperClassName="bg-green-100 dark:bg-green-900/30"
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/financial')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Financial
        </Button>
      }
      actions={
        <>
          <Badge className={getPeriodBadgeColor(financial.period_type)}>{financial.period_type.charAt(0).toUpperCase() + financial.period_type.slice(1)}</Badge>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/financial/${financial.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </>
      }
    >
      <DetailSummaryGrid items={kpiSummary} />

      <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        <DetailSectionCard title="Cost Breakdown" description="Detailed cost allocation" icon={<DollarSign className="h-5 w-5" />}>
          <div className="space-y-3">
            {[
              { label: 'Fuel Cost', value: financial.fuel_cost },
              { label: 'Maintenance Cost', value: financial.maintenance_cost },
              { label: 'Driver Salary', value: financial.driver_salary },
              { label: 'Insurance Cost', value: financial.insurance_cost },
              { label: 'Depreciation', value: financial.depreciation },
              { label: 'Other Costs', value: financial.other_costs },
            ].map((cost, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">{cost.label}</p>
                <p className="text-sm font-semibold">{formatCurrency(cost.value)}</p>
              </div>
            ))}
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Record Details" description="Truck and period information" icon={<BarChart3 className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Truck</p>
              <p className="mt-1 text-sm font-semibold">{financial.truck?.plate || 'N/A'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Record Date</p>
              <p className="mt-1 text-sm font-semibold">{formatDate(financial.record_date)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Period Type</p>
              <Badge className={`mt-1 ${getPeriodBadgeColor(financial.period_type)}`}>{financial.period_type.charAt(0).toUpperCase() + financial.period_type.slice(1)}</Badge>
            </div>
          </div>
        </DetailSectionCard>
      </div>

      {activityLogs.length > 0 && (
        <DetailSectionCard title="Activity History" description="Auditable timeline" icon={<BarChart3 className="h-5 w-5" />}>
          <ActivityLogTable logs={activityLogs} />
        </DetailSectionCard>
      )}

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Financial Record" description="Are you sure you want to delete this financial record?" onConfirm={handleDeleteConfirm} isLoading={isDeleting} />
    </DetailPageLayout>
  );
}
