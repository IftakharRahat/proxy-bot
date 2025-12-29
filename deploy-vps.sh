#!/bin/bash

# VPS Deployment Script for Proxy Bot

echo "=== Starting VPS Deployment ==="

# 1. Configure Nginx
echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/default << 'NGINXEOF'
server {
    listen 80;
    listen 8080;
    server_name _;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

# 2. Restart Nginx
echo "Restarting Nginx..."
systemctl restart nginx

# 3. Test Nginx
nginx -t

# 4. Create app directory
echo "Creating app directory..."
mkdir -p /root/app

# 5. Done
echo "=== Nginx Configuration Complete ==="
echo "Next: Upload your application files to /root/app"
