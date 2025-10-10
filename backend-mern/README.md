# Personal Finance Management System - Backend (MERN)

## Tech Stack
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start MongoDB (if running locally):
```bash
mongod
```

4. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will run on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Transactions
- `GET /api/transactions` - Get all transactions (with filters)
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Accounts
- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Budgets
- `GET /api/budgets` - Get all budgets
- `GET /api/budgets/:id` - Get single budget
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/analytics/data` - Get budget analytics

### Goals
- `GET /api/goals` - Get all goals
- `GET /api/goals/:id` - Get single goal
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal
- `PUT /api/goals/:id/progress` - Update goal progress
- `DELETE /api/goals/:id` - Delete goal

### Dashboard
- `GET /api/dashboard` - Get dashboard data

### Notifications
- `GET /api/notifications` - Get all notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id` - Mark as read
- `PUT /api/notifications/actions/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Currency
- `GET /api/currency/rates` - Get exchange rates
- `GET /api/currency/convert` - Convert currency
- `GET /api/currency/supported` - Get supported currencies

### AI
- `POST /api/ai/categorize` - AI transaction categorization
- `POST /api/ai/receipt-scan` - Extract data from receipt

### Tax
- `GET /api/tax/export` - Export tax data

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `PUT /api/profile/password` - Update password

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/personal_finance
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
OPENAI_API_KEY=your_openai_key (optional)
CLIENT_URL=http://localhost:3000
```

## Project Structure

```
backend-mern/
├── models/          # Mongoose schemas
├── routes/          # API routes
├── middleware/      # Custom middleware
├── server.js        # Entry point
├── .env            # Environment variables
└── package.json    # Dependencies
```
