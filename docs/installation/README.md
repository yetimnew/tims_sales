# Installation Documentation - TIMS

This directory contains step-by-step installation instructions for the Transport Information Management System (TIMS).

## 📚 Files in This Directory

- **[README.md](./README.md)** - This file: Complete installation and setup guide

## 📖 Overview

This document provides step-by-step installation instructions for the Transport Information Management System (TIMS).

## 📋 Prerequisites

### System Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **PHP**: 8.2 or higher
- **Node.js**: 20.19+ or 22.12+ (required for Vite)
- **Composer**: Latest version
- **MySQL**: 8.0 or higher (or SQLite for development)
- **Git**: Latest version
- **Web Server**: Apache 2.4+ or Nginx 1.18+ (for production)

### PHP Extensions Required
```bash
# Required PHP extensions
php-mbstring
php-xml
php-curl
php-zip
php-gd
php-mysql
php-pdo
php-tokenizer
php-fileinfo
php-openssl
php-json
php-bcmath
php-intl
php-xmlreader
php-xmlwriter
php-dom
php-simplexml
php-xsl
php-soap
php-ldap
php-imap
php-gmp
php-sqlite3
php-pdo_sqlite
php-redis
php-memcached
```

### Node.js Requirements
- **Node.js**: 20.19+ or 22.12+
- **npm**: 9.0+ (comes with Node.js)
- **Vite**: 5.0+ (installed via npm)

## 🚀 Installation Methods

### Method 1: Local Development (Recommended)

#### Step 1: Clone the Repository
```bash
# Clone the repository
git clone <repository-url>
cd react-starter-kit

# Verify the clone
ls -la
```

#### Step 2: Install Backend Dependencies
```bash
# Install PHP dependencies
composer install

# Verify installation
composer --version
php --version
```

#### Step 3: Install Frontend Dependencies
```bash
# Install Node.js dependencies
npm install

# Verify installation
npm --version
node --version
```

#### Step 4: Environment Configuration
```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Verify environment
cat .env
```

#### Step 5: Database Setup
```bash
# Option A: MySQL Database
mysql -u root -p
CREATE DATABASE tims_database;
CREATE USER 'tims_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON tims_database.* TO 'tims_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Option B: SQLite Database (for development)
touch database/database.sqlite
```

#### Step 6: Configure Environment Variables
Edit `.env` file:
```env
# Application
APP_NAME="Transport Information Management System"
APP_ENV=local
APP_KEY=base64:your-generated-key
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database Configuration
# For MySQL
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tims_database
DB_USERNAME=tims_user
DB_PASSWORD=secure_password

# For SQLite (development)
# DB_CONNECTION=sqlite
# DB_DATABASE=database/database.sqlite

# Cache & Session
CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync

# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

# Fortify Configuration
FORTIFY_FEATURES=registration,reset-passwords,email-verification,update-profile-information,update-passwords,two-factor-authentication
```

#### Step 7: Run Database Migrations
```bash
# Run migrations
php artisan migrate

# Verify migrations
php artisan migrate:status
```

#### Step 8: Seed Database
```bash
# Seed the database
php artisan db:seed

# Verify seeding
php artisan tinker
>>> App\Models\User::count()
>>> App\Models\Truck::count()
>>> App\Models\Driver::count()
>>> exit
```

#### Step 9: Build Frontend Assets
```bash
# Build for development
npm run dev

# Or build for production
npm run build
```

#### Step 10: Start Development Servers
```bash
# Terminal 1: Start Laravel backend
php artisan serve

# Terminal 2: Start Vite frontend (if using npm run dev)
npm run dev

# Verify installation
curl http://localhost:8000
```

### Method 2: Docker Installation

#### Step 1: Docker Setup
```bash
# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - .:/var/www/html
    environment:
      - APP_ENV=local
      - DB_HOST=mysql
      - DB_DATABASE=tims_database
      - DB_USERNAME=tims_user
      - DB_PASSWORD=secure_password
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: tims_database
      MYSQL_USER: tims_user
      MYSQL_PASSWORD: secure_password
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - .:/var/www/html
    depends_on:
      - app

volumes:
  mysql_data:
EOF
```

#### Step 2: Create Dockerfile
```bash
# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    nodejs \
    npm

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy existing application directory contents
COPY . /var/www/html

# Copy existing application directory permissions
COPY --chown=www-data:www-data . /var/www/html

# Install dependencies
RUN composer install --no-dev --optimize-autoloader
RUN npm ci && npm run build

# Change current user to www
USER www-data

# Expose port 8000 and start php-fpm server
EXPOSE 8000
CMD ["php-fpm"]
EOF
```

#### Step 3: Build and Run
```bash
# Build and start containers
docker-compose up -d --build

# Run migrations
docker-compose exec app php artisan migrate

# Seed database
docker-compose exec app php artisan db:seed

# Verify installation
curl http://localhost:8000
```

### Method 3: Production Installation

#### Step 1: Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx mysql-server php8.2-fpm php8.2-mysql php8.2-xml php8.2-mbstring php8.2-curl php8.2-zip php8.2-gd php8.2-bcmath php8.2-intl php8.2-redis nodejs npm git unzip

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install Node.js (if not available)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Step 2: Database Setup
```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
CREATE DATABASE tims_database;
CREATE USER 'tims_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON tims_database.* TO 'tims_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Step 3: Application Deployment
```bash
# Clone repository
git clone <repository-url> /var/www/tims
cd /var/www/tims

# Install dependencies
composer install --optimize-autoloader --no-dev
npm ci && npm run build

# Set permissions
sudo chown -R www-data:www-data /var/www/tims
sudo chmod -R 755 /var/www/tims
sudo chmod -R 775 /var/www/tims/storage
sudo chmod -R 775 /var/www/tims/bootstrap/cache
```

#### Step 4: Environment Configuration
```bash
# Copy environment file
cp .env.example .env

# Edit environment for production
sudo nano .env
```

Production `.env` configuration:
```env
# Application
APP_NAME="Transport Information Management System"
APP_ENV=production
APP_KEY=base64:your-generated-key
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tims_database
DB_USERNAME=tims_user
DB_PASSWORD=secure_password

# Cache & Session
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Mail
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-email
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@your-domain.com"
MAIL_FROM_NAME="${APP_NAME}"

# Logging
LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error
```

#### Step 5: Application Setup
```bash
# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Seed database
php artisan db:seed --force

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

#### Step 6: Nginx Configuration
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/tims
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/tims/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

#### Step 7: Enable Site
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/tims /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 8: SSL Certificate (Optional)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Configuration

### PHP Configuration
```bash
# Edit PHP configuration
sudo nano /etc/php/8.2/fpm/php.ini
```

Key PHP settings:
```ini
# Memory and execution
memory_limit = 256M
max_execution_time = 300
max_input_time = 300

# File uploads
upload_max_filesize = 50M
post_max_size = 50M
max_file_uploads = 20

# Error reporting
display_errors = Off
log_errors = On
error_log = /var/log/php_errors.log

# Session
session.gc_maxlifetime = 7200
session.cookie_lifetime = 0
```

### MySQL Configuration
```bash
# Edit MySQL configuration
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Key MySQL settings:
```ini
[mysqld]
# Performance
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Connections
max_connections = 200
max_user_connections = 190

# Query cache
query_cache_type = 1
query_cache_size = 64M
query_cache_limit = 2M

# Slow query log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

### Redis Configuration
```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf
```

Key Redis settings:
```ini
# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security
requirepass your_redis_password
```

## 🧪 Testing Installation

### Basic Functionality Test
```bash
# Test PHP
php -v
php -m | grep -E "(mysql|pdo|mbstring|xml|curl|zip|gd|bcmath|intl)"

# Test Composer
composer --version

# Test Node.js
node --version
npm --version

# Test MySQL
mysql -u tims_user -p -e "SELECT VERSION();"

# Test Redis
redis-cli ping
```

### Application Test
```bash
# Test Laravel
php artisan --version
php artisan route:list

# Test database connection
php artisan tinker
>>> DB::connection()->getPdo();
>>> exit

# Test frontend build
npm run build
ls -la public/build/

# Test web server
curl -I http://localhost:8000
```

### Performance Test
```bash
# Test database performance
php artisan tinker
>>> $start = microtime(true);
>>> App\Models\Truck::count();
>>> $end = microtime(true);
>>> echo "Query time: " . ($end - $start) . " seconds";
>>> exit

# Test memory usage
php -r "echo 'Memory limit: ' . ini_get('memory_limit') . PHP_EOL;"
```

## 🚨 Troubleshooting

### Common Issues

#### Issue 1: Composer Installation Fails
```bash
# Solution: Update Composer
composer self-update
composer clear-cache
composer install
```

#### Issue 2: Node.js Version Issues
```bash
# Solution: Use Node Version Manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20.19.0
nvm use 20.19.0
```

#### Issue 3: Database Connection Issues
```bash
# Solution: Check MySQL service
sudo systemctl status mysql
sudo systemctl start mysql

# Check database credentials
mysql -u tims_user -p -e "SELECT 1;"
```

#### Issue 4: Permission Issues
```bash
# Solution: Fix permissions
sudo chown -R www-data:www-data /var/www/tims
sudo chmod -R 755 /var/www/tims
sudo chmod -R 775 /var/www/tims/storage
sudo chmod -R 775 /var/www/tims/bootstrap/cache
```

#### Issue 5: Frontend Build Issues
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run build
```

### Log Files
```bash
# Laravel logs
tail -f storage/logs/laravel.log

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# PHP logs
tail -f /var/log/php_errors.log

# MySQL logs
tail -f /var/log/mysql/error.log
tail -f /var/log/mysql/slow.log
```

### Performance Issues
```bash
# Check system resources
htop
df -h
free -h

# Check database performance
mysql -u root -p -e "SHOW PROCESSLIST;"
mysql -u root -p -e "SHOW STATUS LIKE 'Slow_queries';"

# Check PHP-FPM status
sudo systemctl status php8.2-fpm
```

## 🔄 Updates and Maintenance

### Application Updates
```bash
# Backup database
mysqldump -u tims_user -p tims_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Update code
git pull origin main

# Update dependencies
composer install --optimize-autoloader --no-dev
npm ci && npm run build

# Run migrations
php artisan migrate --force

# Clear caches
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### System Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update PHP
sudo apt install php8.2-fpm php8.2-mysql php8.2-xml php8.2-mbstring

# Update Node.js
nvm install 20.19.0
nvm use 20.19.0

# Restart services
sudo systemctl restart nginx
sudo systemctl restart php8.2-fpm
sudo systemctl restart mysql
```

## 📚 Additional Resources

### Documentation Links
- [Laravel Installation](https://laravel.com/docs/installation)
- [Node.js Installation](https://nodejs.org/en/download/)
- [Composer Installation](https://getcomposer.org/download/)
- [MySQL Installation](https://dev.mysql.com/doc/mysql-installation-excerpt/8.0/en/)
- [Nginx Installation](https://nginx.org/en/linux_packages.html)

### Best Practices
- [Laravel Deployment](https://laravel.com/docs/deployment)
- [PHP Best Practices](https://phpbestpractices.org/)
- [MySQL Best Practices](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)
- [Nginx Best Practices](https://nginx.org/en/docs/beginners_guide.html)

---

**Last Updated**: October 21, 2025  
**Version**: 1.0.0  
**Status**: Production Ready
