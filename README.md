# Transport Information Management System (TIMS)

A comprehensive heavy truck management system built with Laravel 12, React 19, TypeScript, and modern web technologies.

## 🚀 Features

### Core Fleet Management
- **Truck Management**: Complete CRUD operations for fleet vehicles
- **Driver Management**: Driver profiles, assignments, and performance tracking
- **Vehicle Types**: Categorization and specifications management
- **Customer Management**: Client information and relationship tracking

### Advanced Operations
- **Performance Tracking**: Trip records, cargo volume, and distance monitoring
- **Maintenance Management**: Scheduled maintenance, service records, and cost tracking
- **Fuel Management**: Fuel consumption analysis, cost tracking, and efficiency monitoring
- **Driver Performance**: Safety scores, compliance tracking, and performance analytics
- **Cargo Management**: Cargo type categorization and handling requirements
- **Financial Management**: Revenue tracking, cost analysis, and profit/loss reporting
- **Route Planning**: Route optimization, distance calculation, and travel time estimation

### Geographic Management
- **Regional Hierarchy**: Regions, zones, woredas, and places management
- **Distance Tracking**: Inter-location distance records and route optimization
- **Place Management**: Geographic location database

### Reporting & Analytics
- **Comprehensive Reports**: Truck, driver, performance, operation, financial, and maintenance reports
- **Dashboard Analytics**: Key performance indicators and system overview
- **Performance Metrics**: Fleet utilization, driver performance, and cost analysis

### User Management & Security
- **User Authentication**: Secure login with Laravel Fortify
- **Two-Factor Authentication**: Enhanced security with 2FA support
- **Role-Based Access**: User roles and permissions management
- **Audit Logging**: Complete activity tracking and logging

## 🔧 Recent Fixes & Updates

### Layout & Responsive Design Fixes
- ✅ **Fixed dashboard full-screen display**: Updated `SidebarInset` height calculation from `min-h-screen` to `min-h-[calc(100vh-4rem)]` to properly account for header height
- ✅ **Fixed sidebar content overflow**: Added proper `overflow-y-auto` for scrollable content in sidebar layout
- ✅ **Fixed route references**: Updated all `dashboard()` route calls to use `.url` property for proper URL generation
- ✅ **Fixed avatar undefined errors**: Added conditional rendering for user avatars to prevent undefined property access
- ✅ **Fixed build errors**: Resolved missing controller imports and path issues in settings components

### Key Layout Improvements
- **Responsive Design**: Dashboard now displays correctly on all screen sizes (mobile, tablet, desktop)
- **Proper Scrolling**: Content scrolls properly when exceeding viewport height
- **No JavaScript Errors**: All console errors resolved
- **Build Stability**: Clean builds without errors or warnings

## 🛠️ Technology Stack

### Backend
- **Laravel 12**: PHP framework with modern features
- **MySQL/SQLite**: Database management
- **Laravel Fortify**: Authentication and security
- **Laravel Wayfinder**: Route generation and management
- **Inertia.js**: Seamless SPA experience

### Frontend
- **React 19**: Modern React with latest features
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern UI component library
- **Radix UI**: Accessible UI primitives
- **Vite**: Fast build tool and development server

### Development Tools
- **PHPUnit**: Comprehensive testing framework
- **ESLint**: Code linting and quality assurance
- **Prettier**: Code formatting
- **Git**: Version control

## 📋 Prerequisites

- **PHP**: 8.2 or higher
- **Node.js**: 20.19+ or 22.12+ (required for Vite)
- **Composer**: Latest version
- **MySQL**: 8.0 or higher (or SQLite for development)
- **Git**: Latest version

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd react-starter-kit
```

### 2. Install Backend Dependencies
```bash
composer install
```

### 3. Install Frontend Dependencies
```bash
npm install
```

### 4. Environment Configuration
```bash
cp .env.example .env
php artisan key:generate
```

### 5. Database Setup
```bash
# Create database (MySQL)
mysql -u root -p
CREATE DATABASE tims_database;

# Or use SQLite for development
touch database/database.sqlite
```

### 6. Configure Environment Variables
Edit `.env` file:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tims_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Or for SQLite
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
```

### 7. Run Migrations
```bash
php artisan migrate
```

### 8. Seed Database (Optional)
```bash
php artisan db:seed
```

### 9. Start Development Servers
```bash
# Terminal 1: Laravel backend
php artisan serve

# Terminal 2: Vite frontend
npm run dev
```

## 🧪 Testing

### Run All Tests
```bash
php artisan test
```

### Run Specific Test Suites
```bash
# Feature tests
php artisan test --testsuite=Feature

# Unit tests
php artisan test --testsuite=Unit

# Specific test file
php artisan test tests/Feature/TimsSystemTest.php
```

### Test Coverage
```bash
php artisan test --coverage
```

## 📁 Project Structure

```
react-starter-kit/
├── app/
│   ├── Http/
│   │   ├── Controllers/          # API Controllers
│   │   ├── Middleware/          # Custom middleware
│   │   └── Requests/            # Form request validation
│   ├── Models/                  # Eloquent models
│   ├── Services/                # Business logic services
│   └── Exceptions/              # Custom exceptions
├── database/
│   ├── migrations/              # Database migrations
│   ├── factories/               # Model factories
│   └── seeders/                 # Database seeders
├── resources/
│   ├── js/
│   │   ├── components/          # React components
│   │   ├── layouts/             # Page layouts
│   │   ├── pages/               # Inertia pages
│   │   ├── hooks/               # Custom React hooks
│   │   └── lib/                 # Utility functions
│   └── css/                     # Stylesheets
├── routes/
│   ├── web.php                  # Web routes
│   └── api.php                  # API routes
├── tests/
│   ├── Feature/                 # Feature tests
│   └── Unit/                    # Unit tests
└── public/                      # Public assets
```

## 🔧 Configuration

### Database Configuration
The system supports both MySQL and SQLite databases. For production, use MySQL with proper indexing for optimal performance.

### Authentication
Laravel Fortify handles authentication with support for:
- Email/password login
- Two-factor authentication
- Password reset
- Email verification

### Rate Limiting
API endpoints are protected with rate limiting:
- Trucks: 60 requests per minute
- Other endpoints: Default Laravel limits

## 📊 Database Schema

### Core Tables
- `vehicletypes`: Vehicle type definitions
- `trucks`: Fleet vehicle information
- `drivers`: Driver profiles and information
- `customers`: Client information
- `operations`: Transport operations
- `performances`: Trip performance records

### Advanced Features
- `maintenance_types`: Maintenance category definitions
- `vehicle_maintenance_records`: Maintenance history
- `fuel_records`: Fuel consumption tracking
- `driver_performance_records`: Driver performance metrics
- `cargo_types`: Cargo categorization
- `truck_financial_records`: Financial tracking
- `route_plans`: Route planning and optimization

### Geographic Hierarchy
- `regions`: Regional divisions
- `zones`: Zone subdivisions
- `woredas`: Woreda divisions
- `places`: Specific locations
- `distances`: Inter-location distances

## 🚀 Deployment

### Production Deployment
1. **Server Requirements**:
   - PHP 8.2+
   - MySQL 8.0+
   - Node.js 20.19+
   - Nginx/Apache

2. **Deployment Steps**:
   ```bash
   # Install dependencies
   composer install --optimize-autoloader --no-dev
   npm ci && npm run build
   
   # Configure environment
   cp .env.example .env
   # Edit .env with production values
   
   # Run migrations
   php artisan migrate --force
   
   # Cache configuration
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

3. **Web Server Configuration**:
   - Point document root to `public/` directory
   - Configure URL rewriting for Laravel
   - Set up SSL certificates

### Docker Deployment (Optional)
```dockerfile
# Dockerfile example
FROM php:8.2-fpm
# ... additional configuration
```

## 🔒 Security Features

- **CSRF Protection**: All forms protected against CSRF attacks
- **SQL Injection Prevention**: Eloquent ORM with parameterized queries
- **XSS Protection**: Input sanitization and output escaping
- **Rate Limiting**: API endpoint protection
- **Two-Factor Authentication**: Enhanced login security
- **Audit Logging**: Complete activity tracking

## 📈 Performance Optimization

### Database Optimization
- **Indexes**: Strategic database indexes for fast queries
- **Query Optimization**: Efficient Eloquent relationships
- **Caching**: Laravel caching for frequently accessed data

### Frontend Optimization
- **Code Splitting**: Vite automatic code splitting
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Minified CSS and JavaScript

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards
- **PHP**: Follow PSR-12 coding standards
- **JavaScript/TypeScript**: Use ESLint and Prettier
- **Testing**: Maintain test coverage above 80%

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Laravel Documentation](https://laravel.com/docs)
- [React Documentation](https://react.dev/)
- [Inertia.js Documentation](https://inertiajs.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Issues
- Report bugs via [GitHub Issues](https://github.com/your-repo/issues)
- Request features via [GitHub Discussions](https://github.com/your-repo/discussions)

### Community
- Join our community discussions
- Follow updates on social media
- Contribute to the project

## 🎯 Roadmap

### Phase 1: Core System ✅
- [x] Basic fleet management
- [x] Driver management
- [x] Customer management
- [x] Performance tracking

### Phase 2: Advanced Features ✅
- [x] Maintenance management
- [x] Fuel tracking
- [x] Driver performance analytics
- [x] Cargo management

### Phase 3: Financial & Planning ✅
- [x] Financial tracking
- [x] Route planning
- [x] Advanced reporting
- [x] Dashboard analytics

### Phase 4: Future Enhancements
- [ ] GPS tracking integration
- [ ] Mobile application
- [ ] API for third-party integrations
- [ ] Advanced analytics and AI insights
- [ ] Multi-tenant support
- [ ] Advanced workflow automation

## 🙏 Acknowledgments

- **Laravel Team**: For the amazing PHP framework
- **React Team**: For the powerful frontend library
- **Tailwind CSS**: For the utility-first CSS framework
- **shadcn/ui**: For the beautiful UI components
- **Inertia.js**: For seamless SPA experience

---

**Built with ❤️ for efficient transport management**
