#!/usr/bin/env node

/**
 * Unified Development Runner
 * Starts both the Backend Node/Express Server and the Frontend React/Vite Client concurrently.
 */

const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('\x1b[36m%s\x1b[0m', '=======================================================');
console.log('\x1b[36m%s\x1b[0m', '   🌊 IoT Water Quality Analyzer — Dev Environment     ');
console.log('\x1b[36m%s\x1b[0m', '=======================================================');
console.log(' Starting Backend Server on http://localhost:5000 ...');
console.log(' Starting Frontend Dashboard on http://localhost:5173 ...\n');

// 1. Start Server
const serverProcess = spawn('node', ['server.js'], {
  cwd: path.join(rootDir, 'server'),
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: isWin
});

serverProcess.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[35m[SERVER]\x1b[0m ${data}`);
});

serverProcess.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[31m[SERVER ERR]\x1b[0m ${data}`);
});

// 2. Start Client
const clientProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'client'),
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: isWin
});

clientProcess.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[32m[CLIENT]\x1b[0m ${data}`);
});

clientProcess.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[33m[CLIENT ERR]\x1b[0m ${data}`);
});

// Clean termination handling
const cleanup = () => {
  console.log('\n\x1b[33mShutting down all processes...\x1b[0m');
  try {
    if (serverProcess && !serverProcess.killed) {
      if (isWin) {
        spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t']);
      } else {
        serverProcess.kill('SIGINT');
      }
    }
  } catch {}

  try {
    if (clientProcess && !clientProcess.killed) {
      if (isWin) {
        spawn('taskkill', ['/pid', clientProcess.pid, '/f', '/t']);
      } else {
        clientProcess.kill('SIGINT');
      }
    }
  } catch {}

  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
