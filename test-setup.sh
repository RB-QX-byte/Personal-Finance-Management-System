#!/bin/bash

echo "🚀 Personal Finance Management System - Setup Test"
echo "================================================="

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
    echo -e "ℹ️ $1"
}

# Check if .env file exists
print_info "Checking environment configuration..."
if [ -f ".env" ]; then
    print_status 0 ".env file found"
else
    print_status 1 ".env file not found"
    print_warning "Please create .env file using the template in supabase/ENVIRONMENT_SETUP.md"
    exit 1
fi

# Check if frontend .env exists
if [ -f "frontend/.env" ]; then
    print_status 0 "Frontend .env file found"
else
    print_status 1 "Frontend .env file not found"
    print_warning "Please create frontend/.env file for frontend environment variables"
fi

# Test Go dependencies
print_info "Checking Go dependencies..."
cd backend
if go mod tidy > /dev/null 2>&1; then
    print_status 0 "Go dependencies resolved"
else
    print_status 1 "Go dependencies failed"
    exit 1
fi
cd ..

# Test Node dependencies
print_info "Checking Node.js dependencies..."
cd frontend
if npm list > /dev/null 2>&1; then
    print_status 0 "Node.js dependencies installed"
else
    print_warning "Installing Node.js dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_status 0 "Node.js dependencies installed successfully"
    else
        print_status 1 "Failed to install Node.js dependencies"
        exit 1
    fi
fi
cd ..

# Start backend server in background
print_info "Starting backend server..."
cd backend
go run cmd/main.go > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Test backend health
print_info "Testing backend health endpoint..."
if curl -s http://localhost:8080/health > /dev/null; then
    print_status 0 "Backend health check passed"
else
    print_status 1 "Backend health check failed"
    print_warning "Check backend.log for errors"
fi

# Test database connection
print_info "Testing database connection..."
if curl -s http://localhost:8080/db-test > /dev/null; then
    print_status 0 "Database connection successful"
else
    print_status 1 "Database connection failed"
    print_warning "Check your DATABASE_URL and Supabase configuration"
fi

# Start frontend server in background
print_info "Starting frontend server..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 5

# Test frontend
print_info "Testing frontend server..."
if curl -s http://localhost:4321 > /dev/null; then
    print_status 0 "Frontend server running"
else
    print_status 1 "Frontend server failed"
    print_warning "Check frontend.log for errors"
fi

echo ""
echo "================================================="
echo "🎉 Setup test completed!"
echo ""
print_info "Backend running at: http://localhost:8080"
print_info "Frontend running at: http://localhost:4321"
print_info "Backend logs: ./backend.log"
print_info "Frontend logs: ./frontend.log"
echo ""
print_warning "To stop servers: kill $BACKEND_PID $FRONTEND_PID"
echo "Or use: pkill -f 'go run cmd/main.go' && pkill -f 'npm run dev'"
echo ""

# Test API endpoints
print_info "Testing key API endpoints..."
echo "Backend Health: http://localhost:8080/health"
echo "Database Test: http://localhost:8080/db-test"
echo "API Health: http://localhost:8080/api/health"

# Keep servers running
print_info "Servers are running. Press Ctrl+C to stop both servers."
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

wait 