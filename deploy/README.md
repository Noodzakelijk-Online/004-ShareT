# ShareT Cloud Deployment Guide

ShareT is cloud-service agnostic. It ships as a single Docker container and can be deployed to any Linux VPS.

## Requirements (any provider)
- Ubuntu 22.04 LTS (or any modern Linux)
- Docker + Docker Compose installed
- Port 5005 open in firewall (or 80/443 with a reverse proxy)
- A domain name (optional but recommended)

## Providers tested
| Provider | Notes |
|---|---|
| Hostinger VPS | Use `hostinger-deploy.sh` |
| DigitalOcean | Use `vps-deploy.sh` |
| Hetzner | Use `vps-deploy.sh` |
| Any Ubuntu VPS | Use `vps-deploy.sh` |

---

## Quick Deploy (any VPS)

```bash
# 1. SSH into your server
ssh root@YOUR_SERVER_IP

# 2. Run the deploy script
curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/deploy/vps-deploy.sh | bash
```

Or copy the repo and run:
```bash
git clone https://github.com/YOUR_REPO sharet
cd sharet
bash deploy/vps-deploy.sh
```

---

## Environment Variables

Copy `.env.docker` to your server and fill in:

| Variable | Purpose |
|---|---|
| `TRELLO_API_KEY` | Your Trello API key |
| `TRELLO_API_SECRET` | Your Trello API secret |
| `TRELLO_CALLBACK_URL` | Your server's public URL |
| `PUBLIC_URL` | Your server's public URL |
| `FRONTEND_URL` | Same as PUBLIC_URL |
| `JWT_SECRET` | Random secret string |
| `TRELLO_BOT_TOKEN` | Optional bot account token |

---

## Updating ShareT on a VPS

```bash
cd /opt/sharet
git pull origin main
docker-compose down
docker-compose up -d --build
```

Or use the provided `update.sh` script.

---

## Reverse Proxy (optional, recommended for port 80/443)

Install nginx + certbot:
```bash
apt install -y nginx certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

Add to `/etc/nginx/sites-available/sharet`:
```nginx
server {
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:5005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
