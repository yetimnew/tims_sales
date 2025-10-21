# Node.js Upgrade Guide for TIMS

## Current Issue
The application requires Node.js version 20.19+ or 22.12+, but you're currently running Node.js 20.10.0.

## Error Message
```
You are using Node.js 20.10.0. Vite requires Node.js version 20.20+ or 22.12+. Please upgrade your Node.js version.
error when starting dev server:
TypeError: crypto.hash is not a function
```

## Solutions

### Option 1: Upgrade Node.js (Recommended)

#### Using Node Version Manager (nvm) - Windows
1. Download and install nvm-windows from: https://github.com/coreybutler/nvm-windows
2. Open PowerShell as Administrator
3. Install Node.js 22.12+:
   ```powershell
   nvm install 22.12.0
   nvm use 22.12.0
   ```

#### Using Chocolatey
```powershell
choco upgrade nodejs
```

#### Manual Installation
1. Visit https://nodejs.org/
2. Download the latest LTS version (22.x or 20.20+)
3. Install and restart your terminal

### Option 2: Use Temporary Manifest (Current Solution)
The application is currently working with temporary manifest files. This is a temporary fix until Node.js is upgraded.

## After Upgrading Node.js

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build frontend assets:**
   ```bash
   npm run build
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Start Laravel server:**
   ```bash
   php artisan serve
   ```

## Verification
- Check Node.js version: `node --version`
- Check npm version: `npm --version`
- Application should load without Vite errors

## Current Status
✅ Application is working with temporary manifest
⏳ Node.js upgrade pending
⏳ Proper frontend build pending

