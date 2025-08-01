#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

const PORT = 3456;
const APP_URL = `http://localhost:${PORT}`;

console.log(`
🚀 TinkyBink AAC Development Server
===================================
Starting on port ${PORT}...
`);

let serverProcess = null;

function startServer() {
  console.log('🔄 Starting Next.js development server...');
  
  serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.log(`\n⚠️  Server exited with code ${code}. Restarting in 2 seconds...`);
      setTimeout(startServer, 2000);
    }
  });

  // Open browser after a delay
  setTimeout(() => {
    console.log(`\n✅ Opening ${APP_URL} in your browser...`);
    const open = spawn('open', [APP_URL]);
    open.on('error', () => {
      console.log(`\n📋 Please open ${APP_URL} in your browser manually.`);
    });
  }, 3000);
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down server...');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

// Setup readline for interactive commands
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`
Commands:
  r - Restart server
  o - Open browser
  q - Quit
`);

rl.on('line', (input) => {
  switch (input.toLowerCase()) {
    case 'r':
      console.log('🔄 Restarting server...');
      if (serverProcess) {
        serverProcess.kill();
      }
      setTimeout(startServer, 500);
      break;
    case 'o':
      console.log(`📱 Opening ${APP_URL}...`);
      spawn('open', [APP_URL]);
      break;
    case 'q':
      console.log('👋 Goodbye!');
      if (serverProcess) {
        serverProcess.kill();
      }
      process.exit(0);
      break;
  }
});

// Start the server
startServer();