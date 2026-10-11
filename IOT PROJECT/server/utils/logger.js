/**
 * Formatted console logger with log levels and timestamps
 */
class Logger {
  static info(moduleName, ...args) {
    console.log(`[${new Date().toLocaleTimeString()}][${moduleName}] INFO:`, ...args);
  }

  static warn(moduleName, ...args) {
    console.warn(`[${new Date().toLocaleTimeString()}][${moduleName}] WARN:`, ...args);
  }

  static error(moduleName, ...args) {
    console.error(`[${new Date().toLocaleTimeString()}][${moduleName}] ERROR:`, ...args);
  }

  static debug(moduleName, ...args) {
    if (process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production') {
      console.log(`[${new Date().toLocaleTimeString()}][${moduleName}] DEBUG:`, ...args);
    }
  }
}

module.exports = Logger;
