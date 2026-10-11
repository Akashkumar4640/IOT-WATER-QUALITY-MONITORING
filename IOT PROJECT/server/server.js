require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const { initDatabase, dbQuery } = require('./config/db');
const { initSocket } = require('./websocket/socketManager');
const { initMQTT } = require('./mqtt/mqttService');
const watchdogService = require('./services/watchdogService');
const apiRoutes = require('./routes');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const { Logger, ResponseHelper } = require('./utils');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Enable CORS for web dashboard
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id', 'X-Device-Token']
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(requestLogger);

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let dbOk = false;
  try {
    const check = await dbQuery.get('SELECT 1 as alive');
    dbOk = check && check.alive === 1;
  } catch (e) {
    dbOk = false;
  }

  res.json({
    status: dbOk ? 'ok' : 'degraded',
    backend: true,
    database: dbOk,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Serve compiled frontend dashboard if built (e.g. Render, production)
const fs = require('fs');
const path = require('path');
const clientDist = path.resolve(__dirname, '../client/dist');
const hasClientDist = fs.existsSync(clientDist);

if (hasClientDist) {
  app.use(express.static(clientDist));
} else {
  // Fallback root route if client is not built
  app.get('/', (req, res) => {
    res.json({
      message: 'IoT pH Water Quality & Content Analyzer Server is Running',
      version: '1.0.4-PROD',
      documentation: '/api/health'
    });
  });
}

// 404 handler for unmatched API routes
app.use('/api/*', (req, res) => {
  ResponseHelper.error(res, `API endpoint '${req.originalUrl}' does not exist`, 404, 'NOT_FOUND');
});

// Single Page Application (SPA) catch-all route for frontend navigation
if (hasClientDist) {
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Centralized error handling middleware
app.use(errorHandler);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
initSocket(io);

// Initialize optional MQTT client
initMQTT(process.env.MQTT_BROKER_URL, process.env.ENABLE_MQTT === 'true');

// Start Server
async function startServer() {
  try {
    await initDatabase();
    watchdogService.start(io, 5000);

    server.listen(PORT, () => {
      console.log('====================================================');
      console.log('  IoT pH WATER QUALITY & CONTENT ANALYZER BACKEND   ');
      console.log(`  HTTP API Server running on port ${PORT}          `);
      console.log(`  WebSocket Server active with Socket.IO            `);
      console.log(`  Database: SQLite 3 Persistent Storage             `);
      console.log('====================================================');
    });
  } catch (err) {
    Logger.error('Server', 'Fatal server startup error:', err);
    process.exit(1);
  }
}

// Only start the HTTP listener if not running as a Vercel serverless function
if (!process.env.VERCEL) {
  startServer();
}

module.exports = { app, server, startServer };
