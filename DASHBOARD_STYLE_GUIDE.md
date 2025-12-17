# Dashboard Professional Style Guide

## Design System

### Color Palette

#### Primary Colors
- **Blue**: `#0ea5e9` (Sky), `#2563eb` (Primary), `#1e40af` (Dark)
- **Emerald**: `#10b981`, `#22c55e` (Success/Growth)
- **Orange**: `#f97316` (Warning/Costs)
- **Violet**: `#6366f1`, `#a855f7` (Accent)

#### Neutral Colors (Slate)
- Light: `#f1f5f9` (50), `#f8fafc` (100)
- Medium: `#cbd5e1` (300), `#94a3b8` (400)
- Dark: `#475569` (700), `#1e293b` (900)

#### Status Colors
- **Completed**: Emerald (`text-emerald-600`, `bg-emerald-500/15`)
- **In Progress**: Amber (`text-amber-600`, `bg-amber-500/15`)
- **Pending**: Slate (`text-slate-600`, `bg-slate-500/15`)
- **Cancelled**: Rose (`text-rose-600`, `bg-rose-500/15`)
- **Returned**: Sky (`text-sky-600`, `bg-sky-500/15`)

### Typography

#### Heading Hierarchy
```
h1 (Page Title): 4xl, font-bold, tracking-tight
h2 (Section Title): 2xl, font-bold, tracking-tight
h3 (Card Title): xl, font-bold
h4 (Subsection): lg, font-semibold
Body Text: base, font-normal
Small Text: sm, font-normal
Tiny Text: xs, font-medium
```

#### Font
- Primary Font: 'Instrument Sans', ui-sans-serif, system-ui
- Font Weight: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Spacing System
```
xs: 4px (0.25rem)
sm: 8px (0.5rem)
md: 16px (1rem)
lg: 24px (1.5rem)
xl: 32px (2rem)
2xl: 48px (3rem)
```

- **Page Padding**: `p-4` (mobile), `lg:p-6` (desktop)
- **Section Gap**: `gap-8` (major sections)
- **Card Gap**: `gap-4` (card grids)
- **Component Gap**: `gap-2` to `gap-6` (based on context)

### Border Radius
```
sm: 4px (0.25rem)
md: 8px (0.5rem)
lg: 10px (0.625rem)
xl: 12px (0.75rem)
```

### Shadows
```
sm: 0 1px 2px 0 rgba(0,0,0,0.05)
md: 0 4px 6px -1px rgba(0,0,0,0.1)
lg: 0 10px 15px -3px rgba(0,0,0,0.1)
xl: 0 20px 25px -5px rgba(0,0,0,0.1)
```

## Component Styling

### Cards
```tsx
<Card className="border-slate-200 dark:border-slate-700 
    shadow-lg hover:shadow-xl 
    transition-all duration-300 
    hover:scale-105">
    {/* content */}
</Card>
```

**Features:**
- Professional border color
- Enhanced shadow on hover
- Scale animation (105%) on hover
- Smooth transitions (300ms)
- Dark mode support

### Card Headers
```tsx
<CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 
    dark:from-slate-800 dark:to-slate-700">
    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
        Title
    </CardTitle>
    <CardDescription className="text-slate-600 dark:text-slate-400">
        Description
    </CardDescription>
</CardHeader>
```

**Features:**
- Gradient background for visual hierarchy
- Proper text contrast
- Semantic sizing

### Metric Cards
```tsx
<Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 
    dark:from-slate-800 dark:to-slate-700 
    border border-slate-200 dark:border-slate-700
    hover:shadow-lg transition-all duration-300 
    hover:scale-105">
    {/* content */}
</Card>
```

**Gradient Options:**
1. Blue: `from-blue-500/10 to-blue-600/5`
2. Emerald: `from-emerald-500/10 to-emerald-600/5`
3. Violet: `from-violet-500/10 to-violet-600/5`
4. Amber: `from-amber-500/10 to-amber-600/5`

### Buttons

#### Primary Button
```tsx
<Button className="bg-gradient-to-r from-blue-600 to-blue-700 
    hover:from-blue-700 hover:to-blue-800 
    transition-all duration-200 shadow-lg hover:shadow-xl">
    Action
</Button>
```

#### Outline Button
```tsx
<Button variant="outline" className="transition-all duration-200 
    hover:shadow-md border-slate-300 dark:border-slate-600">
    Secondary Action
</Button>
```

### Badges
```tsx
<span className="inline-flex items-center rounded-full px-3 py-1 
    text-xs font-semibold 
    bg-emerald-500/20 text-emerald-700 
    border border-emerald-200 dark:border-emerald-300 
    dark:text-emerald-400">
    Status
</span>
```

### Section Titles
```tsx
<div className="space-y-2">
    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
        Section Title
    </h2>
    <p className="mt-1 text-slate-600 dark:text-slate-400">
        Description
    </p>
</div>
```

## Animation Guidelines

### Transition Timing
- **Quick**: 150ms (micro-interactions)
- **Standard**: 200ms (button hovers)
- **Smooth**: 300ms (card transforms)
- **Slow**: 500ms (page transitions)

### Common Animations
```css
/* Hover scale */
hover:scale-105 transition-all duration-300

/* Shadow enhancement */
hover:shadow-lg transition-shadow duration-300

/* Fade in on load */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Slide up on load */
@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

## Dark Mode

### Implementation
- Uses `dark:` prefix for dark mode classes
- Automatic detection with `prefers-color-scheme`
- Manual toggle support via `.dark` class

### Color Mapping
```
Light Mode → Dark Mode
white → slate-800
slate-50 → slate-900
slate-100 → slate-800
slate-600 → slate-400
blue-600 → blue-400
emerald-700 → emerald-400
```

## Responsive Design

### Breakpoints
```
xs: 0px (default)
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Common Patterns
```tsx
{/* Mobile: 1 column, Desktop: 2-4 columns */}
<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    {/* items */}
</div>

{/* Flex wrap on mobile, row on desktop */}
<div className="flex flex-col gap-4 lg:flex-row lg:items-center">
    {/* items */}
</div>
```

## Accessibility Standards

### Color Contrast
- Normal text: 4.5:1 (AA)
- Large text: 3:1 (AA)
- UI components: 3:1 (AA)

### Typography
- Minimum font size: 12px (avoid)
- Recommended minimum: 14px
- Line height: 1.5-1.6

### Interactive Elements
- Minimum touch target: 44×44px
- Keyboard navigation support
- Focus states on all interactive elements

## Best Practices

### Do's ✅
- Use consistent spacing from the system
- Apply transitions to interactive elements
- Support dark mode for all colors
- Test contrast ratios
- Use semantic HTML
- Keep animations under 300ms
- Use GPU-accelerated properties (transform, opacity)

### Don'ts ❌
- Don't use pure black (#000000) on white
- Don't over-animate (limit to necessary interactions)
- Don't use hover-only functionality (mobile)
- Don't forget accessibility
- Don't use too many different colors
- Don't create unnecessary animations
- Don't ignore dark mode support

## Performance Tips

1. Use CSS transforms instead of position changes
2. Use opacity instead of display for show/hide
3. Minimize reflows with efficient selectors
4. Batch DOM updates
5. Use `will-change` sparingly for animations
6. Optimize chart rendering with memoization

## Examples

### Professional Card Grid
```tsx
<div className="grid gap-4 xl:grid-cols-4">
    {metrics.map((metric) => (
        <Card key={metric.id}
            className="border-slate-200 dark:border-slate-700 
                bg-gradient-to-br from-blue-50 to-blue-100 
                dark:from-blue-950 dark:to-blue-900
                shadow-lg hover:shadow-xl 
                transition-all duration-300 hover:scale-105">
            <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">
                    {metric.label}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                    {metric.value}
                </p>
            </CardContent>
        </Card>
    ))}
</div>
```

### Section Header
```tsx
<div>
    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
        Network Performance
    </h2>
    <p className="mt-1 text-slate-600 dark:text-slate-400">
        Demand coverage, corridor performance, and status mix.
    </p>
</div>
```

### Status Badge
```tsx
<span className="inline-flex items-center rounded-full px-3 py-1 
    text-xs font-semibold
    bg-emerald-500/20 text-emerald-700 
    border border-emerald-200
    dark:bg-emerald-950 dark:text-emerald-400 
    dark:border-emerald-800">
    Completed
</span>
```

## Maintenance

When making updates to the dashboard:
1. Follow the color palette
2. Maintain consistent spacing
3. Use the transition timings specified
4. Test in both light and dark modes
5. Verify responsive design
6. Check accessibility standards
7. Optimize performance
8. Update this guide if adding new patterns

## Version History
- v1.0 (Current): Professional modern design with dark mode support, gradient cards, enhanced typography, smooth animations, and full accessibility support.





