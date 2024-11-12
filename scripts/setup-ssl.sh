#!/bin/bash

# Install Certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com --non-interactive --agree-tos --email your-email@example.com

# Auto-renewal
sudo certbot renew --dry-run