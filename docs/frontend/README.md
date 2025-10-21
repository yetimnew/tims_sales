# Frontend Documentation - TIMS

This document provides comprehensive documentation for the TIMS frontend, built with React 19, TypeScript, and modern web technologies.

## 🏗️ Architecture Overview

### Technology Stack
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern UI component library
- **Radix UI**: Accessible UI primitives
- **Vite**: Fast build tool and development server
- **Inertia.js**: Seamless SPA experience with Laravel
- **Laravel Wayfinder**: Automatic route generation

### Project Structure
```
resources/js/
├── app.tsx                 # Main application entry point
├── ssr.tsx                # Server-side rendering entry
├── components/             # Reusable UI components
│   ├── ui/                # shadcn/ui components
│   ├── app-*.tsx          # Application layout components
│   └── *.tsx              # Feature-specific components
├── layouts/               # Page layout components
│   ├── app/               # Application layouts
│   └── auth/              # Authentication layouts
├── pages/                 # Inertia page components
│   ├── auth/              # Authentication pages
│   ├── settings/          # User settings pages
│   ├── Trucks/            # Truck management pages
│   ├── Drivers/           # Driver management pages
│   └── ...                # Other feature pages
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── types/                 # TypeScript type definitions
└── routes/                # Route definitions
```

## 🎨 UI Components

### Core Components

#### Layout Components
- **`AppLayout`**: Main application layout wrapper
- **`AppShell`**: Shell component with sidebar and content
- **`AppSidebar`**: Collapsible sidebar navigation
- **`AppHeader`**: Top header with user menu
- **`AppContent`**: Main content area
- **`SidebarInset`**: Content area with sidebar spacing

#### Form Components
- **`Input`**: Text input with validation
- **`Select`**: Dropdown selection
- **`Textarea`**: Multi-line text input
- **`Checkbox`**: Checkbox input
- **`Button`**: Various button styles and sizes
- **`Label`**: Form field labels

#### Data Display Components
- **`Table`**: Data table with sorting and pagination
- **`Card`**: Content card container
- **`Badge`**: Status and category badges
- **`Avatar`**: User profile images
- **`Alert`**: Notification and warning messages

#### Interactive Components
- **`Dialog`**: Modal dialogs
- **`DropdownMenu`**: Context menus
- **`Sheet`**: Slide-out panels
- **`Collapsible`**: Expandable content
- **`Tooltip`**: Hover information
- **`Toast`**: Notification messages

### Custom Components

#### Business Logic Components
- **`DeleteConfirmationDialog`**: Reusable deletion confirmation
- **`ActivityLogTable`**: Audit log display
- **`PermissionGate`**: Permission-based rendering
- **`SearchInput`**: Advanced search functionality
- **`ExportButton`**: CSV export functionality

#### Navigation Components
- **`NavMain`**: Main navigation menu
- **`NavUser`**: User menu and profile
- **`NavFooter`**: Footer navigation
- **`Breadcrumbs`**: Page breadcrumb navigation

## 🔧 State Management

### Inertia.js Integration
The application uses Inertia.js for seamless SPA experience:

```typescript
import { useForm } from '@inertiajs/react'

function CreateTruck() {
  const { data, setData, post, processing, errors } = useForm({
    plate: '',
    vehicletype_id: '',
    chasisNumber: '',
    // ... other fields
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('trucks.store'))
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### Custom Hooks

#### `usePermissions`
Permission checking hook for role-based UI rendering:

```typescript
import { usePermissions } from '@/hooks/usePermissions'

function TruckIndex() {
  const { can } = usePermissions()
  
  return (
    <div>
      {can('trucks.create') && (
        <Button onClick={() => router.visit(route('trucks.create'))}>
          Add Truck
        </Button>
      )}
    </div>
  )
}
```

#### `useToast`
Toast notification system:

```typescript
import { useToast } from '@/hooks/useToast'

function TruckCreate() {
  const { toast } = useToast()
  
  const handleSuccess = () => {
    toast({
      title: 'Success',
      description: 'Truck created successfully',
      variant: 'default'
    })
  }
}
```

#### `useMobile`
Mobile device detection:

```typescript
import { useMobile } from '@/hooks/useMobile'

function ResponsiveComponent() {
  const isMobile = useMobile()
  
  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      {/* Content */}
    </div>
  )
}
```

## 📝 Form Validation

### Centralized Validation System
All form validation is centralized in `lib/validation.ts`:

```typescript
// Validation rules
export const truckValidation = {
  plate: {
    required: 'Plate number is required',
    pattern: {
      value: /^[A-Z]{2}[0-9]{4}[A-Z]{2}$/,
      message: 'Invalid Ethiopian plate format (e.g., AA1234BB)'
    }
  },
  vehicletype_id: {
    required: 'Vehicle type is required'
  },
  chasisNumber: {
    required: 'Chassis number is required',
    minLength: {
      value: 10,
      message: 'Chassis number must be at least 10 characters'
    }
  }
  // ... other validations
}

// Validation function
export function validateTruck(data: TruckFormData): ValidationErrors {
  const errors: ValidationErrors = {}
  
  if (!data.plate) {
    errors.plate = truckValidation.plate.required
  } else if (!truckValidation.plate.pattern.value.test(data.plate)) {
    errors.plate = truckValidation.plate.pattern.message
  }
  
  // ... other validations
  
  return errors
}
```

### Form Implementation Pattern
Every form follows the same pattern:

```typescript
function CreateTruck() {
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { data, setData, post, processing } = useForm({
    plate: '',
    vehicletype_id: '',
    // ... other fields
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Frontend validation
    const validationErrors = validateTruck(data)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    
    setIsSubmitting(true)
    post(route('trucks.store'), {
      onSuccess: () => {
        setErrors({})
        toast({ title: 'Success', description: 'Truck created successfully' })
      },
      onError: (errors) => {
        setErrors(errors)
        toast({ title: 'Error', description: 'Please fix the errors below' })
      },
      onFinish: () => setIsSubmitting(false)
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            Please fix the errors below before submitting.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="plate">Plate Number</Label>
          <Input
            id="plate"
            value={data.plate}
            onChange={(e) => setData('plate', e.target.value)}
            className={errors.plate ? 'border-red-500' : ''}
          />
          {errors.plate && (
            <p className="text-sm text-red-500 mt-1">{errors.plate}</p>
          )}
        </div>
        
        {/* Other form fields */}
        
        <Button type="submit" disabled={processing || isSubmitting}>
          {processing ? 'Creating...' : 'Create Truck'}
        </Button>
      </div>
    </form>
  )
}
```

## 🗂️ Data Tables

### Table Component Pattern
All data tables follow a consistent pattern:

```typescript
function TruckIndex() {
  const { trucks, filters, sort } = usePage().props
  const [search, setSearch] = useState(filters.search || '')
  const [sortField, setSortField] = useState(sort.field || 'plate')
  const [sortDirection, setSortDirection] = useState(sort.direction || 'asc')
  
  const handleSearch = useCallback(
    debounce((value: string) => {
      router.get(route('trucks.index'), {
        search: value,
        sort: sortField,
        direction: sortDirection
      }, { preserveState: true })
    }, 300),
    [sortField, sortDirection]
  )

  const handleSort = (field: string) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortDirection(direction)
    
    router.get(route('trucks.index'), {
      search,
      sort: field,
      direction
    }, { preserveState: true })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Trucks</h1>
          <p className="text-muted-foreground">
            Manage your fleet of {trucks.total} trucks
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.visit(route('trucks.export'))}>
            Export CSV
          </Button>
          {can('trucks.create') && (
            <Button onClick={() => router.visit(route('trucks.create'))}>
              New Truck
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search trucks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              handleSearch(e.target.value)
            }}
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('plate')}
                  className="h-auto p-0 font-semibold"
                >
                  Plate
                  {sortField === 'plate' && (
                    <ChevronUp className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </TableHead>
              <TableHead>Vehicle Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trucks.data.map((truck) => (
              <TableRow key={truck.id}>
                <TableCell>{truck.plate}</TableCell>
                <TableCell>{truck.vehicletype?.name}</TableCell>
                <TableCell>
                  <Badge variant={truck.status === 'active' ? 'default' : 'secondary'}>
                    {truck.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {can('trucks.show') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.visit(route('trucks.show', truck.id))}
                      >
                        View
                      </Button>
                    )}
                    {can('trucks.edit') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.visit(route('trucks.edit', truck.id))}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {trucks.links && (
        <div className="flex justify-center">
          <Pagination links={trucks.links} />
        </div>
      )}
    </div>
  )
}
```

## 🎯 Page Components

### Index Pages
All index pages follow the same structure:
1. **Header**: Title, description, and action buttons
2. **Search**: Search input with debounced filtering
3. **Table**: Data table with sorting and pagination
4. **Actions**: View, Edit, Delete buttons with permissions
5. **Pagination**: Page navigation controls

### Create/Edit Pages
All form pages follow the same structure:
1. **Header**: Page title and breadcrumbs
2. **Form**: Validation-enabled form with error display
3. **Actions**: Submit and cancel buttons
4. **Validation**: Real-time frontend validation
5. **Error Handling**: Alert box for validation errors

### Show Pages
All detail pages follow the same structure:
1. **Header**: Title and action buttons
2. **Content**: 3-column grid layout with information
3. **Relationships**: Related data display
4. **Activity Logs**: Audit trail table
5. **Actions**: Edit and delete buttons with permissions

## 🔐 Permission System

### Permission-Based Rendering
The frontend uses the `usePermissions` hook for role-based UI:

```typescript
import { usePermissions } from '@/hooks/usePermissions'

function TruckIndex() {
  const { can } = usePermissions()
  
  return (
    <div>
      {/* Conditional rendering based on permissions */}
      {can('trucks.create') && (
        <Button onClick={() => router.visit(route('trucks.create'))}>
          Add Truck
        </Button>
      )}
      
      {can('trucks.edit') && (
        <Button variant="outline" onClick={() => router.visit(route('trucks.edit', truck.id))}>
          Edit
        </Button>
      )}
      
      {can('trucks.destroy') && (
        <Button variant="destructive" onClick={() => handleDelete(truck.id)}>
          Delete
        </Button>
      )}
    </div>
  )
}
```

### Permission Structure
All modules follow the same permission pattern:
- `{module}.view` - List/Index access
- `{module}.show` - View details
- `{module}.create` - Create form access
- `{module}.store` - Create submission
- `{module}.edit` - Edit form access
- `{module}.update` - Update submission
- `{module}.destroy` - Delete action
- `{module}.export` - CSV export (optional)

## 🎨 Styling and Theming

### Tailwind CSS Configuration
The project uses Tailwind CSS with custom configuration:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './resources/**/*.blade.php',
    './resources/**/*.js',
    './resources/**/*.tsx',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... other colors
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### CSS Variables
CSS variables are defined for theming:

```css
/* app.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... other dark mode variables */
  }
}
```

## 🚀 Performance Optimization

### Code Splitting
Vite automatically handles code splitting:

```typescript
// Lazy loading components
const LazyComponent = lazy(() => import('./LazyComponent'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  )
}
```

### Memoization
React components are memoized for performance:

```typescript
import { memo, useMemo } from 'react'

const TruckRow = memo(({ truck, onEdit, onDelete }) => {
  const statusColor = useMemo(() => {
    return truck.status === 'active' ? 'green' : 'gray'
  }, [truck.status])

  return (
    <TableRow>
      <TableCell>{truck.plate}</TableCell>
      <TableCell>
        <Badge variant={statusColor}>{truck.status}</Badge>
      </TableCell>
      <TableCell>
        <Button onClick={() => onEdit(truck.id)}>Edit</Button>
        <Button onClick={() => onDelete(truck.id)}>Delete</Button>
      </TableCell>
    </TableRow>
  )
})
```

### Debounced Search
Search inputs use debouncing to prevent excessive API calls:

```typescript
import { useCallback } from 'react'
import { debounce } from 'lodash'

function SearchInput({ onSearch }) {
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      onSearch(value)
    }, 300),
    [onSearch]
  )

  return (
    <Input
      placeholder="Search..."
      onChange={(e) => debouncedSearch(e.target.value)}
    />
  )
}
```

## 🧪 Testing

### Component Testing
Components are tested with React Testing Library:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { TruckIndex } from '@/pages/Trucks/Index'

describe('TruckIndex', () => {
  it('renders truck list', () => {
    const trucks = [
      { id: 1, plate: 'AA1234BB', status: 'active' },
      { id: 2, plate: 'BB5678CC', status: 'inactive' }
    ]
    
    render(<TruckIndex trucks={trucks} />)
    
    expect(screen.getByText('AA1234BB')).toBeInTheDocument()
    expect(screen.getByText('BB5678CC')).toBeInTheDocument()
  })

  it('handles search input', () => {
    const onSearch = jest.fn()
    render(<TruckIndex onSearch={onSearch} />)
    
    const searchInput = screen.getByPlaceholderText('Search trucks...')
    fireEvent.change(searchInput, { target: { value: 'AA1234' } })
    
    expect(onSearch).toHaveBeenCalledWith('AA1234')
  })
})
```

### Integration Testing
Integration tests cover user workflows:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateTruck } from '@/pages/Trucks/Create'

describe('CreateTruck Integration', () => {
  it('creates truck successfully', async () => {
    const mockPost = jest.fn()
    render(<CreateTruck post={mockPost} />)
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Plate Number'), {
      target: { value: 'AA1234BB' }
    })
    
    // Submit form
    fireEvent.click(screen.getByText('Create Truck'))
    
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(expect.objectContaining({
        plate: 'AA1234BB'
      }))
    })
  })
})
```

## 🔧 Development Tools

### ESLint Configuration
Code quality is enforced with ESLint:

```javascript
// eslint.config.js
export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]
```

### TypeScript Configuration
TypeScript provides type safety:

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": [
    "resources/js/**/*"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

## 📱 Responsive Design

### Mobile-First Approach
The application uses a mobile-first responsive design:

```typescript
function ResponsiveLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile: Stack vertically */}
      <div className="md:hidden">
        <MobileHeader />
        <MobileNavigation />
        <main className="p-4">
          <Content />
        </main>
      </div>
      
      {/* Desktop: Sidebar layout */}
      <div className="hidden md:flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <Content />
        </main>
      </div>
    </div>
  )
}
```

### Breakpoint System
Tailwind CSS breakpoints are used consistently:

```css
/* Breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

## 🎯 Best Practices

### Component Design
1. **Single Responsibility**: Each component has one clear purpose
2. **Composition**: Build complex UIs from simple components
3. **Props Interface**: Define clear TypeScript interfaces
4. **Error Boundaries**: Handle errors gracefully
5. **Accessibility**: Follow WCAG guidelines

### State Management
1. **Local State**: Use React hooks for component state
2. **Form State**: Use Inertia.js useForm for forms
3. **Global State**: Use Inertia.js page props
4. **Caching**: Leverage Inertia.js caching

### Performance
1. **Memoization**: Use React.memo for expensive components
2. **Code Splitting**: Lazy load non-critical components
3. **Debouncing**: Debounce search and input handlers
4. **Optimistic Updates**: Update UI before server response

### Security
1. **Input Validation**: Validate all user inputs
2. **XSS Prevention**: Sanitize user-generated content
3. **CSRF Protection**: Use Laravel CSRF tokens
4. **Permission Checks**: Verify permissions on frontend

## 🚀 Deployment

### Build Process
The frontend is built with Vite:

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Environment Variables
Frontend environment variables:

```env
# .env
VITE_APP_NAME="TIMS"
VITE_APP_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000/api
```

### Asset Optimization
Vite automatically optimizes assets:
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Removes unused code
- **Minification**: Compresses JavaScript and CSS
- **Asset Hashing**: Cache busting for production

## 📚 Additional Resources

### Documentation Links
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Inertia.js Documentation](https://inertiajs.com/)
- [Vite Documentation](https://vitejs.dev/)

### Learning Resources
- [React Patterns](https://reactpatterns.com/)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
- [Tailwind CSS Best Practices](https://tailwindcss.com/docs/reusing-styles)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated**: October 21, 2025  
**Version**: 1.0.0  
**Status**: Production Ready
