import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { type ReactNode } from 'react';
import { DetailHeader } from './detail-header';

interface DetailPageLayoutProps {
  title: string;
  subtitle?: string;
  headTitle?: string;
  breadcrumbs: BreadcrumbItem[];
  icon?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  layoutClassName?: string;
  contentClassName?: string;
  iconWrapperClassName?: string;
}

/**
 * DetailPageLayout - A consistent layout for all "Show" pages (detail views)
 * 
 * Features:
 * - Consistent header with title, subtitle, icon, and actions
 * - Back button support via `leading` prop
 * - Action buttons (Edit, Delete, etc.) via `actions` prop
 * - Proper spacing and responsive layout
 * - Dark mode support
 * 
 * Usage:
 * ```tsx
 * <DetailPageLayout
 *   title="Region Name"
 *   subtitle="Active since 2024"
 *   breadcrumbs={breadcrumbs}
 *   icon={<MapPin className="h-5 w-5" />}
 *   leading={<Button variant="ghost"><ArrowLeft /></Button>}
 *   actions={<><Button>Edit</Button><Button variant="destructive">Delete</Button></>}
 * >
 *   <DetailSectionCard title="Overview">...</DetailSectionCard>
 * </DetailPageLayout>
 * ```
 */
export function DetailPageLayout({
  title,
  subtitle,
  headTitle,
  breadcrumbs,
  icon,
  leading,
  actions,
  children,
  layoutClassName,
  contentClassName,
  iconWrapperClassName,
}: DetailPageLayoutProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={headTitle ?? title} />
      <div className={cn('mx-auto w-full space-y-6 p-4 md:p-6', layoutClassName)}>
        <DetailHeader
          title={title}
          subtitle={subtitle}
          icon={icon}
          leading={leading}
          actions={actions}
          iconWrapperClassName={iconWrapperClassName}
        />
        <div className={cn('space-y-6', contentClassName)}>{children}</div>
      </div>
    </AppLayout>
  );
}

