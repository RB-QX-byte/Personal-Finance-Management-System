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
   ```
3. Start the server:
   ```bash
   npm start
   ```

Visit `http://localhost:3000/login.html` to create an account and log in.

The default HTML dashboard uses mock data. Once the API is expanded you can replace the mock data with requests to your backend.
