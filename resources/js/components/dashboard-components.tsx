import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight, TrendingUp } from 'lucide-react';

/**
 * Professional Dashboard Components
 *
 * A collection of reusable, professional components designed for
 * the dashboard with consistent styling, animations, and dark mode support.
 */

// ============================================================================
// STAT CARDS
// ============================================================================

interface StatCardProps {
  title: string;
  description?: string;
  value: string | number;
  change?: number;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variantStyles = {
  primary: 'from-indigo-500/15 via-indigo-400/10 to-indigo-400/0 dark:from-indigo-950/70 dark:via-indigo-900/40 dark:to-indigo-900/10',
  success: 'from-teal-500/15 via-emerald-400/10 to-emerald-400/0 dark:from-teal-950/60 dark:via-emerald-900/40 dark:to-emerald-900/15',
  warning: 'from-amber-400/20 via-amber-500/10 to-orange-400/0 dark:from-amber-950/60 dark:via-orange-900/40 dark:to-orange-900/10',
  danger: 'from-rose-500/20 via-rose-500/10 to-rose-400/0 dark:from-rose-950/65 dark:via-rose-900/40 dark:to-rose-900/10',
  info: 'from-sky-500/15 via-primary/10 to-indigo-400/0 dark:from-sky-950/60 dark:via-indigo-900/40 dark:to-indigo-900/10',
};

const variantTextColors = {
  primary: 'text-indigo-700 dark:text-indigo-300',
  success: 'text-teal-700 dark:text-teal-300',
  warning: 'text-amber-700 dark:text-amber-300',
  danger: 'text-rose-700 dark:text-rose-300',
  info: 'text-sky-700 dark:text-sky-300',
};

export const StatCard = React.memo(({
  title,
  description,
  value,
  change,
  icon: Icon = TrendingUp,
  variant = 'primary',
  className,
}: StatCardProps) => {
  const hasPositiveChange = change !== undefined && change > 0;

  return (
    <Card className={cn(
      'relative overflow-hidden border-slate-200 dark:border-slate-700',
      'bg-gradient-to-br',
      variantStyles[variant],
      'shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105',
      className,
    )}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {description}
            </CardDescription>
          )}
        </div>
        <Icon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className={cn('text-3xl font-bold', variantTextColors[variant])}>
          {value}
        </p>
        {change !== undefined && (
          <TrendChangeIndicator value={change} />
        )}
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

// ============================================================================
// TREND INDICATOR
// ============================================================================

interface TrendChangeIndicatorProps {
  value: number | null | undefined;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const TrendChangeIndicator = React.memo(({
  value,
  label,
  size = 'md',
  className,
}: TrendChangeIndicatorProps) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (
      <span className={cn(
        'flex items-center gap-1 text-slate-600 dark:text-slate-400',
        size === 'sm' ? 'text-xs' : 'text-sm',
        className,
      )}>
        Change unavailable
      </span>
    );
  }

  if (value === 0) {
    return (
      <span className={cn(
        'flex items-center gap-1 text-slate-600 dark:text-slate-400',
        size === 'sm' ? 'text-xs' : 'text-sm',
        className,
      )}>
        No change
      </span>
    );
  }

  const isPositive = value > 0;
  const tone = isPositive ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400';
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
  const displayValue = Math.abs(value).toFixed(1);

  return (
    <span className={cn(
      'flex items-center gap-1 font-medium',
      tone,
      size === 'sm' ? 'text-xs' : 'text-sm',
      className,
    )}>
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {isPositive ? '+' : '-'}{displayValue}%
      {label && <span className="text-muted-foreground ml-1">{label}</span>}
    </span>
  );
});

TrendChangeIndicator.displayName = 'TrendChangeIndicator';

// ============================================================================
// PROFESSIONAL SECTION HEADER
// ============================================================================

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'primary' | 'secondary';
  icon?: React.ComponentType<{ className?: string }>;
}

export const SectionHeader = React.memo(({
  title,
  description,
  action,
  variant = 'primary',
  icon: Icon,
}: SectionHeaderProps) => {
  return (
    <div className={cn(
      'flex flex-col gap-3',
      variant === 'secondary' && 'sm:flex-row sm:items-end sm:justify-between',
    )}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-6 w-6 text-primary" />}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
});

SectionHeader.displayName = 'SectionHeader';

// ============================================================================
// METRIC ROW (for list displays)
// ============================================================================

interface MetricRowProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export const MetricRow = React.memo(({
  label,
  value,
  change,
  icon: Icon,
  className,
}: MetricRowProps) => {
  return (
    <div className={cn(
      'flex items-center justify-between px-4 py-3',
      'rounded-lg border border-slate-200 dark:border-slate-700',
      'bg-white dark:bg-slate-800',
      'hover:shadow-md transition-shadow duration-200',
      className,
    )}>
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-5 w-5 text-slate-400 dark:text-slate-500" />}
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {label}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
      {change !== undefined && (
        <TrendChangeIndicator value={change} size="sm" />
      )}
    </div>
  );
});

MetricRow.displayName = 'MetricRow';

// ============================================================================
// LOADING SKELETON
// ============================================================================

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg',
        'bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800',
        className,
      )}
    />
  );
};

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}

export const EmptyState = React.memo(({
  title,
  description,
  icon: Icon,
  action,
}: EmptyStateProps) => {
  return (
    <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900">
      {Icon && (
        <Icon className="mb-3 h-8 w-8 text-slate-400 dark:text-slate-500" />
      )}
      <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

// ============================================================================
// PROGRESS BAR
// ============================================================================

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

const progressVariants = {
  primary: 'bg-indigo-500',
  success: 'bg-teal-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
};

export const ProgressBar = React.memo(({
  value,
  max = 100,
  label,
  variant = 'primary',
  showPercentage = true,
  animated = false,
  className,
}: ProgressBarProps) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-medium">
          {label && <span className="text-slate-700 dark:text-slate-300">{label}</span>}
          {showPercentage && (
            <span className="text-slate-600 dark:text-slate-400">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            progressVariants[variant],
            animated && 'animate-pulse',
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

// ============================================================================
// STATUS BADGE
// ============================================================================

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  className?: string;
}

const statusVariants = {
  success: 'bg-teal-500/20 text-teal-700 border-teal-200 dark:border-teal-900/60 dark:text-teal-300',
  warning: 'bg-amber-400/25 text-amber-700 border-amber-200 dark:border-amber-900/60 dark:text-amber-300',
  danger: 'bg-rose-500/20 text-rose-700 border-rose-200 dark:border-rose-900/60 dark:text-rose-300',
  info: 'bg-sky-500/20 text-sky-700 border-sky-200 dark:border-sky-900/60 dark:text-sky-300',
  default: 'bg-slate-500/20 text-slate-700 border-slate-200 dark:border-slate-800 dark:text-slate-400',
};

export const StatusBadge = React.memo(({
  status,
  variant = 'default',
  className,
}: StatusBadgeProps) => {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border',
      'transition-colors duration-200 hover:shadow-sm',
      statusVariants[variant],
      className,
    )}>
      {status.replaceAll('_', ' ')}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';

// ============================================================================
// CARD GRID
// ============================================================================

interface CardGridProps {
  children: React.ReactNode;
  columns?: 'auto' | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CardGrid = React.memo(({
  children,
  columns = 'auto',
  gap = 'md',
  className,
}: CardGridProps) => {
  const columnsClass = {
    auto: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  const gapClass = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div className={cn(
      'grid',
      columnsClass[columns],
      gapClass[gap],
      className,
    )}>
      {children}
    </div>
  );
});

CardGrid.displayName = 'CardGrid';

export default {
  StatCard,
  TrendChangeIndicator,
  SectionHeader,
  MetricRow,
  Skeleton,
  EmptyState,
  ProgressBar,
  StatusBadge,
  CardGrid,
};







