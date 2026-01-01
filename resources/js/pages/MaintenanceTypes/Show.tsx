import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Settings, Edit, Trash2, History, BarChart3, Wrench, ArrowLeft, Activity } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { toast } from '@/hooks/use-toast';
import { BreadcrumbItem } from '@/types';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MaintenanceType {
  id: number;
  name: string;
  category: string;
  interval_km: number | null;
  interval_months: number | null;
  estimated_cost: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MaintenanceTypesShowProps {
  maintenanceType: MaintenanceType;
  activityLogs?: any[];
}

export default function MaintenanceTypesShow({ maintenanceType, activityLogs = [] }: MaintenanceTypesShowProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Maintenance Types', href: '/maintenance-types' },
    { title: maintenanceType?.name || 'Maintenance Type', href: `/maintenance-types/${maintenanceType?.id}` },
  ];
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = () => {
    setIsDeleting(true);
    router.delete(`/maintenance-types/${maintenanceType.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
        toast({
          title: '✅ Maintenance Type Deleted',
          description: `${maintenanceType.name} has been removed successfully.`,
        });
      },
      onError: errors => {
        setIsDeleting(false);
        if (errors && typeof errors === 'object') {
          const errorMessages = Object.values(errors).flat().join('\n');
          toast({
            title: '❌ Delete Failed',
            description: errorMessages || 'Unable to delete this maintenance type. Please try again.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: '❌ Delete Failed',
            description: 'An unexpected error occurred while deleting the maintenance type. Please try again.',
            variant: 'destructive',
          });
        }
      },
    });
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category.toLowerCase()) {
      case 'preventive':
        return 'default';
      case 'corrective':
        return 'secondary';
      case 'emergency':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (!maintenanceType) {
    return <div>Loading...</div>;
  }

  return (
    <DetailPageLayout
      title={maintenanceType.name}
      subtitle="Maintenance type details and activity history"
      breadcrumbs={breadcrumbs}
      headTitle={maintenanceType.name}
      icon={<Settings className="h-6 w-6 text-blue-700 dark:text-blue-300" />}
      iconWrapperClassName="bg-blue-100 dark:bg-blue-900/30"
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/maintenance-types')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      }
      actions={
        <>
          <Badge variant={getCategoryBadgeVariant(maintenanceType.category)}>{maintenanceType.category}</Badge>
          <Badge variant={maintenanceType.is_active ? 'default' : 'secondary'}>{maintenanceType.is_active ? 'Active' : 'Inactive'}</Badge>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/maintenance-types/${maintenanceType.id}/edit`}>
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
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <CheckCircle className="h-4 w-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
            <DetailSectionCard title="Basic Information" description="Core maintenance type details" icon={<CheckCircle className="h-5 w-5" />}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Name</p>
                  <p className="mt-2 font-mono text-lg font-bold">{maintenanceType.name}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Category</p>
                  <Badge variant={getCategoryBadgeVariant(maintenanceType.category)} className="mt-2">
                    {maintenanceType.category}
                  </Badge>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Interval KM</p>
                  <p className="mt-2 font-mono text-lg font-bold">{maintenanceType.interval_km ? `${maintenanceType.interval_km.toLocaleString()} km` : 'N/A'}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Interval Months</p>
                  <p className="mt-2 font-mono text-lg font-bold">{maintenanceType.interval_months ? `${maintenanceType.interval_months} months` : 'N/A'}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Estimated Cost</p>
                  <p className="mt-2 font-mono text-lg font-bold">{maintenanceType.estimated_cost ? `$${maintenanceType.estimated_cost.toLocaleString()}` : 'N/A'}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Status</p>
                  <Badge variant={maintenanceType.is_active ? 'default' : 'secondary'} className="mt-2">
                    {maintenanceType.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {maintenanceType.description && (
                  <div className="rounded-lg border p-4 md:col-span-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Description</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{maintenanceType.description}</p>
                  </div>
                )}
              </div>
            </DetailSectionCard>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Record Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-semibold">{maintenanceType?.created_at ? new Date(maintenanceType.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-semibold">{maintenanceType?.updated_at ? new Date(maintenanceType.updated_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">System ID</span>
                  <span className="font-mono font-semibold">#{maintenanceType.id}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <DetailSectionCard title="Usage Analytics" description="Statistics and maintenance frequency analysis" icon={<BarChart3 className="h-5 w-5" />}>
            <div className="py-12 text-center">
              <Wrench className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Analytics Coming Soon</h3>
              <p className="text-muted-foreground">Detailed usage statistics and maintenance frequency analysis will be available here.</p>
            </div>
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <DetailSectionCard title="Activity History" description="Auditable timeline of changes" icon={<History className="h-5 w-5" />}>
            <ActivityLogTable activityLogs={activityLogs} />
          </DetailSectionCard>
        </TabsContent>
      </Tabs>

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Maintenance Type" description="Are you sure you want to delete this maintenance type? This action cannot be undone." itemName={maintenanceType.name} onConfirm={handleDeleteConfirm} isLoading={isDeleting} />
    </DetailPageLayout>
  );
}
