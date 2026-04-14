import fs from 'fs';
import path from 'path';

const cwd = process.cwd();

function loadDotEnv(fileName) {
  const fullPath = path.join(cwd, fileName);
  if (!fs.existsSync(fullPath)) {
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separator = line.indexOf('=');
    if (separator <= 0) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadDotEnv('.env.local');
loadDotEnv('.env.production');

function isPlaceholder(value) {
  const normalized = value.toLowerCase();
  return (
    normalized.includes('your-') ||
    normalized.includes('your_') ||
    normalized.includes('seu-') ||
    normalized.includes('seu_') ||
    normalized.includes('yourproject') ||
    normalized.includes('seuprojeto') ||
    normalized.includes('example') ||
    normalized.includes('...') ||
    normalized.endsWith('.co') && normalized.includes('supabase.co') && normalized.includes('seu-projeto')
  );
}

const required = [
  {
    logical: 'SUPABASE_URL',
    alternatives: ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'],
  },
  {
    logical: 'SUPABASE_ANON_KEY',
    alternatives: ['SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  },
  {
    logical: 'SUPABASE_SERVICE_ROLE_KEY',
    alternatives: ['SUPABASE_SERVICE_ROLE_KEY'],
  },
  {
    logical: 'NEXT_PUBLIC_APP_URL',
    alternatives: ['NEXT_PUBLIC_APP_URL'],
  },
  {
    logical: 'MERCADOPAGO_ACCESS_TOKEN',
    alternatives: ['MERCADOPAGO_ACCESS_TOKEN'],
  },
];

const missing = [];

for (const item of required) {
  const hasAtLeastOne = item.alternatives.some((name) => {
    const value = process.env[name];
    return typeof value === 'string' && value.trim().length > 0 && !isPlaceholder(value);
  });

  if (!hasAtLeastOne) {
    missing.push(`${item.logical} (accepted: ${item.alternatives.join(' | ')})`);
  }
}

if (missing.length > 0) {
  console.error('[env-check] Missing required environment variables:');
  for (const entry of missing) {
    console.error(`  - ${entry}`);
  }
  process.exit(1);
}

console.log('[env-check] OK: critical environment variables are present.');
