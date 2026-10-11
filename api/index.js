/**
 * Vercel Serverless Function Entry Point
 * Proxies incoming /api requests to the Express application.
 */

require('dotenv').config();
const { initDatabase } = require('../IOT PROJECT/server/config/db');
const { app } = require('../IOT PROJECT/server/server');

let isDbInitialized = false;

module.exports = async (req, res) => {
  // Ensure SQLite schema is ready on cold starts
  if (!isDbInitialized) {
    try {
      await initDatabase();
      isDbInitialized = true;
    } catch (err) {
      console.warn('[Vercel Serverless] DB initialization notice:', err.message);
    }
  }

  // Handle request through Express app
  return app(req, res);
};
