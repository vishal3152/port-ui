# PortfolioTracker Pro

A comprehensive portfolio tracking application with Google OAuth 2.0 authentication.

## Features

- Real-time portfolio tracking
- Market data integration
- Currency conversion
- Performance analytics
- Google OAuth 2.0 authentication

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd portfolio-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Google OAuth 2.0 credentials:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000/auth/google/callback` as an authorized redirect URI
   - Update the `.env` file with your Google Client ID and Client Secret

4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=portfolio-tracker-session-secret
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run check` - Type check the code

## Authentication

This application uses Google OAuth 2.0 for authentication. Users can sign in with their Google accounts, and all API endpoints are protected by authentication middleware.

## API Endpoints

All API endpoints are protected and require authentication:

- `GET ` - Get all portfolios
- `GET /:id` - Get a specific portfolio
- `POST ` - Create a new portfolio
- `DELETE /:id` - Delete a portfolio
- `GET /:portfolioId/holdings` - Get holdings for a portfolio
- `POST /:portfolioId/holdings` - Create a new holding
- `GET /:portfolioId/transactions` - Get transactions for a portfolio
- `POST /:portfolioId/transactions` - Create a new transaction
- `GET /api/market-data/:symbol` - Get market data for a symbol
- `GET /api/currency/:from/:to` - Get currency conversion rate
- `POST /:portfolioId/update-prices` - Update stock prices for a portfolio

## Authentication Endpoints

- `GET /auth/google` - Initiate Google OAuth flow
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/me` - Get current user information
- `POST /auth/logout` - Log out the current user

## License

MIT