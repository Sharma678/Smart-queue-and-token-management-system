# Queue Management System

A digital queue management platform for clinics, service centers, and offices. This system helps reduce physical queue congestion by managing tokens digitally with real-time updates.

## Features

- **Token Generation**: Customers can generate tokens with a single click
- **Live Queue Display**: Real-time display showing "Now Serving" and "Next Up" indicators for each counter
- **Admin Panel**: Complete counter management system
  - Add new counters
  - Close counters
  - Reopen closed counters
  - Reassign tokens between counters
- **Estimated Waiting Time**: Calculates estimated waiting time based on historical data
- **Token History**: Complete history of all tokens with timestamps
- **Real-time Updates**: WebSocket-based real-time updates for live queue display

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: SQLite
- **Real-time**: WebSocket (ws)

## Installation

1. Install backend dependencies:
```bash
npm install
```

2. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

Or install all at once:
```bash
npm run install-all
```

## Running the Application

### Development Mode

Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run them separately:

**Backend** (runs on http://localhost:5000):
```bash
npm run server
```

**Frontend** (runs on http://localhost:3000):
```bash
npm run client
```

## Usage

### Customer View

1. Click "Generate Token" to get a token number
2. View the live queue display to see which counter is serving which token
3. Check estimated waiting time
4. Wait for your token number to be called

### Admin Panel

1. **Add Counter**: Click "Add Counter" button and enter a name
2. **Call Next Token**: Click "Call Next" on any active counter to call the next waiting token
3. **Close Counter**: Click "Close" to close a counter (tokens will be reassigned to waiting)
4. **Reopen Counter**: Click "Reopen" on a closed counter to make it active again
5. **Reassign Tokens**: Click "Reassign" to move tokens from one counter to another
6. **View History**: Click "Show History" to view all token history with timestamps

## API Endpoints

### Tokens
- `POST /api/tokens/generate` - Generate a new token
- `GET /api/tokens/:id` - Get token by ID
- `GET /api/tokens/history/all` - Get token history

### Counters
- `GET /api/counters` - Get all counters
- `POST /api/counters` - Create a new counter
- `PUT /api/counters/:id/close` - Close a counter
- `PUT /api/counters/:id/reopen` - Reopen a counter
- `PUT /api/counters/:id/reassign` - Reassign tokens to another counter

### Queue
- `GET /api/queue/status` - Get current queue status
- `POST /api/queue/call-next` - Call next token for a counter
- `PUT /api/queue/:tokenId/serving` - Mark token as serving
- `PUT /api/queue/:tokenId/served` - Mark token as served
- `GET /api/queue/waiting-time` - Get estimated waiting time

## Database

The application uses SQLite database (`server/queue.db`). The database is automatically created on first run with the following tables:

- **counters**: Stores counter information
- **tokens**: Stores token information and status

## Project Structure

```
queue-management-system/
├── server/
│   ├── index.js          # Express server and WebSocket setup
│   ├── database.js       # Database initialization
│   └── routes/
│       ├── tokens.js     # Token routes
│       ├── counters.js   # Counter routes
│       └── queue.js      # Queue management routes
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CustomerView.tsx
│   │   │   └── AdminPanel.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts
│   │   ├── App.tsx
│   │   └── App.css
│   └── package.json
└── package.json
```

## Environment Variables

You can configure the following environment variables:

- `PORT`: Backend server port (default: 5000)
- `REACT_APP_API_URL`: Frontend API URL (default: http://localhost:5000/api)
- `REACT_APP_WS_URL`: WebSocket URL (default: ws://localhost:5000)

## Deployment

This project is designed to be deployed with:
- **Backend**: Render (for WebSocket + SQLite support)
- **Frontend**: Vercel (for fast, global CDN)

See `DEPLOYMENT_GUIDE.md` for complete deployment instructions.

### Quick Deploy

1. **Deploy Backend to Render:**
   - Go to [render.com](https://render.com)
   - Create new Web Service
   - Build: `npm install`
   - Start: `node server/index.js`
   - Get backend URL

2. **Deploy Frontend to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import GitHub repo
   - Root Directory: `client`
   - Add env vars:
     - `REACT_APP_API_URL` = `https://your-backend.onrender.com/api`
     - `REACT_APP_WS_URL` = `wss://your-backend.onrender.com`

See `DEPLOYMENT_GUIDE.md` for detailed steps.

## License

ISC

