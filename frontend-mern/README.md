# Personal Finance Management System - Frontend (React + Vite)

## Tech Stack
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Chart.js** - Data visualization

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will run on http://localhost:3000

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

## Features

### Authentication
- User registration
- User login
- Secure session management
- Profile settings

### Dashboard
- Total balance overview
- Monthly income and expenses
- Recent transactions
- Active budgets and goals
- Account summaries

### Transactions
- Add, edit, and delete transactions
- Filter by account, category, date
- Categorize transactions
- Search functionality

### Accounts
- Create multiple accounts (checking, savings, credit, etc.)
- Track balance for each account
- Manage account types
- Multi-currency support

### Budgets
- Create and manage budgets
- Track spending vs budget
- Visual progress indicators
- Alert thresholds
- Budget analytics

### Goals
- Set financial goals
- Track progress
- Set target dates and amounts
- Priority levels
- Visual progress tracking

### Settings
- Update profile information
- Change password
- Currency preferences
- Export data

## Project Structure

```
frontend-mern/
├── public/
├── src/
│   ├── components/
│   │   └── Layout.jsx         # Main layout with navigation
│   ├── context/
│   │   └── AuthContext.jsx    # Authentication context
│   ├── pages/
│   │   ├── Dashboard.jsx      # Dashboard page
│   │   ├── Transactions.jsx   # Transactions management
│   │   ├── Accounts.jsx       # Accounts management
│   │   ├── Budgets.jsx        # Budget management
│   │   ├── Goals.jsx          # Goals management
│   │   ├── Settings.jsx       # User settings
│   │   ├── Login.jsx          # Login page
│   │   └── Register.jsx       # Registration page
│   ├── services/
│   │   └── api.js             # Axios configuration
│   ├── App.jsx                # Main app component with routing
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles (Tailwind)
├── index.html                 # HTML template
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind configuration
├── postcss.config.js          # PostCSS configuration
└── package.json
```

## API Integration

The frontend communicates with the backend API at `http://localhost:5000/api` through a Vite proxy. Make sure the backend server is running before starting the frontend.

### API Endpoints Used

- `/api/auth/*` - Authentication
- `/api/transactions` - Transaction management
- `/api/accounts` - Account management
- `/api/categories` - Category management
- `/api/budgets` - Budget management
- `/api/goals` - Goal management
- `/api/dashboard` - Dashboard data
- `/api/notifications` - Notifications
- `/api/profile` - User profile
- `/api/currency` - Currency operations
- `/api/ai` - AI categorization
- `/api/tax` - Tax exports

## Configuration

### Vite Proxy
The Vite configuration includes a proxy to the backend API:

```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

For production, you'll need to configure the API URL in `src/services/api.js`.

## Available Scripts

### `npm run dev`
Runs the app in development mode with Vite. Open http://localhost:3000 to view it in the browser.

### `npm run build`
Builds the app for production to the `dist` folder.

### `npm run preview`
Preview the production build locally.

### `npm run lint`
Runs ESLint to check code quality.

## Styling

This project uses Tailwind CSS for styling. The configuration can be found in `tailwind.config.js`.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Tips

1. **Hot Module Replacement (HMR)**: Vite provides instant HMR for a smooth development experience.

2. **Code Splitting**: React Router automatically code-splits routes for optimal loading.

3. **Tailwind IntelliSense**: Install the Tailwind CSS IntelliSense VS Code extension for better autocomplete.

4. **React DevTools**: Use React DevTools browser extension for debugging.

## Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
npx kill-port 3000
# or change port in vite.config.js
```

### API Connection Issues
- Ensure backend is running on port 5000
- Check proxy configuration in `vite.config.js`
- Verify CORS settings in backend

### Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
