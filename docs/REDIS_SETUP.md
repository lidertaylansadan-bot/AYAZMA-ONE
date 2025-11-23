# Redis Setup Guide for AYAZMA-ONE

This guide explains how to set up Redis for the AYAZMA-ONE project using Docker.

## Why Redis?

AYAZMA-ONE uses Redis for:

- **Job Queues**: BullMQ job queues for agent workflows (design-agent, content-agent, code-agent)
- **Caching**: Fast data caching for improved performance
- **Session Management**: Distributed session storage

## Prerequisites

- Docker Desktop installed and running
- Windows, macOS, or Linux operating system

## Quick Start

### 1. Install Docker Desktop

If you haven't installed Docker yet:

**Windows/macOS:**

- Download from [docker.com](https://www.docker.com/products/docker-desktop)
- Run the installer
- Start Docker Desktop

**Linux:**

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 2. Start Redis Container

Run the following command to start Redis:

```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

**Command breakdown:**

- `-d`: Run in detached mode (background)
- `-p 6379:6379`: Map port 6379 from container to host
- `--name redis`: Name the container "redis"
- `redis:alpine`: Use the lightweight Alpine Linux-based Redis image

### 3. Verify Redis is Running

Check if the container is running:

```bash
docker ps | grep redis
```

Expected output:

```
CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS                    NAMES
abc123def456   redis:alpine   "docker-entrypoint.s…"   2 minutes ago   Up 2 minutes   0.0.0.0:6379->6379/tcp   redis
```

### 4. Test Redis Connection

Test the connection using redis-cli:

```bash
docker exec redis redis-cli PING
```

Expected response:

```
PONG
```

### 5. Configure Environment Variables

Update your `.env` files with Redis configuration:

**Frontend (.env):**

```bash
REDIS_URL=redis://localhost:6379
```

**Backend (api/.env):**

```bash
REDIS_URL=redis://localhost:6379
```

### 6. Restart Development Server

Stop and restart your development server to apply the changes:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

You should see in the logs:

```
[INFO] Redis client connected
[INFO] Agent Workers Initialized
    count: 3
```

## Management Commands

### Stop Redis

```bash
docker stop redis
```

### Start Redis (if stopped)

```bash
docker start redis
```

### Remove Redis Container

```bash
docker stop redis
docker rm redis
```

### View Redis Logs

```bash
docker logs redis
```

### Access Redis CLI

```bash
docker exec -it redis redis-cli
```

Common Redis CLI commands:

```bash
# Check all keys
KEYS *

# Get a specific key
GET key_name

# Delete a key
DEL key_name

# Clear all data (use with caution!)
FLUSHALL

# Exit CLI
exit
```

## Troubleshooting

### Port Already in Use

If port 6379 is already in use:

```bash
# Find what's using the port
netstat -ano | findstr :6379  # Windows
lsof -i :6379                  # macOS/Linux

# Use a different port
docker run -d -p 6380:6379 --name redis redis:alpine

# Update REDIS_URL in .env files
REDIS_URL=redis://localhost:6380
```

### Container Won't Start

Check Docker Desktop is running:

```bash
docker info
```

If Docker is not running, start Docker Desktop.

### Connection Refused

1. Verify Redis container is running:

   ```bash
   docker ps | grep redis
   ```

2. Check Redis logs for errors:

   ```bash
   docker logs redis
   ```

3. Restart the container:

   ```bash
   docker restart redis
   ```

### Data Persistence

By default, Redis data is stored inside the container and will be lost if the container is removed. To persist data:

```bash
# Create a volume for data persistence
docker run -d \
  -p 6379:6379 \
  --name redis \
  -v redis-data:/data \
  redis:alpine redis-server --appendonly yes
```

## Production Deployment

For production environments, consider:

### Managed Redis Services

- **AWS ElastiCache**: Fully managed Redis service
- **Azure Cache for Redis**: Microsoft's managed Redis
- **Google Cloud Memorystore**: Google's Redis service
- **Redis Cloud**: Official Redis managed service

### Configuration

Update your production `.env` with the managed service URL:

```bash
REDIS_URL=redis://your-redis-host:6379
# Or with authentication:
REDIS_URL=redis://:password@your-redis-host:6379
```

### Security Best Practices

1. **Enable Authentication**:

   ```bash
   docker run -d -p 6379:6379 --name redis \
     redis:alpine redis-server --requirepass yourpassword
   ```

2. **Use TLS/SSL** for production connections

3. **Restrict Network Access** using firewall rules

4. **Regular Backups** of Redis data

5. **Monitor Performance** using Redis monitoring tools

## Advanced Configuration

### Redis Configuration File

Create a custom `redis.conf`:

```conf
# Maximum memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security
requirepass yourpassword
```

Run with custom config:

```bash
docker run -d -p 6379:6379 --name redis \
  -v $(pwd)/redis.conf:/usr/local/etc/redis/redis.conf \
  redis:alpine redis-server /usr/local/etc/redis/redis.conf
```

## Monitoring

### Check Memory Usage

```bash
docker exec redis redis-cli INFO memory
```

### Monitor Commands in Real-time

```bash
docker exec redis redis-cli MONITOR
```

### Check Connected Clients

```bash
docker exec redis redis-cli CLIENT LIST
```

## Integration with AYAZMA-ONE

The application automatically connects to Redis on startup. You'll see these logs:

```
[INFO] Initializing Redis client
    url: "redis://localhost:6379"
[INFO] Redis client connected
[INFO] Agent Workers Initialized
    count: 3
```

If Redis is not available, the application will:

1. Attempt to connect 3 times
2. Log warnings about failed connections
3. Continue running without Redis (degraded mode)

## Next Steps

- ✅ Redis is now running and connected
- ✅ Agent workers are processing jobs
- ✅ Job queues are operational

You can now:

- Create projects and run wizards
- Use AI agents for design, workflow, and content
- Monitor job progress in the analytics dashboard

## Support

For issues or questions:

- Check the [main README](../README.md)
- Review [API documentation](./API.md)
- Consult [Agent Guide](./AGENT_GUIDE.md)

---

**Redis Setup Complete!** 🎉 Your AYAZMA-ONE platform is now fully operational with job queue support.
