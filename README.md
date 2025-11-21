<<<<<<< HEAD
# AYAZMA-ONE
=======
# Ayazma ONE - Core Panel v1

AI-driven production platform where a single founder can create SaaS, web apps, mobile apps, workflows and content from a single dashboard.

## 🚀 Features

### Core Panel v1 MVP
- **Authentication & Profiles**: Sign up, login, logout, forgot password with Supabase auth
- **Projects**: Create and manage multiple projects with different sectors and types
- **Sector Blueprints**: Pre-defined templates for different business sectors (SaaS, Agency, E-commerce, Hotel, Legal Tech)
- **Wizard Suite v0.1**: Multi-step forms for App, Workflow, and Content creation
- **Dashboard**: Clean, modern interface with sidebar navigation and project overview

### Database Schema
- **profiles**: User profiles linked to Supabase auth
- **projects**: User projects with sector, type, and status tracking
- **sector_blueprints**: Pre-defined sector templates with JSON configurations
- **wizard_sessions**: App, Workflow, and Content wizard session data

### Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: Express.js + TypeScript + Node.js
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth
- **State Management**: Zustand
- **UI Components**: Lucide React icons, Sonner notifications

## 📁 Project Structure
# AYAZMA-ONE

## Ayazma ONE - Core Panel v1

AI-driven production platform where a single founder can create SaaS, web apps, mobile apps, workflows and content from a single dashboard.

## 🚀 Features

### Core Panel v1 MVP
- **Authentication & Profiles**: Sign up, login, logout, forgot password with Supabase auth
- **Projects**: Create and manage multiple projects with different sectors and types
- **Sector Blueprints**: Pre-defined templates for different business sectors (SaaS, Agency, E-commerce, Hotel, Legal Tech)
- **Wizard Suite v0.1**: Multi-step forms for App, Workflow, and Content creation
- **Dashboard**: Clean, modern interface with sidebar navigation and project overview

### Database Schema
- **profiles**: User profiles linked to Supabase auth
- **projects**: User projects with sector, type, and status tracking
- **sector_blueprints**: Pre-defined sector templates with JSON configurations
- **wizard_sessions**: App, Workflow, and Content wizard session data

### Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: Express.js + TypeScript + Node.js
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth
- **State Management**: Zustand
- **UI Components**: Lucide React icons, Sonner notifications

## 📁 Project Structure

```
ayazma-one/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript type definitions
│   │   └── services/       # API service layer
│   └── public/
├── backend/                 # Express + TypeScript backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── package.json
├── supabase/               # Supabase configuration
│   ├── migrations/         # Database migrations
│   └── config/            # Supabase client config
├── shared/                 # Shared types between frontend/backend
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Supabase account and project

### 1. Clone and Install
```bash
git clone <repository-url>
cd ayazma-one
npm install
```

### 2. Environment Setup

#### Frontend Environment (.env)
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001/api
```

#### Backend Environment (api/.env)
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=3001
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the migration scripts in order:
   ```bash
   # Apply migrations through Supabase dashboard or CLI
   # Files are in supabase/migrations/
   ```

3. Migration files:
   - `001_create_profiles.sql` - User profiles and auth integration
   - `002_create_projects.sql` - Projects table with RLS
   - `003_create_sector_blueprints.sql` - Sector templates with sample data
   - `004_create_wizard_sessions.sql` - Wizard session tables

### 4. Run Development Servers

```bash
# Frontend (in root directory)
npm run dev

# Backend (in api directory)
cd api
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 📋 API Endpoints

### Authentication
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Archive project

### Sectors
- `GET /api/sectors` - List all sector blueprints
- `GET /api/sectors/:sector_code` - Get sector blueprint details

### Wizards
- `GET /api/wizards/app?projectId=:id` - Get app wizard sessions
- `POST /api/wizards/app` - Create app wizard session
- `GET /api/wizards/workflow?projectId=:id` - Get workflow wizard sessions
- `POST /api/wizards/workflow` - Create workflow wizard session
- `GET /api/wizards/content?projectId=:id` - Get content wizard sessions
- `POST /api/wizards/content` - Create content wizard session

## 🎯 Usage Guide

### 1. User Registration & Login
- Navigate to `/register` to create a new account
- Navigate to `/login` to sign in
- Use email/password authentication

### 2. Dashboard
- View all your projects after login
- Create new projects with sector and type selection
- Access different wizards for each project

### 3. Project Creation
- Click "Yeni Proje Oluştur" (Create New Project)
- Fill in project details:
  - Name and description
  - Sector (SaaS, Agency, E-commerce, Hotel, Legal Tech)
  - Project type (SaaS, Web App, Mobile App, Media, Hybrid)

### 4. App Wizard
- Multi-step form to define your application:
  - Step 1: Target user and persona definition
  - Step 2: Core features identification
  - Step 3: Monetization model selection
  - Step 4: Technical complexity assessment

### 5. Sector Blueprints
Each sector comes with pre-defined templates:
- **SaaS**: Subscription-based software platform
- **Agency**: Service-based business with client management
- **E-commerce**: Online retail platform
- **Hotel**: Hospitality property management
- **Legal Tech**: Legal practice management and automation

## 🔧 Configuration

### Supabase Setup
1. Create new project at [supabase.com](https://supabase.com)
2. Copy your project URL and keys
3. Enable Row Level Security (RLS) on all tables
4. Set up authentication with email/password

### Environment Variables
Make sure to set all required environment variables in both frontend and backend `.env` files.

## 🛠 Development

### Frontend Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Development
```bash
cd api
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
```

## 🔒 Security

- All API routes are protected with authentication middleware
- Row Level Security (RLS) policies implemented on all database tables
- Users can only access their own data
- Service role key used only on backend, anon key on frontend

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Any Node.js hosting)
1. Build the backend: `cd api && npm run build`
2. Set environment variables on your hosting platform
3. Deploy the built files and start with `npm start`

### Database (Supabase)
- Already hosted on Supabase platform
- Migrations automatically applied

## 📈 Next Steps

The architecture is designed to be extensible for future features:

### Planned Features
- **Multi-LLM Router**: Integration with multiple AI providers
- **Multi-Agent Fabric**: AI agent orchestration system
- **Content/Video Pipelines**: Automated content generation
- **Advanced Analytics**: Project and user analytics
- **Team Collaboration**: Multi-user project collaboration
- **API Integrations**: Third-party service integrations

### Extension Points
- Add new wizard types by extending the wizard_sessions pattern
- Create new sector blueprints in the database
- Add new project types to the enum
- Extend the API with new endpoints
- Add new frontend pages and components

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the Ayazma ONE platform and follows the specified licensing terms.

## 📞 Support

For support and questions:
- Check the documentation
- Review the API endpoints
- Check the database schema
- Examine the code comments and structure

---

**Ayazma ONE - Core Panel v1** - Built with ❤️ for solo founders and creators.
