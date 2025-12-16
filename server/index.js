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
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  credentials: true
}));
app.use(express.json());

// Initialize database
initDatabase();

// Start token scheduler for automatic status updates
startTokenScheduler();

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

