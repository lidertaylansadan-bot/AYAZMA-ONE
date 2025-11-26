# 🚀 AYAZMA-ONE

**AI-Powered Multi-Agent Platform for Intelligent Application Development**

AYAZMA-ONE is a production-ready platform that orchestrates multiple AI agents to collaboratively build, design, and manage applications with advanced context management, real-time collaboration, and comprehensive monitoring.

---

## ✨ Key Features

### 🤖 Multi-Agent System

- **Intelligent Orchestration**: Coordinate multiple specialized AI agents
- **Context-Aware Processing**: Advanced context compression and management
- **Real-time Collaboration**: Pub/Sub messaging system with BullMQ
- **Multi-Provider LLM**: Support for Google Gemini, OpenAI, and Ollama

### 🔒 Security & Permissions

- **Data Pods**: Isolated data access with Row Level Security (RLS)
- **Fine-grained Permissions**: Agent-level access control (None/Read/Write)
- **Audit Trail**: Comprehensive activity logging and analytics
- **Secure Authentication**: Supabase Auth integration

### 📊 Monitoring & Analytics

- **Control Panel**: Real-time agent activity monitoring
- **Performance Metrics**: Track success rates, costs, and duration
- **Permission Matrix**: Visual permission management
- **Audit Log**: Searchable activity history with CSV export

### 🔔 Real-time Features

- **Live Notifications**: Supabase Realtime integration
- **Activity Feed**: Real-time agent status updates
- **Instant Alerts**: Agent completion and failure notifications

### 🐳 Production Ready

- **Docker Support**: Complete containerization
- **CI/CD Pipeline**: GitHub Actions automation
- **E2E Testing**: Cypress test suite
- **Comprehensive Docs**: 6 detailed guides

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │Control Panel │  │  Audit Log   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend API (Express + TypeScript)          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ AI Providers │  │  Pub/Sub     │  │    Audit     │      │
│  │ (Multi-LLM)  │  │  (BullMQ)    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │    Redis     │  │   Supabase   │      │
│  │   (RLS)      │  │   (Queue)    │  │  (Realtime)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+ (or use Docker)
- Redis (or use Docker)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/AYAZMA-ONE.git
cd AYAZMA-ONE

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start Supabase
npx supabase start

# Run database migrations
npx supabase db reset

# Start development server
npm run dev
```

Visit:

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:3001>

For detailed setup instructions, see [SETUP.md](./SETUP.md)

---

## 🐳 Docker Deployment

### Development

```bash
docker-compose -f docker-compose.dev.yml up
```

### Production

```bash
docker-compose up -d
```

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for complete deployment guide.

---

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests (Cypress)
npm run cypress:open

# Test coverage
npm run test:coverage
```

---

## 📚 Documentation

- **[Architecture](./docs/ARCHITECTURE.md)** - System design and components
- **[Context Engine](./docs/CONTEXT_ENGINE.md)** - Context management details
- **[Data Pods](./docs/DATA_PODS.md)** - Permission system guide
- **[API Reference](./docs/API.md)** - Complete API documentation
- **[Deployment](./docs/DEPLOYMENT.md)** - Production deployment guide
- **[Contributing](./CONTRIBUTING.md)** - Development guidelines
- **[Setup](./SETUP.md)** - Quick setup instructions

---

## 🎯 Core Components

### Backend Services

- **PermissionService**: Fine-grained access control
- **ContextCompressor**: LangChain-based context optimization
- **AgentMessageBus**: Reliable inter-agent messaging
- **AuditService**: Activity logging and analytics
- **NotificationService**: Real-time notifications
- **ModelSelector**: Intelligent LLM selection

### Frontend Components

- **Control Panel**: Agent monitoring dashboard
- **Audit Log**: Activity viewer with filtering
- **Notification Center**: Real-time alerts
- **Permission Matrix**: Visual permission grid
- **Agent Dashboard**: Performance metrics

---

## 🛠️ Tech Stack

**Frontend:**

- React 18 + TypeScript
- Vite
- TailwindCSS
- React Router
- Lucide Icons

**Backend:**

- Node.js + Express
- TypeScript
- Supabase (PostgreSQL + Realtime)
- Redis + BullMQ
- LangChain

**AI Providers:**

- Google Gemini
- OpenAI
- Ollama (Local LLM)

**Infrastructure:**

- Docker + Docker Compose
- GitHub Actions
- Nginx
- Cypress

---

## 📊 Project Stats

- **Files**: 45+ new files
- **Code**: ~6,000 lines
- **Tests**: 8+ test suites
- **Documentation**: 6 comprehensive guides
- **Features**: 12 major features
- **Status**: ✅ Production Ready

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Code of Conduct
- Development Workflow
- Coding Standards
- Testing Guidelines
- Pull Request Process

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

---

## 🙏 Acknowledgments

Built with:

- [Supabase](https://supabase.com) - Backend infrastructure
- [LangChain](https://langchain.com) - LLM orchestration
- [BullMQ](https://docs.bullmq.io) - Queue management
- [Vite](https://vitejs.dev) - Frontend tooling

---

## 📞 Support

- 📖 [Documentation](./docs/)
- 🐛 [Issue Tracker](https://github.com/yourusername/AYAZMA-ONE/issues)
- 💬 [Discussions](https://github.com/yourusername/AYAZMA-ONE/discussions)

---

<div align="center">
  <strong>Built with ❤️ for the AI-powered future</strong>
</div>
