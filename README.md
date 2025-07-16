# Personal Finance Management System

A comprehensive financial management application built with Astro.js, Go, and Supabase.

## Tech Stack

- **Frontend**: Astro.js with Tailwind CSS
- **Backend**: Go HTTP server
- **Database**: Supabase (PostgreSQL + Auth)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime

## Project Structure

```
.
├── frontend/          # Astro.js frontend application
├── backend/           # Go backend service
├── supabase/          # Supabase configuration and migrations
├── .env               # Environment variables (not committed)
├── .env.example       # Example environment file
└── README.md          # This file
```

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- Go 1.21+
- Supabase CLI
- Git

### Initial Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Personal-Finance-Management-System
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your Supabase project credentials:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
go mod download
go run cmd/main.go
```

### Database Setup

```bash
cd supabase
supabase migration up
```

## Development

- Frontend runs on: http://localhost:3000
- Backend runs on: http://localhost:8080
- Supabase Dashboard: https://app.supabase.com

## Features

- User authentication and profile management
- Account and transaction management
- Budget tracking and goal setting
- Financial analytics dashboard
- Real-time data synchronization
- Responsive mobile-first design

## Testing

- Frontend: `npm test`
- Backend: `go test ./...`

## Deployment

CI/CD pipelines are configured for automated builds and deployments.