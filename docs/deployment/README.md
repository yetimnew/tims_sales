# Deployment Documentation - TIMS

This directory contains comprehensive deployment instructions for the Transport Information Management System (TIMS).

## 📚 Files in This Directory

- **[README.md](./README.md)** - This file: Complete production deployment guide

## 📖 Overview

This document provides comprehensive deployment instructions for the Transport Information Management System (TIMS).

## 📋 Table of Contents

1. [Production Environment Setup](#1-production-environment-setup)
2. [Server Requirements](#2-server-requirements)
3. [Application Deployment](#3-application-deployment)
4. [Database Setup](#4-database-setup)
5. [Web Server Configuration](#5-web-server-configuration)
6. [SSL Certificate Setup](#6-ssl-certificate-setup)
7. [Environment Configuration](#7-environment-configuration)
8. [Performance Optimization](#8-performance-optimization)
9. [Monitoring and Logging](#9-monitoring-and-logging)
10. [Backup Strategy](#10-backup-strategy)
11. [Security Hardening](#11-security-hardening)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Production Environment Setup

### 1.1 Server Architecture

#### Recommended Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                           │
│                  (Nginx/HAProxy)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Web Servers                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Nginx     │  │   Nginx     │  │   Nginx     │        │
│  │   PHP-FPM   │  │   PHP-FPM   │  │   PHP-FPM   │        │
│  │   Laravel   │  │   Laravel   │  │   Laravel   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Cluster                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   MySQL     │  │   MySQL     │  │   MySQL     │        │
│  │  Primary    │  │  Secondary  │  │  Secondary  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cache Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Redis     │  │   Redis     │  │   Redis     │        │
│  │   Cache     │  │   Session   │  │   Queue     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Single Server Setup

#### Minimal Production Setup
```
┌─────────────────────────────────────────────────────────────┐
│                    Single Server                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Nginx     │  │   PHP-FPM   │  │   MySQL     │        │
│  │   Web       │  │   Laravel   │  │   Database  │        │
│  │   Server    │  │   App       │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 2. Server Requirements

### 2.1 Hardware Requirements

#### Minimum Requirements
- **CPU**: 2 cores, 2.4GHz
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **Network**: 100Mbps

#### Recommended Requirements
- **CPU**: 4 cores, 3.0GHz
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Network**: 1Gbps

#### High-Performance Requirements
- **CPU**: 8 cores, 3.5GHz
- **RAM**: 16GB
- **Storage**: 200GB SSD
- **Network**: 10Gbps

### 2.2 Software Requirements

#### Operating System
- **Ubuntu**: 20.04 LTS or 22.04 LTS
- **CentOS**: 8 or 9
- **RHEL**: 8 or 9
- **Debian**: 11 or 12

#### Required Software
- **PHP**: 8.2 or higher
- **MySQL**: 8.0 or higher
- **Nginx**: 1.18 or higher
- **Node.js**: 20.19+ or 22.12+
- **Composer**: Latest stable version
- **Redis**: 6.0 or higher (optional)

## 3. Application Deployment

### 3.1 Manual Deployment

#### Step 1: Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx mysql-server php8.2-fpm php8.2-mysql php8.2-xml php8.2-mbstring php8.2-curl php8.2-zip php8.2-gd php8.2-cli php8.2-common php8.2-bcmath php8.2-intl php8.2-readline php8.2-soap php8.2-sqlite3 php8.2-xmlrpc php8.2-xsl php8.2-zip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

#### Step 2: Application Setup
```bash
# Create application directory
sudo mkdir -p /var/www/tims
sudo chown -R www-data:www-data /var/www/tims

# Clone repository
cd /var/www/tims
sudo -u www-data git clone https://github.com/your-org/tims.git .

# Install dependencies
sudo -u www-data composer install --no-dev --optimize-autoloader
sudo -u www-data npm ci && sudo -u www-data npm run build

# Set permissions
sudo chown -R www-data:www-data /var/www/tims
sudo chmod -R 755 /var/www/tims
sudo chmod -R 775 /var/www/tims/storage
sudo chmod -R 775 /var/www/tims/bootstrap/cache
```

#### Step 3: Environment Configuration
```bash
# Copy environment file
sudo -u www-data cp .env.example .env

# Generate application key
sudo -u www-data php artisan key:generate

# Configure environment
sudo nano /var/www/tims/.env
```

#### Step 4: Database Setup
```bash
# Create database
sudo mysql -e "CREATE DATABASE tims_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'tims_user'@'localhost' IDENTIFIED BY 'secure_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON tims_production.* TO 'tims_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Run migrations
sudo -u www-data php artisan migrate --force

# Seed database
sudo -u www-data php artisan db:seed --force
```

#### Step 5: Application Optimization
```bash
# Cache configuration
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache

# Optimize autoloader
sudo -u www-data composer dump-autoload --optimize
```

### 3.2 Automated Deployment

#### Deployment Script
```bash
#!/bin/bash
# deploy.sh

set -e

# Configuration
APP_DIR="/var/www/tims"
BACKUP_DIR="/var/backups/tims"
REPO_URL="https://github.com/your-org/tims.git"
BRANCH="main"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root"
fi

# Check if application directory exists
if [ ! -d "$APP_DIR" ]; then
    error "Application directory $APP_DIR does not exist"
fi

# Create backup
log "Creating backup..."
BACKUP_NAME="tims_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$APP_DIR" .

# Navigate to application directory
cd "$APP_DIR"

# Pull latest code
log "Pulling latest code..."
git fetch origin
git reset --hard origin/$BRANCH

# Install dependencies
log "Installing dependencies..."
composer install --no-dev --optimize-autoloader
npm ci && npm run build

# Run migrations
log "Running migrations..."
php artisan migrate --force

# Cache optimization
log "Optimizing application..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
log "Setting permissions..."
sudo chown -R www-data:www-data "$APP_DIR"
sudo chmod -R 755 "$APP_DIR"
sudo chmod -R 775 "$APP_DIR/storage"
sudo chmod -R 775 "$APP_DIR/bootstrap/cache"

# Restart services
log "Restarting services..."
sudo systemctl reload nginx
sudo systemctl restart php8.2-fpm

log "Deployment completed successfully!"
```

#### Make Script Executable
```bash
chmod +x deploy.sh
```

#### Run Deployment
```bash
./deploy.sh
```

### 3.3 Docker Deployment

#### Dockerfile
```dockerfile
# Dockerfile
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

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy application
COPY . .

# Install dependencies
RUN composer install --no-dev --optimize-autoloader
RUN npm ci && npm run build

# Set permissions
RUN chown -R www-data:www-data /var/www
RUN chmod -R 755 /var/www
RUN chmod -R 775 /var/www/storage
RUN chmod -R 775 /var/www/bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    container_name: tims_app
    restart: unless-stopped
    working_dir: /var/www
    volumes:
      - ./:/var/www
      - ./docker/php/local.ini:/usr/local/etc/php/conf.d/local.ini
    networks:
      - tims

  nginx:
    image: nginx:alpine
    container_name: tims_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./:/var/www
      - ./docker/nginx/conf.d/:/etc/nginx/conf.d/
    depends_on:
      - app
    networks:
      - tims

  db:
    image: mysql:8.0
    container_name: tims_db
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: tims_production
      MYSQL_USER: tims_user
      MYSQL_PASSWORD: secure_password
      MYSQL_ROOT_PASSWORD: root_password
    volumes:
      - db_data:/var/lib/mysql
      - ./docker/mysql/my.cnf:/etc/mysql/my.cnf
    ports:
      - "3306:3306"
    networks:
      - tims

  redis:
    image: redis:alpine
    container_name: tims_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    networks:
      - tims

volumes:
  db_data:

networks:
  tims:
    driver: bridge
```

#### Deploy with Docker
```bash
# Build and start containers
docker-compose up -d --build

# Run migrations
docker-compose exec app php artisan migrate --force

# Seed database
docker-compose exec app php artisan db:seed --force

# Cache optimization
docker-compose exec app php artisan config:cache
docker-compose exec app php artisan route:cache
docker-compose exec app php artisan view:cache
```

## 4. Database Setup

### 4.1 MySQL Configuration

#### MySQL Configuration File
```ini
# /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
# Basic settings
user = mysql
pid-file = /var/run/mysqld/mysqld.pid
socket = /var/run/mysqld/mysqld.sock
port = 3306
basedir = /usr
datadir = /var/lib/mysql
tmpdir = /tmp
lc-messages-dir = /usr/share/mysql

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# InnoDB settings
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Query cache
query_cache_type = 1
query_cache_size = 64M
query_cache_limit = 2M

# Connection settings
max_connections = 200
max_connect_errors = 10
wait_timeout = 28800
interactive_timeout = 28800

# Logging
log-error = /var/log/mysql/error.log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# Security
local-infile = 0
```

#### Database Creation
```sql
-- Create database
CREATE DATABASE tims_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'tims_user'@'localhost' IDENTIFIED BY 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON tims_production.* TO 'tims_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;
```

### 4.2 Database Optimization

#### Index Optimization
```sql
-- Add indexes for better performance
ALTER TABLE trucks ADD INDEX idx_trucks_plate (plate);
ALTER TABLE trucks ADD INDEX idx_trucks_status (status);
ALTER TABLE trucks ADD INDEX idx_trucks_created_at (created_at);

ALTER TABLE drivers ADD INDEX idx_drivers_name (name);
ALTER TABLE drivers ADD INDEX idx_drivers_status (status);
ALTER TABLE drivers ADD INDEX idx_drivers_hireddate (hireddate);

ALTER TABLE performances ADD INDEX idx_performances_DateDispach (DateDispach);
ALTER TABLE performances ADD INDEX idx_performances_satus (satus);
```

#### Query Optimization
```sql
-- Analyze tables
ANALYZE TABLE trucks;
ANALYZE TABLE drivers;
ANALYZE TABLE performances;

-- Optimize tables
OPTIMIZE TABLE trucks;
OPTIMIZE TABLE drivers;
OPTIMIZE TABLE performances;
```

## 5. Web Server Configuration

### 5.1 Nginx Configuration

#### Main Configuration
```nginx
# /etc/nginx/nginx.conf
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # MIME types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # Include site configurations
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

#### Site Configuration
```nginx
# /etc/nginx/sites-available/tims
server {
    listen 80;
    server_name tims.example.com;
    root /var/www/tims/public;
    index index.php index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Rate limiting
    limit_req zone=login burst=5 nodelay;
    limit_req zone=api burst=20 nodelay;

    # Main location
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP processing
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Static files
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ /(storage|bootstrap/cache) {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Deny access to PHP files in public directory
    location ~ \.php$ {
        return 404;
    }
}
```

#### Enable Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/tims /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 5.2 PHP-FPM Configuration

#### PHP-FPM Pool Configuration
```ini
# /etc/php/8.2/fpm/pool.d/tims.conf
[tims]
user = www-data
group = www-data
listen = /var/run/php/php8.2-fpm-tims.sock
listen.owner = www-data
listen.group = www-data
listen.mode = 0660

pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
pm.max_requests = 500

; Logging
php_admin_value[error_log] = /var/log/php8.2-fpm-tims.log
php_admin_flag[log_errors] = on

; Performance
php_value[max_execution_time] = 300
php_value[max_input_time] = 300
php_value[memory_limit] = 256M
php_value[post_max_size] = 100M
php_value[upload_max_filesize] = 100M

; Security
php_value[expose_php] = Off
php_value[allow_url_fopen] = Off
php_value[allow_url_include] = Off
```

#### PHP Configuration
```ini
# /etc/php/8.2/fpm/php.ini
[PHP]
engine = On
short_open_tag = Off
precision = 14
output_buffering = 4096
zlib.output_compression = Off
implicit_flush = Off
unserialize_callback_func =
serialize_precision = -1
disable_functions =
disable_classes =
zend.enable_gc = On

; Resource Limits
max_execution_time = 300
max_input_time = 300
memory_limit = 256M

; Error handling and logging
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
display_errors = Off
display_startup_errors = Off
log_errors = On
log_errors_max_len = 1024
ignore_repeated_errors = Off
ignore_repeated_source = Off
report_memleaks = On

; Data Handling
variables_order = "GPCS"
request_order = "GP"
register_argc_argv = Off
auto_globals_jit = On
post_max_size = 100M
auto_prepend_file =
auto_append_file =
default_mimetype = "text/html"
default_charset = "UTF-8"

; File Uploads
file_uploads = On
upload_max_filesize = 100M
max_file_uploads = 20

; Fopen wrappers
allow_url_fopen = Off
allow_url_include = Off
default_socket_timeout = 60

; Dynamic Extensions
extension=pdo_mysql
extension=mbstring
extension=curl
extension=zip
extension=gd
extension=bcmath
extension=intl
extension=soap
extension=sqlite3
extension=xmlrpc
extension=xsl
extension=zip
```

## 6. SSL Certificate Setup

### 6.1 Let's Encrypt SSL

#### Install Certbot
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d tims.example.com

# Test automatic renewal
sudo certbot renew --dry-run
```

#### Auto-renewal Setup
```bash
# Add cron job for auto-renewal
sudo crontab -e

# Add this line
0 12 * * * /usr/bin/certbot renew --quiet
```

### 6.2 SSL Configuration

#### Nginx SSL Configuration
```nginx
# /etc/nginx/sites-available/tims
server {
    listen 80;
    server_name tims.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tims.example.com;
    root /var/www/tims/public;
    index index.php index.html;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/tims.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tims.example.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/tims.example.com/chain.pem;

    # SSL security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Main location
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP processing
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Static files
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}
```

## 7. Environment Configuration

### 7.1 Production Environment

#### Environment Variables
```env
# .env (Production)
APP_NAME=TIMS
APP_ENV=production
APP_KEY=base64:your-generated-key
APP_DEBUG=false
APP_URL=https://tims.example.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tims_production
DB_USERNAME=tims_user
DB_PASSWORD=secure_password

# Cache
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=noreply@example.com
MAIL_PASSWORD=mail_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="${APP_NAME}"

# Logging
LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

# Session
SESSION_DRIVER=redis
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

# Broadcasting
BROADCAST_DRIVER=log
PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1

# Telescope (Development only)
TELESCOPE_ENABLED=false
```

### 7.2 Environment Security

#### File Permissions
```bash
# Set secure permissions
chmod 600 /var/www/tims/.env
chown www-data:www-data /var/www/tims/.env

# Remove write permissions from web root
chmod -R 755 /var/www/tims/public
chmod -R 775 /var/www/tims/storage
chmod -R 775 /var/www/tims/bootstrap/cache
```

#### Environment Validation
```bash
# Validate environment
php artisan env:validate

# Check configuration
php artisan config:show
```

## 8. Performance Optimization

### 8.1 Application Optimization

#### Laravel Optimization
```bash
# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Optimize autoloader
composer dump-autoload --optimize

# Clear caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

#### OPcache Configuration
```ini
# /etc/php/8.2/fpm/conf.d/10-opcache.ini
[opcache]
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=4000
opcache.revalidate_freq=2
opcache.fast_shutdown=1
opcache.enable_cli=1
```

### 8.2 Database Optimization

#### MySQL Optimization
```sql
-- Analyze tables
ANALYZE TABLE trucks;
ANALYZE TABLE drivers;
ANALYZE TABLE performances;

-- Optimize tables
OPTIMIZE TABLE trucks;
OPTIMIZE TABLE drivers;
OPTIMIZE TABLE performances;

-- Check table status
SHOW TABLE STATUS LIKE 'trucks';
SHOW TABLE STATUS LIKE 'drivers';
SHOW TABLE STATUS LIKE 'performances';
```

#### Query Optimization
```php
// Use eager loading
$trucks = Truck::with(['vehicletype', 'maintenanceRecords'])
    ->paginate(15);

// Use specific columns
$trucks = Truck::select(['id', 'plate', 'status'])
    ->where('status', 'active')
    ->get();

// Use database indexes
Schema::table('trucks', function (Blueprint $table) {
    $table->index('plate');
    $table->index('status');
    $table->index('created_at');
});
```

### 8.3 Caching Strategy

#### Redis Configuration
```conf
# /etc/redis/redis.conf
# Basic settings
bind 127.0.0.1
port 6379
timeout 0
tcp-keepalive 300

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log

# Security
requirepass your_redis_password
```

#### Application Caching
```php
// Model caching
$trucks = Cache::remember('trucks.active', 3600, function () {
    return Truck::where('status', 'active')->get();
});

// Query result caching
$trucks = Truck::where('status', 'active')
    ->remember(3600)
    ->get();

// Cache tags
Cache::tags(['trucks', 'active'])->put('trucks.active', $trucks, 3600);
```

## 9. Monitoring and Logging

### 9.1 Application Monitoring

#### Laravel Logging
```php
// Custom logging
Log::info('User created truck', ['truck_id' => $truck->id]);
Log::error('Failed to create truck', ['error' => $e->getMessage()]);
Log::debug('Debug information', ['data' => $data]);

// Log channels
'channels' => [
    'stack' => [
        'driver' => 'stack',
        'channels' => ['single', 'daily'],
        'ignore_exceptions' => false,
    ],
    'single' => [
        'driver' => 'single',
        'path' => storage_path('logs/laravel.log'),
        'level' => env('LOG_LEVEL', 'debug'),
    ],
    'daily' => [
        'driver' => 'daily',
        'path' => storage_path('logs/laravel.log'),
        'level' => env('LOG_LEVEL', 'debug'),
        'days' => 14,
    ],
],
```

#### Log Rotation
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/tims

# Add configuration
/var/www/tims/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        /bin/kill -USR1 `cat /var/run/nginx.pid 2>/dev/null` 2>/dev/null || true
    endscript
}
```

### 9.2 System Monitoring

#### System Monitoring Script
```bash
#!/bin/bash
# monitor.sh

# Check disk space
DISK_USAGE=$(df -h /var/www/tims | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "WARNING: Disk usage is ${DISK_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.2f%%", $3*100/$2}')
echo "Memory usage: $MEMORY_USAGE"

# Check CPU usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
echo "CPU usage: $CPU_USAGE%"

# Check MySQL status
systemctl is-active --quiet mysql && echo "MySQL: Running" || echo "MySQL: Stopped"

# Check Nginx status
systemctl is-active --quiet nginx && echo "Nginx: Running" || echo "Nginx: Stopped"

# Check PHP-FPM status
systemctl is-active --quiet php8.2-fpm && echo "PHP-FPM: Running" || echo "PHP-FPM: Stopped"
```

#### Cron Job for Monitoring
```bash
# Add to crontab
sudo crontab -e

# Add this line
*/5 * * * * /path/to/monitor.sh >> /var/log/tims-monitor.log
```

## 10. Backup Strategy

### 10.1 Database Backup

#### Automated Database Backup
```bash
#!/bin/bash
# backup-db.sh

# Configuration
DB_NAME="tims_production"
DB_USER="tims_user"
DB_PASS="secure_password"
BACKUP_DIR="/var/backups/tims/database"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create database backup
mysqldump -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" | gzip > "$BACKUP_DIR/tims_db_$DATE.sql.gz"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "tims_db_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: tims_db_$DATE.sql.gz"
```

#### Backup Cron Job
```bash
# Add to crontab
sudo crontab -e

# Add this line (daily backup at 2 AM)
0 2 * * * /path/to/backup-db.sh
```

### 10.2 Application Backup

#### Application Files Backup
```bash
#!/bin/bash
# backup-app.sh

# Configuration
APP_DIR="/var/www/tims"
BACKUP_DIR="/var/backups/tims/application"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create application backup (exclude storage and cache)
tar -czf "$BACKUP_DIR/tims_app_$DATE.tar.gz" \
    --exclude="$APP_DIR/storage/logs" \
    --exclude="$APP_DIR/storage/framework/cache" \
    --exclude="$APP_DIR/storage/framework/sessions" \
    --exclude="$APP_DIR/storage/framework/views" \
    --exclude="$APP_DIR/bootstrap/cache" \
    --exclude="$APP_DIR/node_modules" \
    --exclude="$APP_DIR/vendor" \
    -C "$APP_DIR" .

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "tims_app_*.tar.gz" -mtime +7 -delete

echo "Application backup completed: tims_app_$DATE.tar.gz"
```

### 10.3 Backup Restoration

#### Database Restoration
```bash
#!/bin/bash
# restore-db.sh

# Configuration
DB_NAME="tims_production"
DB_USER="tims_user"
DB_PASS="secure_password"
BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# Restore database
gunzip -c "$BACKUP_FILE" | mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME"

echo "Database restored from: $BACKUP_FILE"
```

#### Application Restoration
```bash
#!/bin/bash
# restore-app.sh

# Configuration
APP_DIR="/var/www/tims"
BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# Stop services
sudo systemctl stop nginx
sudo systemctl stop php8.2-fpm

# Backup current application
mv "$APP_DIR" "$APP_DIR.backup.$(date +%Y%m%d_%H%M%S)"

# Restore application
mkdir -p "$APP_DIR"
tar -xzf "$BACKUP_FILE" -C "$APP_DIR"

# Set permissions
sudo chown -R www-data:www-data "$APP_DIR"
sudo chmod -R 755 "$APP_DIR"
sudo chmod -R 775 "$APP_DIR/storage"
sudo chmod -R 775 "$APP_DIR/bootstrap/cache"

# Start services
sudo systemctl start php8.2-fpm
sudo systemctl start nginx

echo "Application restored from: $BACKUP_FILE"
```

## 11. Security Hardening

### 11.1 Server Security

#### Firewall Configuration
```bash
# Install UFW
sudo apt install ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Check status
sudo ufw status
```

#### SSH Security
```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Security settings
Port 22
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# Restart SSH
sudo systemctl restart ssh
```

### 11.2 Application Security

#### Laravel Security
```php
// Security middleware
Route::middleware(['auth', 'verified', 'throttle:60,1'])->group(function () {
    // Protected routes
});

// CSRF protection
// Automatically enabled in Laravel

// XSS protection
// Use {{ }} for output escaping

// SQL injection protection
// Use Eloquent ORM or prepared statements
```

#### Environment Security
```bash
# Secure .env file
chmod 600 /var/www/tims/.env
chown www-data:www-data /var/www/tims/.env

# Remove sensitive files
rm -f /var/www/tims/.env.example
rm -f /var/www/tims/README.md
rm -f /var/www/tims/CHANGELOG.md
```

## 12. Troubleshooting

### 12.1 Common Issues

#### Permission Issues
```bash
# Fix permissions
sudo chown -R www-data:www-data /var/www/tims
sudo chmod -R 755 /var/www/tims
sudo chmod -R 775 /var/www/tims/storage
sudo chmod -R 775 /var/www/tims/bootstrap/cache
```

#### Database Connection Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log

# Test database connection
mysql -u tims_user -p tims_production
```

#### Application Issues
```bash
# Check Laravel logs
tail -f /var/www/tims/storage/logs/laravel.log

# Clear caches
cd /var/www/tims
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Check application status
php artisan about
```

### 12.2 Performance Issues

#### Slow Queries
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Check slow queries
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';

-- Analyze slow queries
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;
```

#### Memory Issues
```bash
# Check PHP memory usage
php -i | grep memory_limit

# Check system memory
free -h

# Check PHP-FPM processes
ps aux | grep php-fpm
```

### 12.3 Log Analysis

#### Log Analysis Script
```bash
#!/bin/bash
# analyze-logs.sh

# Application logs
echo "=== Application Logs ==="
tail -n 100 /var/www/tims/storage/logs/laravel.log | grep ERROR

# Nginx logs
echo "=== Nginx Logs ==="
tail -n 100 /var/log/nginx/error.log

# MySQL logs
echo "=== MySQL Logs ==="
tail -n 100 /var/log/mysql/error.log

# System logs
echo "=== System Logs ==="
tail -n 100 /var/log/syslog | grep tims
```

---

**Last Updated**: October 21, 2025  
**Version**: 1.0.0  
**Status**: Production Ready  
**Maintainer**: DevOps Team
