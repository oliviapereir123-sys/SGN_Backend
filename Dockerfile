FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    apache2 \
    php8.1 \
    php8.1-mysqli \
    libapache2-mod-php8.1 \
    && rm -rf /var/lib/apt/lists/*

RUN a2enmod rewrite headers

COPY . /var/www/html/

RUN chown -R www-data:www-data /var/www/html

RUN echo 'ServerName localhost' >> /etc/apache2/apache2.conf && \
    echo '<Directory /var/www/html>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' >> /etc/apache2/apache2.conf

EXPOSE 8080

CMD ["bash", "-c", "sed -i 's/Listen 80/Listen 8080/' /etc/apache2/ports.conf && sed -i 's/<VirtualHost \\*:80>/<VirtualHost *:8080>/' /etc/apache2/sites-enabled/000-default.conf && apache2ctl -D FOREGROUND"]
