/**
 * Test setup file
 * Loads environment variables from .env.local for tests
 */

import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.resolve(__dirname, '../../.env.local');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  envContent.split('\n').forEach((line, index) => {
    // Skip comments and empty lines
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }
    
    // Split on first = sign
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmed.substring(0, equalIndex).trim();
      const value = trimmed.substring(equalIndex + 1).trim();
      process.env[key] = value;
      console.log(`✓ Set ${key}`);
    }
  });
  
  console.log('✓ Loaded environment variables from .env.local');
}
