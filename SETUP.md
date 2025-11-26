# AYAZMA-ONE Platform Setup Guide

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+ (or use Docker)
- Redis (or use Docker)

### 1. Environment Setup

Create `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Redis
REDIS_URL=redis://localhost:6379

# AI Providers
GOOGLE_API_KEY=your_google_api_key
OPENAI_API_KEY=your_openai_api_key
OLLAMA_BASE_URL=http://localhost:11434

# App
PORT=3001
NODE_ENV=development
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

```bash
# Start Supabase locally
npx supabase start

# Run migrations
npx supabase db reset
```

### 4. Development Server

```bash
# Start backend and frontend
npm run dev
```

The application will be available at:

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:3001>

---

## 🐳 Docker Deployment

### Development Mode

```bash
docker-compose -f docker-compose.dev.yml up
```

Features:

- Hot reload for both backend and frontend
- Volume mounts for code changes
- Development environment variables

### Production Mode

```bash
docker-compose up -d
```

Features:

- Optimized builds
- Nginx reverse proxy
- Production environment variables
- Health checks

---

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### E2E Tests (Cypress)

```bash
# Install Cypress (if not already installed)
npm install --save-dev cypress @types/node

# Open Cypress
npm run cypress:open

# Run headless
npm run cypress:run
```

### Test Coverage

```bash
npm run test:coverage
```

---

## 📦 Building for Production

### Backend

```bash
npm run build
```

### Frontend

```bash
npm run build:frontend
```

### Docker Images

```bash
# Backend
docker build -f Dockerfile.backend -t ayazma-backend .

# Frontend
docker build -f Dockerfile.frontend -t ayazma-frontend .
```

---

## 🔧 Configuration

### GitHub Actions CI/CD

Set the following secrets in your GitHub repository:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `GITHUB_TOKEN` (automatically provided)

### SSL Certificates

For production deployment with SSL:

```bash
# Using Let's Encrypt
certbot certonly --standalone -d yourdomain.com
```

Update `nginx.conf` with certificate paths.

---

## 📚 Documentation

- [Architecture](./docs/ARCHITECTURE.md) - System architecture overview
- [Context Engine](./docs/CONTEXT_ENGINE.md) - Context management details
- [Data Pods](./docs/DATA_PODS.md) - Permission system
- [API Reference](./docs/API.md) - API endpoints
- [Deployment](./docs/DEPLOYMENT.md) - Deployment guide
- [Contributing](./CONTRIBUTING.md) - Development guidelines

---

## 🎯 Features

### Core Backend

- ✅ Data Pods & RLS
- ✅ Context Compression Engine
- ✅ Pub/Sub System (BullMQ)
- ✅ Audit Trail
- ✅ Multi-provider LLM API
- ✅ Real-time Notifications

### Frontend

- ✅ Data Permission UI
- ✅ Control Panel Dashboard
- ✅ Audit Log Viewer
- ✅ Notification Center
- ✅ Agent Management

### Infrastructure

- ✅ Docker Environment
- ✅ CI/CD Pipeline
- ✅ E2E Testing Setup
- ✅ Comprehensive Documentation

---

## 🛠️ Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3001
npx kill-port 3001

# Kill process on port 5173
npx kill-port 5173
```

### Database Connection Issues

```bash
# Check Supabase status
npx supabase status

# Restart Supabase
npx supabase stop
npx supabase start
```

### Redis Connection Issues

```bash
# Check Redis
docker ps | grep redis

# Restart Redis
docker restart <redis-container-id>
```

---

## 📞 Support

For issues and questions:

- Check [Documentation](./docs/)
- Review [Contributing Guide](./CONTRIBUTING.md)
- Open an issue on GitHub

---

## 📄 License

MIT License - see LICENSE file for details
