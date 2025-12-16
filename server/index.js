const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const { initDatabase } = require('./database');
const { startTokenScheduler } = require('./tokenScheduler');
const tokenRoutes = require('./routes/tokens');
const counterRoutes = require('./routes/counters');
const queueRoutes = require('./routes/queue');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

// CORS configuration - allow all origins for now, or specific ones if set
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // If FRONTEND_URL is set, only allow that and localhost
    if (allowedOrigins.length > 0) {
      if (allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all for now - can restrict later
      }
    } else {
      // No specific origins set, allow all
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Initialize database and start scheduler after tables are created
initDatabase((err) => {
  if (err) {
    console.error('Database initialization failed:', err);
    return;
  }
  
  // Start token scheduler for automatic status updates
  // Only start after database tables are confirmed to exist
  startTokenScheduler();
});

// Routes
app.use('/api/tokens', tokenRoutes);
app.use('/api/counters', counterRoutes);
app.use('/api/queue', queueRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Queue Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      tokens: '/api/tokens',
      counters: '/api/counters',
      queue: '/api/queue'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Broadcast function to send updates to all connected clients
global.broadcastQueueUpdate = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

