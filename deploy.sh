#!/bin/bash
set -e

echo "🚀 Starting BazaarX Marketplace Deployment..."

# 1. Navigate to app root
cd /var/www/marketplace-app

# 2. Pull latest changes if using git
if [ -d ".git" ]; then
    echo "📥 Pulling latest code from Git..."
    git pull origin main
fi

# 3. Update & Build Backend (Laravel)
echo "⚙️ Deploying Laravel Backend..."
cd /var/www/marketplace-app/laravel-backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan storage:link || true
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
sudo chown -R www-data:www-data storage bootstrap/cache

# 4. Update & Build Frontend (Next.js)
echo "⚡ Deploying Next.js Frontend..."
cd /var/www/marketplace-app
npm ci
npm run build
pm2 restart bazaarx-frontend || pm2 start npm --name "bazaarx-frontend" -- start

echo "✅ BazaarX Marketplace Deployment Completed Successfully!"
