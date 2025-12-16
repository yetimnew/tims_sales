# Dashboard Components Usage Guide

## Overview

The new dashboard components are professional, reusable React components designed for the Network Intelligence Center. All components support dark mode, animations, and follow the design system guidelines.

**Location**: `resources/js/components/dashboard-components.tsx`

## Components

### 1. StatCard

A professional stat card component for displaying key metrics with optional trend indicators.

#### Props
```typescript
interface StatCardProps {
  title: string;
  description?: string;
  value: string | number;
  change?: number;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}
```

#### Example Usage
```tsx
import { StatCard } from '@/components/dashboard-components';
import { Package, TrendingUp } from 'lucide-react';

export function MetricsSection() {
  return (
    <StatCard
      title="Total Tonnage"
      description="30-day rolling"
      value="12,450 MT"
      change={8.5}
      icon={Package}
      variant="success"
    />
  );
}
```

#### Variants
- **primary**: Blue gradient (default)
- **success**: Emerald gradient (for positive metrics)
- **warning**: Amber gradient (for costs/cautions)
- **danger**: Rose gradient (for negative metrics)
- **info**: Violet gradient (for informational metrics)

#### Features
- Automatic trend indicator display
- Color-coded gradient backgrounds
- Hover scale animation
- Dark mode support
- Responsive sizing

---

### 2. TrendChangeIndicator

Displays percentage change with directional arrows and proper styling.

#### Props
```typescript
interface TrendChangeIndicatorProps {
  value: number | null | undefined;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}
```

#### Example Usage
```tsx
import { TrendChangeIndicator } from '@/components/dashboard-components';

export function PerformanceMetrics() {
  return (
    <div>
      <p>Revenue Change:</p>
      <TrendChangeIndicator value={12.5} label="vs last month" />
      
      <p>Cost Change:</p>
      <TrendChangeIndicator value={-5.2} size="sm" />
    </div>
  );
}
```

#### Features
- Auto-colors green for positive, red for negative
- Handles null/undefined values gracefully
- DirectionalIcons (up/down arrows)
- Two sizes: sm (xs text), md (sm text)

---

### 3. SectionHeader

Professional section header with title, description, and optional action button.

#### Props
```typescript
interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'primary' | 'secondary';
  icon?: React.ComponentType<{ className?: string }>;
}
```

#### Example Usage
```tsx
import { SectionHeader } from '@/components/dashboard-components';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

export function NetworkSection() {
  return (
    <SectionHeader
      title="Network Performance"
      description="Demand coverage, corridor performance, and status mix."
      icon={BarChart3}
      action={
        <Button variant="outline" size="sm">
          View Details
        </Button>
      }
    />
  );
}
```

#### Variants
- **primary**: Vertical layout (title + icon side by side)
- **secondary**: Horizontal layout (title left, action right)

#### Features
- Optional icon support
- Flexible action placement
- Professional typography
- Responsive alignment

---

### 4. MetricRow

A single metric display row, ideal for list-based metrics.

#### Props
```typescript
interface MetricRowProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}
```

#### Example Usage
```tsx
import { MetricRow } from '@/components/dashboard-components';
import { Truck, Users } from 'lucide-react';

export function FleetStatus() {
  return (
    <div className="space-y-2">
      <MetricRow
        label="Active Trucks"
        value="145"
        change={5.2}
        icon={Truck}
      />
      <MetricRow
        label="Available Drivers"
        value="89"
        change={-2.1}
        icon={Users}
      />
    </div>
  );
}
```

#### Features
- Compact design for lists
- Optional change indicator
- Icon support
- Hover shadow effect
- Responsive padding

---

### 5. Skeleton

Loading placeholder component with animated gradient.

#### Props
```typescript
interface SkeletonProps {
  className?: string;
}
```

#### Example Usage
```tsx
import { Skeleton } from '@/components/dashboard-components';

export function ChartLoader() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-6 w-1/2" />
    </div>
  );
}
```

#### Features
- Smooth animation
- Dark mode compatible
- Customizable size via className

---

### 6. EmptyState

Display message when no data is available.

#### Props
```typescript
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}
```

#### Example Usage
```tsx
import { EmptyState } from '@/components/dashboard-components';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export function NoData() {
  return (
    <EmptyState
      title="No Data Available"
      description="There are no performances recorded for this period."
      icon={AlertCircle}
      action={
        <Button size="sm">
          Create Performance
        </Button>
      }
    />
  );
}
```

#### Features
- Dashed border design
- Icon support
- Optional description and action
- Proper spacing and sizing

---

### 7. ProgressBar

Visual progress indicator with optional label.

#### Props
```typescript
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}
```

#### Example Usage
```tsx
import { ProgressBar } from '@/components/dashboard-components';

export function AvailabilityMetrics() {
  return (
    <div className="space-y-4">
      <ProgressBar
        value={75}
        label="Fleet Availability"
        variant="success"
        showPercentage={true}
      />
      <ProgressBar
        value={45}
        max={100}
        label="Target Utilization"
        variant="warning"
      />
    </div>
  );
}
```

#### Variants
- **primary**: Blue
- **success**: Emerald (for positive progress)
- **warning**: Amber (for cautions)
- **danger**: Rose (for issues)

#### Features
- Customizable max value
- Optional percentage display
- Optional animation
- Responsive sizing

---

### 8. StatusBadge

Professional status indicator badge.

#### Props
```typescript
interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  className?: string;
}
```

#### Example Usage
```tsx
import { StatusBadge } from '@/components/dashboard-components';

export function PerformanceStatus() {
  return (
    <div className="space-y-2">
      <StatusBadge status="completed" variant="success" />
      <StatusBadge status="in_progress" variant="warning" />
      <StatusBadge status="pending" variant="info" />
      <StatusBadge status="cancelled" variant="danger" />
    </div>
  );
}
```

#### Variants
- **success**: Emerald background (completed, active)
- **warning**: Amber background (in_progress, pending)
- **danger**: Rose background (cancelled, failed)
- **info**: Blue background (informational)
- **default**: Slate background

#### Features
- Automatic underscore to space conversion
- Colored borders and text
- Hover shadow effect
- Professional rounded design

---

### 9. CardGrid

Responsive grid container for organizing cards.

#### Props
```typescript
interface CardGridProps {
  children: React.ReactNode;
  columns?: 'auto' | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

#### Example Usage
```tsx
import { CardGrid, StatCard } from '@/components/dashboard-components';

export function MetricsGrid() {
  return (
    <CardGrid columns={4} gap="md">
      <StatCard title="Metric 1" value="1,234" variant="primary" />
      <StatCard title="Metric 2" value="5,678" variant="success" />
      <StatCard title="Metric 3" value="9,012" variant="warning" />
      <StatCard title="Metric 4" value="3,456" variant="info" />
    </CardGrid>
  );
}
```

#### Column Options
- **auto**: 1 (mobile) → 2 (md) → 4 (xl)
- **2**: 1 (mobile) → 2 (md)
- **3**: 1 (mobile) → 2 (md) → 3 (lg)
- **4**: 1 (mobile) → 2 (md) → 3 (lg) → 4 (xl)

#### Gap Options
- **sm**: 8px
- **md**: 16px (default)
- **lg**: 24px

#### Features
- Fully responsive
- Easy column management
- Consistent spacing
- Semantic markup

---

## Complete Example

Here's a complete example combining multiple components:

```tsx
import * as React from 'react';
import {
  CardGrid,
  StatCard,
  SectionHeader,
  ProgressBar,
  EmptyState,
  StatusBadge,
  MetricRow,
} from '@/components/dashboard-components';
import { Button } from '@/components/ui/button';
import { BarChart3, Package, Truck, Users, AlertCircle } from 'lucide-react';

export function DashboardExample() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <SectionHeader
        title="Executive Dashboard"
        description="Key performance indicators and metrics"
        icon={BarChart3}
      />

      {/* Metrics Grid */}
      <CardGrid columns={4}>
        <StatCard
          title="Total Tonnage"
          value="12,450 MT"
          change={8.5}
          icon={Package}
          variant="success"
        />
        <StatCard
          title="Active Trucks"
          value="145"
          change={2.3}
          icon={Truck}
          variant="primary"
        />
        <StatCard
          title="Drivers Available"
          value="89"
          change={-1.2}
          icon={Users}
          variant="warning"
        />
        <StatCard
          title="Operations"
          value="234"
          icon={BarChart3}
          variant="info"
        />
      </CardGrid>

      {/* Fleet Status Section */}
      <div className="space-y-4">
        <SectionHeader
          title="Fleet Status"
          description="Real-time operational metrics"
        />
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 space-y-6">
          <ProgressBar
            value={85}
            label="Fleet Availability"
            variant="success"
          />
          <ProgressBar
            value={72}
            label="Target Utilization"
            variant="warning"
          />
          <ProgressBar
            value={91}
            label="Safety Score"
            variant="success"
          />
        </div>
      </div>

      {/* Recent Status Section */}
      <div className="space-y-4">
        <SectionHeader
          title="Recent Performances"
          description="Latest trip statuses"
        />
        <div className="space-y-2">
          <MetricRow
            label="Trip #001"
            value="245 MT"
            change={5.2}
            icon={Package}
          />
          <MetricRow
            label="Trip #002"
            value="189 MT"
            change={-3.1}
            icon={Package}
          />
          <MetricRow
            label="Trip #003"
            value="312 MT"
            icon={Package}
          />
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex gap-2">
        <StatusBadge status="completed" variant="success" />
        <StatusBadge status="in_progress" variant="warning" />
        <StatusBadge status="pending" variant="info" />
      </div>
    </div>
  );
}
```

## Best Practices

### Do's ✅
- Use `CardGrid` for metric layouts
- Combine components for complex dashboards
- Use appropriate variants for different metric types
- Provide icons for better visual recognition
- Test dark mode compatibility
- Use semantic color choices

### Don'ts ❌
- Don't overuse animations
- Don't mix too many variants on one page
- Don't forget accessibility labels
- Don't nest grids unnecessarily
- Don't use generic colors for status information

## Integration with Existing Dashboard

The new components can be gradually integrated into the Dashboard.tsx file:

```tsx
import {
  CardGrid,
  StatCard,
  SectionHeader,
  ProgressBar,
  EmptyState,
  StatusBadge,
  MetricRow,
} from '@/components/dashboard-components';

// Use in place of custom Card-based layouts
<CardGrid columns={4} gap="md">
  {executiveSummary.metrics.map(metric => (
    <StatCard
      key={metric.key}
      title={metric.label}
      value={formatNumber(metric.value)}
      change={metric.change}
      variant="primary"
    />
  ))}
</CardGrid>
```

## Customization

All components accept a `className` prop for additional customization:

```tsx
<StatCard
  title="Custom Styled"
  value="123"
  className="border-2 border-blue-500"
/>
```

## Performance

All components are wrapped with `React.memo` for optimal performance:
- StatCard
- TrendChangeIndicator
- SectionHeader
- MetricRow
- EmptyState
- ProgressBar
- StatusBadge
- CardGrid

## Accessibility

Components follow WCAG guidelines:
- Proper semantic HTML
- Color contrast ratios maintained
- Icon descriptions via labels
- Keyboard navigation support

## Version History

- **v1.0** (Current): Initial release with 9 professional components
  - StatCard for key metrics
  - TrendChangeIndicator for trends
  - SectionHeader for titles
  - MetricRow for lists
  - Skeleton for loading
  - EmptyState for no data
  - ProgressBar for progress
  - StatusBadge for status
  - CardGrid for layouts

## Support

For questions or improvements, refer to:
- `DASHBOARD_STYLE_GUIDE.md` - Design system details
- `DASHBOARD_UI_IMPROVEMENTS.md` - Overall improvements
- `Dashboard.tsx` - Real-world usage examples


