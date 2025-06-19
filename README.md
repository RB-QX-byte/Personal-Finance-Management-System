# Personal Finance Management System

This project includes a small Express server with a ClickHouse backend and a simple web interface.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Ensure you have a running [ClickHouse](https://clickhouse.com/) instance. Set the connection URL in an `.env` file:
   ```env
  CLICKHOUSE_URL=http://localhost:8123
  JWT_SECRET=your_jwt_secret
  ```
3. Start the server:
   ```bash
   npm start
   ```

Visit `http://localhost:3000/login.html` to create an account and log in.

After signing up, check the server logs for a verification link containing a token.
Visit `/api/verify?token=YOUR_TOKEN` to activate the account before logging in.

The default HTML dashboard uses mock data. Once the API is expanded you can replace the mock data with requests to your backend.
