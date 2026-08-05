FROM php:8.3-fpm-alpine

RUN apk add --no-cache postgresql-dev libpng-dev libzip-dev zip unzip git \
    && docker-php-ext-install pdo pdo_pgsql bcmath gd zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-dev --optimize-autoloader

RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]
