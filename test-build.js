// Simple test to see if Railway can build anything
console.log('Build test successful!');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Working directory:', process.cwd());

// List package.json to verify it exists
const fs = require('fs');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('Package name:', packageJson.name);
  console.log('Package version:', packageJson.version);
} catch (error) {
  console.error('Error reading package.json:', error.message);
}