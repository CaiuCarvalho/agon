#!/usr/bin/env node

/**
 * VPS Environment Diagnostic Script
 * 
 * This script checks if all required environment variables are properly configured
 * Run this on your VPS to diagnose checkout 502 errors
 * 
 * Usage: node diagnose-vps-env.js
 */

console.log('========================================');
console.log('VPS Environment Diagnostic');
console.log('========================================\n');

// Required environment variables
const requiredVars = {
  'NEXT_PUBLIC_APP_URL': {
    description: 'Base URL of the application',
    example: 'https://agonimports.com',
    critical: true,
  },
  'MERCADOPAGO_ACCESS_TOKEN': {
    description: 'Mercado Pago Access Token',
    example: 'APP_USR-XXXXXXXXXXXX-XXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    critical: true,
    validate: (value) => {
      if (!value.startsWith('APP_USR-')) {
        return 'Invalid format: must start with APP_USR-';
      }
      return null;
    },
  },
  'NEXT_PUBLIC_SUPABASE_URL': {
    description: 'Supabase Project URL',
    example: 'https://your-project.supabase.co',
    critical: true,
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
    description: 'Supabase Anonymous Key',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    critical: true,
  },
  'NODE_ENV': {
    description: 'Node Environment',
    example: 'production',
    critical: false,
  },
  'MERCADOPAGO_WEBHOOK_SECRET': {
    description: 'Mercado Pago Webhook Secret (optional)',
    example: 'your-webhook-secret-here',
    critical: false,
  },
};

let hasErrors = false;
let hasCriticalErrors = false;

console.log('Checking environment variables...\n');

// Check each required variable
for (const [varName, config] of Object.entries(requiredVars)) {
  const value = process.env[varName];
  const status = value ? '✓' : '✗';
  const criticalTag = config.critical ? '[CRITICAL]' : '[OPTIONAL]';
  
  console.log(`${status} ${criticalTag} ${varName}`);
  console.log(`   Description: ${config.description}`);
  
  if (!value) {
    console.log(`   Status: MISSING`);
    console.log(`   Example: ${config.example}`);
    hasErrors = true;
    if (config.critical) {
      hasCriticalErrors = true;
    }
  } else {
    // Mask sensitive values
    const maskedValue = varName.includes('TOKEN') || varName.includes('KEY') || varName.includes('SECRET')
      ? value.substring(0, 20) + '...' + value.substring(value.length - 10)
      : value;
    
    console.log(`   Status: CONFIGURED`);
    console.log(`   Value: ${maskedValue}`);
    
    // Run custom validation if provided
    if (config.validate) {
      const validationError = config.validate(value);
      if (validationError) {
        console.log(`   Validation: ✗ ${validationError}`);
        hasErrors = true;
        if (config.critical) {
          hasCriticalErrors = true;
        }
      } else {
        console.log(`   Validation: ✓ OK`);
      }
    }
  }
  
  console.log('');
}

// Check .env files
console.log('========================================');
console.log('Environment Files Check');
console.log('========================================\n');

const fs = require('fs');
const path = require('path');

const envFiles = [
  '.env.local',
  '.env.production',
  '.env',
];

console.log('Checking for .env files in current directory...\n');

for (const file of envFiles) {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✓' : '✗';
  
  console.log(`${status} ${file}`);
  
  if (exists) {
    const stats = fs.statSync(filePath);
    console.log(`   Size: ${stats.size} bytes`);
    console.log(`   Modified: ${stats.mtime.toISOString()}`);
    
    // Check if file contains required variables
    const content = fs.readFileSync(filePath, 'utf-8');
    const hasAppUrl = content.includes('NEXT_PUBLIC_APP_URL');
    const hasMercadoPago = content.includes('MERCADOPAGO_ACCESS_TOKEN');
    
    console.log(`   Contains NEXT_PUBLIC_APP_URL: ${hasAppUrl ? '✓' : '✗'}`);
    console.log(`   Contains MERCADOPAGO_ACCESS_TOKEN: ${hasMercadoPago ? '✓' : '✗'}`);
  }
  
  console.log('');
}

// Check Next.js build
console.log('========================================');
console.log('Next.js Build Check');
console.log('========================================\n');

const nextBuildDir = path.join(process.cwd(), '.next');
const buildExists = fs.existsSync(nextBuildDir);

console.log(`Next.js build directory (.next): ${buildExists ? '✓ EXISTS' : '✗ MISSING'}`);

if (buildExists) {
  const buildId = path.join(nextBuildDir, 'BUILD_ID');
  if (fs.existsSync(buildId)) {
    const id = fs.readFileSync(buildId, 'utf-8').trim();
    console.log(`Build ID: ${id}`);
  }
}

console.log('');

// Check PM2 process
console.log('========================================');
console.log('PM2 Process Check');
console.log('========================================\n');

try {
  const { execSync } = require('child_process');
  const pm2List = execSync('pm2 jlist', { encoding: 'utf-8' });
  const processes = JSON.parse(pm2List);
  
  console.log(`PM2 processes found: ${processes.length}`);
  
  for (const proc of processes) {
    console.log(`\n  Process: ${proc.name}`);
    console.log(`  Status: ${proc.pm2_env.status}`);
    console.log(`  PID: ${proc.pid}`);
    console.log(`  Uptime: ${Math.floor(proc.pm2_env.pm_uptime / 1000 / 60)} minutes`);
    console.log(`  Restarts: ${proc.pm2_env.restart_time}`);
    console.log(`  Memory: ${Math.floor(proc.monit.memory / 1024 / 1024)} MB`);
    
    // Check if process has environment variables
    if (proc.pm2_env.env) {
      const hasAppUrl = !!proc.pm2_env.env.NEXT_PUBLIC_APP_URL;
      const hasMercadoPago = !!proc.pm2_env.env.MERCADOPAGO_ACCESS_TOKEN;
      
      console.log(`  Env NEXT_PUBLIC_APP_URL: ${hasAppUrl ? '✓' : '✗'}`);
      console.log(`  Env MERCADOPAGO_ACCESS_TOKEN: ${hasMercadoPago ? '✓' : '✗'}`);
    }
  }
} catch (error) {
  console.log('✗ PM2 not found or not running');
  console.log('  Run: pm2 list');
}

console.log('\n');

// Summary
console.log('========================================');
console.log('Diagnostic Summary');
console.log('========================================\n');

if (hasCriticalErrors) {
  console.log('✗ CRITICAL ERRORS FOUND');
  console.log('  One or more critical environment variables are missing or invalid.');
  console.log('  The checkout will NOT work until these are fixed.\n');
  console.log('  ACTION REQUIRED:');
  console.log('  1. Create or update .env.local file in apps/web/ directory');
  console.log('  2. Add all missing CRITICAL variables');
  console.log('  3. Restart the application: pm2 restart all');
  console.log('  4. Run this diagnostic again to verify\n');
  process.exit(1);
} else if (hasErrors) {
  console.log('⚠ WARNINGS FOUND');
  console.log('  Some optional environment variables are missing.');
  console.log('  The checkout should work, but some features may be limited.\n');
  process.exit(0);
} else {
  console.log('✓ ALL CHECKS PASSED');
  console.log('  All required environment variables are properly configured.');
  console.log('  If you are still experiencing 502 errors, check:');
  console.log('  1. Application logs: pm2 logs');
  console.log('  2. Nginx logs: sudo tail -f /var/log/nginx/error.log');
  console.log('  3. Network connectivity to Mercado Pago API\n');
  process.exit(0);
}
