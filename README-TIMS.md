# Transport Information Management System (TIMS)

A modern Laravel + React application for managing heavy truck operations, built with the latest technologies.

## 🚀 Tech Stack

- **Backend**: Laravel 12 with PHP 8.3+
- **Frontend**: React 19 with TypeScript
- **UI Framework**: Tailwind CSS + shadcn/ui + Radix UI
- **Authentication**: Laravel Fortify with 2FA support
- **Routing**: Inertia.js for seamless SPA experience
- **Build Tool**: Vite with Laravel Wayfinder
- **Database**: MySQL/PostgreSQL with Eloquent ORM

## 📋 Features

### Fleet Management
- **Truck Management**: Complete truck lifecycle management
- **Driver Management**: Driver profiles and assignments
- **Vehicle Types**: Categorize different vehicle types
- **Driver-Truck Assignments**: Flexible assignment system

### Operations
- **Operation Management**: Contract and operation tracking
- **Performance Tracking**: Trip performance monitoring
- **Customer Management**: Customer profiles and relationships
- **Trip Management**: Detailed trip recording and tracking

### Geographic Management
- **Regions**: Geographic region management
- **Zones**: Zone-based organization
- **Woredas**: Administrative divisions
- **Places**: Specific location management
- **Distance Matrix**: Distance calculations between locations

### Status Management
- **Status Types**: Categorize different status types
- **Status Tracking**: Monitor various statuses

### Outsourcing
- **Outsource Providers**: Manage external service providers
- **Outsource Performance**: Track outsourced operations

### Reporting
- **Truck Reports**: Fleet performance reports
- **Driver Reports**: Driver performance analysis
- **Performance Reports**: Trip performance analytics
- **Operation Reports**: Operation summaries
- **Financial Reports**: Cost and revenue analysis
- **Maintenance Reports**: Vehicle maintenance tracking

### User Management
- **User Management**: System user administration
- **Role Management**: Role-based access control
- **Permission Management**: Granular permission system

## 🗄️ Database Schema

The system includes the following main entities:

- `vehecletypes` - Vehicle type definitions
- `trucks` - Truck fleet management
- `drivers` - Driver profiles
- `driver_truck` - Driver-truck assignments
- `customers` - Customer management
- `regions` - Geographic regions
- `zones` - Administrative zones
- `woredas` - Administrative divisions
- `places` - Specific locations
- `operations` - Operation contracts
- `performances` - Trip performance records
- `statustypes` - Status type definitions
- `statuses` - Status records
- `distances` - Distance matrix
- `outsources` - Outsource providers
- `outsource_performances` - Outsource performance tracking
- `profiles` - User profiles

## 🚀 Getting Started

### Prerequisites
- PHP 8.3+
- Node.js 18+
- Composer
- MySQL/PostgreSQL

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd react-starter-kit
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

4. **Environment setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Database setup**
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

6. **Build assets**
   ```bash
   npm run build
   ```

7. **Start development servers**
   ```bash
   # Terminal 1 - Laravel
   php artisan serve
   
   # Terminal 2 - Vite
   npm run dev
   ```

## 📁 Project Structure

```
├── app/
│   ├── Http/Controllers/     # Laravel controllers
│   ├── Models/               # Eloquent models
│   └── Providers/            # Service providers
├── database/
│   ├── migrations/           # Database migrations
│   └── seeders/             # Database seeders
├── resources/
│   ├── js/
│   │   ├── components/       # React components
│   │   ├── layouts/         # Layout components
│   │   ├── pages/           # Page components
│   │   └── types/           # TypeScript types
│   └── css/                 # Stylesheets
├── routes/
│   ├── web.php              # Web routes
│   └── settings.php         # Settings routes
└── public/                  # Public assets
```

## 🔧 Configuration

### Environment Variables

Key environment variables for TIMS:

```env
APP_NAME="Transport Information Management System"
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tims
DB_USERNAME=root
DB_PASSWORD=

# Fortify Configuration
FORTIFY_FEATURES=registration,reset-passwords,email-verification,update-profile-information,update-passwords,two-factor-authentication
```

### Vite Configuration

The project uses Vite with Laravel Wayfinder for automatic route generation:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import wayfinder from '@laravel/vite-plugin-wayfinder';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        wayfinder(),
    ],
});
```

## 🎨 UI Components

The system uses shadcn/ui components with Radix UI primitives:

- **Cards**: For displaying information
- **Buttons**: Various button styles and sizes
- **Forms**: Input fields, selects, and form validation
- **Navigation**: Sidebar navigation with collapsible menus
- **Tables**: Data tables with sorting and pagination
- **Modals**: Dialog boxes for forms and confirmations
- **Charts**: Data visualization components

## 🔐 Authentication & Authorization

- **Laravel Fortify**: Complete authentication system
- **Two-Factor Authentication**: Enhanced security
- **Role-Based Access Control**: Granular permissions
- **Session Management**: Secure session handling

## 📊 Dashboard Features

The dashboard provides:

- **Key Metrics**: Fleet, driver, and operation statistics
- **Performance Overview**: Trip performance summaries
- **Recent Activity**: Latest trip performances
- **Status Breakdown**: Performance status analysis
- **Quick Actions**: Fast access to common tasks

## 🚛 Fleet Management

### Truck Management
- Add, edit, and delete trucks
- Track vehicle specifications
- Monitor service intervals
- Manage vehicle status

### Driver Management
- Driver profiles and information
- Assignment tracking
- Performance monitoring
- Status management

### Assignment System
- Flexible driver-truck assignments
- Assignment history
- Status tracking
- Performance correlation

## 📈 Performance Tracking

### Trip Performance
- Detailed trip recording
- Cargo volume tracking
- Distance calculations
- Fuel consumption monitoring
- Cost tracking

### Performance Analytics
- Performance reports
- Trend analysis
- Comparative metrics
- Performance summaries

## 🌍 Geographic Management

### Location Hierarchy
- Regions → Zones → Woredas → Places
- Distance matrix management
- Route optimization
- Geographic reporting

### Distance Management
- Distance calculations
- Route information
- Travel time estimates
- Cost calculations

## 📋 Operations Management

### Operation Contracts
- Contract management
- Customer relationships
- Volume tracking
- Tariff management

### Performance Correlation
- Operation-performance linking
- Customer performance analysis
- Contract fulfillment tracking

## 🔄 Outsourcing

### Provider Management
- Outsource provider profiles
- Service type categorization
- Performance tracking
- Cost management

### Performance Monitoring
- Outsource performance records
- Quality tracking
- Cost analysis
- Provider comparison

## 📊 Reporting System

### Report Types
- **Fleet Reports**: Truck and driver performance
- **Performance Reports**: Trip and operation analysis
- **Financial Reports**: Cost and revenue analysis
- **Maintenance Reports**: Service and maintenance tracking

### Report Features
- Exportable formats (PDF, Excel)
- Scheduled reports
- Custom date ranges
- Filtering options

## 🛠️ Development

### Code Style
- **PHP**: Laravel coding standards
- **TypeScript**: Strict type checking
- **React**: Functional components with hooks
- **CSS**: Tailwind CSS utility classes

### Testing
- **PHPUnit**: Backend testing
- **Jest**: Frontend testing
- **Feature Tests**: End-to-end testing
- **Unit Tests**: Component testing

### Deployment
- **Production Build**: `npm run build`
- **Asset Optimization**: Automatic optimization
- **Environment Configuration**: Production settings
- **Database Migration**: Safe deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code examples

## 🔮 Future Enhancements

- **Mobile App**: React Native mobile application
- **API Integration**: RESTful API for external integrations
- **Advanced Analytics**: Machine learning insights
- **IoT Integration**: Real-time vehicle monitoring
- **Blockchain**: Secure transaction recording

---

**Transport Information Management System** - Modernizing fleet operations with cutting-edge technology.

