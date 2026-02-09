# Personal Finance Management System

A comprehensive financial management application offering dual-stack implementations:
1. **MERN Stack**: MongoDB, Express, React, Node.js
2. **Go/Astro Stack**: Go, Astro.js, Supabase

Both implementations share the same modern UI/UX design and core financial management features.

## Tech Stack

### Option 1: MERN Stack (Recommended for React developers)
- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: Firebase Auth with JWT
- **Styling**: Tailwind CSS with custom design system

### Option 2: Astro/Go Stack
- **Frontend**: Astro.js with Tailwind CSS (SSR)
- **Backend**: Go with Gin framework
- **Database**: Supabase (PostgreSQL + Auth)
- **Authentication**: Supabase Auth
- **Containerization**: Docker & Docker Compose
- **Deployment**: AWS (App Runner, ECS)

## Project Structure

```
.
├── frontend-mern/               # React frontend application
│   ├── src/                    # React components and pages
│   ├── public/                 # Static assets
│   └── package.json            # Frontend dependencies
├── backend-mern/                # Node.js/Express backend
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # API endpoints
│   ├── services/               # Business logic
│   └── package.json            # Backend dependencies
├── frontend/                    # Astro.js frontend application
├── backend/                     # Go backend service
├── supabase/                    # Supabase configuration
├── docker-compose.yml           # Docker configuration
└── README.md                    # This file
```

## Quick Start: MERN Stack

### Prerequisites
- Node.js 18+
- MongoDB (Local or Atlas)
- Firebase Project (for Auth)

### 1. Backend Setup
```bash
cd backend-mern
# Install dependencies
npm install

# Configure Environment Variables
cp .env.example .env
# Edit .env and add your MongoDB URI and Firebase Admin credentials
# You can get Firebase credentials from Project Settings > Service Accounts

# Run Server
npm run dev    # Runs on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend-mern
# Install dependencies
npm install

# Run Server
npm run dev    # Runs on http://localhost:5173
```

## Quick Start: Astro/Go Stack (Docker - Recommended)

### Prerequisites

- Docker & Docker Compose
- Supabase project

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
```

### 4. Access the Application

- **Frontend**: http://localhost:4321
- **Backend API**: http://localhost:8080

## Features

- 🔐 **User authentication and profile management**
- 💰 **Account and transaction management**
- 📊 **Budget tracking and goal setting**
- 📈 **Financial analytics dashboard**
- ⚡ **Real-time data updates**
- 📱 **Responsive mobile-first design**
- 🎨 **Modern UI with consistent design system**

## Development

### Frontend (React)
- Uses Vite for fast development
- Tailwind CSS for styling
- Context API for state management
- Axios for API requests

### Backend (Node.js)
- Express framework
- Mongoose for ODM
- Firebase Admin for secure authentication
- RESTful API architecture

## Deployment

### MERN Stack
- **Frontend**: Vercel, Netlify, or AWS S3/CloudFront
- **Backend**: Heroku, Render, AWS Elastic Beanstalk, or App Runner
- **Database**: MongoDB Atlas

### Astro/Go Stack
- **AWS**: App Runner, ECS, or EC2 (see `aws-deployment.md`)
- **Container**: Docker Hub / ECR

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the ISC License.