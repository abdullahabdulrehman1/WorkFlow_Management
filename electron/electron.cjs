// This file serves as a CommonJS entry point for Electron to load ES modules
// It enables the use of ES6 modules in Electron
// electron-builder will use this as the entry point

const path = require('path');
const { spawn } = require('child_process');

// Use node with --experimental-modules flag to run the ES module
const child = spawn(process.execPath, [
  '--experimental-modules',
  path.join(__dirname, 'main.js')
], {
  stdio: 'inherit'
});

child.on('close', (code) => {
  process.exit(code);
});