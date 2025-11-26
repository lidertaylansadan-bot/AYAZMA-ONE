# Deployment Guide

## Overview

This guide covers deploying AYAZMA-ONE to production environments.

## Prerequisites

- Docker and Docker Compose installed
- Access to a server (VPS, cloud instance, etc.)
- Domain name configured
- SSL certificate (Let's Encrypt recommended)

## Environment Variables

Create a `.env` file with the following variables:

```bash
# Node Environment
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ayazma
POSTGRES_PASSWORD=your_secure_password

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Redis
REDIS_URL=redis://localhost:6379

# AI Providers
AI_OPENAI_KEY=your_openai_key
AI_GOOGLE_KEY=your_google_key

# Frontend
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Deployment Options

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/AYAZMA-ONE.git
   cd AYAZMA-ONE/AYAZMA_ONE_v2
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Start services**

   ```bash
   docker-compose up -d
   ```

4. **Run migrations**

   ```bash
   docker-compose exec backend npx supabase db push
   ```

5. **Verify deployment**

   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

### Option 2: Manual Deployment

#### Backend

1. **Install dependencies**

   ```bash
   npm ci --production
   ```

2. **Build application**

   ```bash
   npm run build
   ```

3. **Start with PM2**

   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name ayazma-backend
   pm2 save
   pm2 startup
   ```

#### Frontend

1. **Build frontend**

   ```bash
   npm run build:frontend
   ```

2. **Serve with nginx**

   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/ayazma
   sudo ln -s /etc/nginx/sites-available/ayazma /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## SSL Configuration

### Using Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Rest of your configuration...
}
```

## Database Setup

### PostgreSQL

1. **Install PostgreSQL**

   ```bash
   sudo apt install postgresql postgresql-contrib
   ```

2. **Create database**

   ```bash
   sudo -u postgres psql
   CREATE DATABASE ayazma;
   CREATE USER ayazma_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE ayazma TO ayazma_user;
   ```

3. **Run migrations**

   ```bash
   npx supabase db push
   ```

### Redis

```bash
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

## Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:3001/api/health

# Frontend
curl http://localhost/
```

### Logs

```bash
# Docker
docker-compose logs -f backend
docker-compose logs -f frontend

# PM2
pm2 logs ayazma-backend
```

### Metrics

Monitor the following:

- CPU usage
- Memory usage
- Disk space
- Database connections
- Redis memory
- API response times

## Backup Strategy

### Database Backup

```bash
# Create backup
pg_dump -U ayazma_user ayazma > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U ayazma_user ayazma < backup_20240101.sql
```

### Automated Backups

```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

## Scaling

### Horizontal Scaling

1. **Load Balancer**: Use nginx or HAProxy
2. **Multiple Backend Instances**: Scale backend with Docker Swarm or Kubernetes
3. **Redis Cluster**: For high availability
4. **Database Replication**: PostgreSQL read replicas

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Enable caching
- Use CDN for static assets

## Troubleshooting

### Common Issues

**Backend not starting**

```bash
# Check logs
docker-compose logs backend

# Verify environment variables
docker-compose exec backend env
```

**Database connection errors**

```bash
# Test connection
docker-compose exec backend psql $DATABASE_URL

# Check PostgreSQL status
sudo systemctl status postgresql
```

**Frontend 502 errors**

```bash
# Check nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

## Security Checklist

- [ ] Environment variables secured
- [ ] SSL/TLS enabled
- [ ] Firewall configured
- [ ] Database access restricted
- [ ] Regular security updates
- [ ] Backup strategy in place
- [ ] Monitoring enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Secrets rotated regularly

## Performance Optimization

1. **Enable Gzip compression**
2. **Use CDN for static assets**
3. **Enable Redis caching**
4. **Optimize database indexes**
5. **Use connection pooling**
6. **Enable HTTP/2**
7. **Minify assets**
8. **Lazy load components**

## Rollback Procedure

```bash
# Docker
docker-compose down
docker-compose pull
docker-compose up -d

# Manual
pm2 stop ayazma-backend
git checkout previous-version
npm run build
pm2 restart ayazma-backend
```

## Support

For issues or questions:

- GitHub Issues: <https://github.com/yourusername/AYAZMA-ONE/issues>
- Documentation: <https://docs.ayazma.app>
