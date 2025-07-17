# Personal Finance Management System

A comprehensive financial management application built with Astro.js, Go, and Supabase, with full Docker containerization and AWS deployment support.

## Tech Stack

- **Frontend**: Astro.js with Tailwind CSS (SSR)
- **Backend**: Go with Gin framework
- **Database**: Supabase (PostgreSQL + Auth)
- **Authentication**: Supabase Auth with JWT
- **Real-time**: Supabase Realtime
- **Containerization**: Docker & Docker Compose
- **Deployment**: AWS (App Runner, ECS, Lambda, EC2)
- **CI/CD**: GitHub Actions

## Project Structure

```
.
├── frontend/                    # Astro.js frontend application
│   ├── src/                    # Source code
│   ├── Dockerfile              # Frontend container configuration
│   └── package.json            # Node.js dependencies
├── backend/                     # Go backend service
│   ├── cmd/                    # Application entry point
│   ├── internal/               # Internal packages
│   ├── Dockerfile              # Backend container configuration
│   └── go.mod                  # Go dependencies
├── supabase/                    # Supabase configuration and migrations
├── .github/workflows/           # CI/CD pipelines
├── docker-compose.yml           # Local development with Docker
├── aws-deployment.md            # Comprehensive AWS deployment guide
├── DEPLOYMENT_QUICKSTART.md     # Quick deployment instructions
├── env.example                  # Environment variables template
└── README.md                    # This file
```

## Quick Start (Docker - Recommended)

### Prerequisites

- Docker & Docker Compose
- Git
- Supabase project (create at https://supabase.com)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd Personal-Finance-Management-System
cp env.example .env
```

### 2. Configure Environment

Edit `.env` with your Supabase credentials:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=postgresql://postgres:your_password@db.your-project.supabase.co:5432/postgres
JWT_SECRET=your_secure_jwt_secret
```

### 3. Run with Docker

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 4. Access the Application

- **Frontend**: http://localhost:4321
- **Backend API**: http://localhost:8080
- **Backend Health**: http://localhost:8080/health
- **Frontend Health**: http://localhost:4321/api/health

## Manual Setup (Without Docker)

### Prerequisites

- Node.js 18+ 
- Go 1.24+
- Supabase CLI
- Git

### Frontend Setup

```bash
cd frontend
npm install
npm run dev    # Runs on http://localhost:4321
```

### Backend Setup

```bash
cd backend
go mod download
go run cmd/main.go    # Runs on http://localhost:8080
```

### Database Setup

```bash
cd supabase
supabase migration up
```

## Development

### Local URLs
- **Frontend**: http://localhost:4321
- **Backend**: http://localhost:8080
- **Supabase Dashboard**: https://app.supabase.com

### Docker Commands
```bash
# View logs
docker-compose logs -f

# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Stop all services
docker-compose down

# Clean rebuild
docker-compose down && docker-compose build --no-cache && docker-compose up
```

## Features

- 🔐 **User authentication and profile management**
- 💰 **Account and transaction management**
- 📊 **Budget tracking and goal setting**
- 📈 **Financial analytics dashboard**
- ⚡ **Real-time data synchronization**
- 📱 **Responsive mobile-first design**
- 🐳 **Fully containerized with Docker**
- ☁️ **AWS deployment ready**

## Testing

```bash
# Backend tests
cd backend && go test ./...

# Frontend tests (if configured)
cd frontend && npm test

# Test Docker containers
curl http://localhost:8080/health
curl http://localhost:4321/api/health
```

## Deployment Options

### 🚀 Quick Deploy (30 minutes)
See [`DEPLOYMENT_QUICKSTART.md`](./DEPLOYMENT_QUICKSTART.md) for fastest deployment to AWS App Runner.

### 📚 Comprehensive Deployment Guide
See [`aws-deployment.md`](./aws-deployment.md) for all deployment options:

| Option | Complexity | Cost/Month | Best For |
|--------|------------|------------|----------|
| **AWS App Runner** | Low | $50-100 | Getting started |
| **AWS Lambda** | Medium | $10-30 | Low traffic |
| **Amazon ECS** | High | $80-140 | Production |
| **EC2 + Docker** | Medium | $20-40 | Budget-conscious |

### CI/CD
GitHub Actions workflows are included for automated deployments:
- `.github/workflows/deploy-aws-app-runner.yml`
- `.github/workflows/deploy-ecs.yml`

## Environment Variables

Required environment variables (see `env.example`):

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Database
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Security
JWT_SECRET=your_secure_random_jwt_secret

# Networking
PORT=:8080
HOST=0.0.0.0
```

## Troubleshooting

### Docker Issues
```bash
# Check container status
docker-compose ps

# View detailed logs
docker-compose logs frontend
docker-compose logs backend

# Restart specific service
docker-compose restart frontend
```

### Common Issues
- **Port conflicts**: Make sure ports 4321 and 8080 are free
- **Docker not starting**: Ensure Docker Desktop is running
- **Database connection**: Verify Supabase credentials in `.env`
- **CORS errors**: Check backend CORS configuration for frontend URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker: `docker-compose up --build`
5. Submit a pull request

## Support

- 📖 **Documentation**: Check `aws-deployment.md` and `DEPLOYMENT_QUICKSTART.md`
- 🐛 **Issues**: Use GitHub Issues for bug reports
- 💬 **Discussions**: Use GitHub Discussions for questions