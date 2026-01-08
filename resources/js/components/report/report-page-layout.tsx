import { type ReactNode } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileDigit, FileSpreadsheet, FileType2, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportPageLayoutProps {
  title: string;
  description?: string;
  headTitle?: string;
  breadcrumbs: BreadcrumbItem[];
  icon?: ReactNode;
  filters?: ReactNode;
  summarySection?: ReactNode;
  children: ReactNode;
  onRefresh?: () => void;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  onExportCsv?: () => void;
  canExport?: boolean;
  isRefreshing?: boolean;
  className?: string;
  cardClassName?: string;
  contentClassName?: string;
}

export function ReportPageLayout({
  title,
  description,
  headTitle,
  breadcrumbs,
  icon,
  filters,
  summarySection,
  children,
  onRefresh,
  onExportPdf,
  onExportExcel,
  onExportCsv,
  canExport = true,
  isRefreshing = false,
  className,
  cardClassName,
  contentClassName,
}: ReportPageLayoutProps) {
  const showExportDropdown = canExport && (onExportPdf || onExportExcel || onExportCsv);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={headTitle ?? title} />
      <div className={cn('flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4', className)}>
        <Card
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70',
            cardClassName,
          )}
        >
          <CardHeader className="border-b border-slate-200/50 px-6 pb-4 dark:border-slate-800/50">
            <div className="grid gap-4 lg:grid-cols-[3fr_7fr] lg:items-start">
              <div className="flex items-start gap-4">
                {icon && (
                  <div className="rounded-xl bg-blue-100 p-2 text-blue-600 shadow-sm dark:bg-blue-900/30 dark:text-blue-400">
                    {icon}
                  </div>
                )}
                <div>
                  <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{title}</CardTitle>
                  {description && (
                    <CardDescription className="sr-only">
                      {description}
                    </CardDescription>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                {filters}
                {onRefresh && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="gap-2"
                  >
                    <RefreshCcw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                    Refresh
                  </Button>
                )}
                {showExportDropdown && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onExportPdf && (
                        <DropdownMenuItem onClick={onExportPdf} className="gap-2">
                          <FileType2 className="h-4 w-4" />
                          Export as PDF
                        </DropdownMenuItem>
                      )}
                      {onExportExcel && (
                        <DropdownMenuItem onClick={onExportExcel} className="gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          Export as Excel
                        </DropdownMenuItem>
                      )}
                      {onExportCsv && (
                        <DropdownMenuItem onClick={onExportCsv} className="gap-2">
                          <FileDigit className="h-4 w-4" />
                          Export as CSV
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>

          {summarySection && (
            <div className="border-b border-slate-200/50 px-6 py-4 dark:border-slate-800/50">{summarySection}</div>
          )}

          <CardContent className={cn('flex flex-1 flex-col overflow-auto p-6', contentClassName)}>
            {children}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

