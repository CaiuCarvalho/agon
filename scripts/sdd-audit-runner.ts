import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ─── Tipos ───────────────────────────────────────────────────

interface AuditIssue {
  severity: 'CRITICAL' | 'MEDIUM' | 'LOW';
  category: 'Segurança' | 'Arquitetura' | 'Contratos' | 'Documentação' | 'Anti-pattern';
  message: string;
  file?: string;
  line?: number;
  snippet?: string;
}

interface AllowlistItem {
  value: string;
  reason: string;
  addedBy: string;
  expiresAt: string;
}

// ─── Constantes ──────────────────────────────────────────────

const ROOT_DIR = process.cwd();
const MODULES_DIR = path.join(ROOT_DIR, 'apps/web/src/modules');
const SPECS_DIR = path.join(ROOT_DIR, 'reference/specs');
const ALLOWLIST_FILE = path.join(ROOT_DIR, 'scripts/sdd-secret-allowlist.json');

const IGNORE_FOLDERS = ['node_modules', '.next', '.git', 'dist', 'build', 'coverage', '.turbo'];
const IGNORE_EXTENSIONS = ['.log', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ico', '.webp', '.map'];

const SECRET_PATTERNS: Array<{ name: string; regex: RegExp; severity: 'CRITICAL' | 'MEDIUM' }> = [
  { name: 'Stripe Live Key',         regex: /sk_live_[a-zA-Z0-9]{24,}/g,                                  severity: 'CRITICAL' },
  { name: 'GitHub Token',            regex: /ghp_[a-zA-Z0-9]{36,}/g,                                      severity: 'CRITICAL' },
  { name: 'Google API Key',          regex: /AIza[a-zA-Z0-9_\-]{35}/g,                                    severity: 'CRITICAL' },
  { name: 'Resend Key',              regex: /re_[a-zA-Z0-9]{24,}/g,                                       severity: 'CRITICAL' },
  { name: 'Hardcoded Authorization', regex: /Authorization:\s*Bearer\s+['"][a-zA-Z0-9._\-]{20,}['"]/g,    severity: 'CRITICAL' },
  { name: 'Stripe Test Key',         regex: /sk_test_[a-zA-Z0-9]{24,}/g,                                  severity: 'MEDIUM'   },
  { name: 'Generic Secret',          regex: /(secret|password|api_key)\s*[:=]\s*['"]([a-zA-Z0-9._\-]{12,})['"]/gi, severity: 'MEDIUM' },
];

// ─── Funções Utilitárias ─────────────────────────────────────

function calculateEntropy(str: string): number {
  const len = str.length;
  if (!len) return 0;
  const freq: Record<string, number> = {};
  for (const ch of str) freq[ch] = (freq[ch] || 0) + 1;
  return Object.values(freq).reduce((s, f) => {
    const p = f / len;
    return s - p * Math.log2(p);
  }, 0);
}

function getTrackedEnvFiles(): string[] {
  try {
    return execSync('git ls-files .env*', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\n')
      .filter(Boolean)
      .filter(f => !f.endsWith('.env.example') && !f.endsWith('.env.production')); // Templates são seguros
  } catch { return []; }
}

function shouldIgnoreFolder(name: string): boolean {
  return IGNORE_FOLDERS.includes(name);
}

function shouldIgnoreFile(filePath: string): boolean {
  const ext = path.extname(filePath);
  if (IGNORE_EXTENSIONS.includes(ext)) return true;
  if (filePath.includes('package-lock.json')) return true;
  return false;
}

function isTestPath(relPath: string): boolean {
  return relPath.includes('mocks') || relPath.includes('tests')
    || relPath.includes('__tests__') || relPath.includes('.test.') || relPath.includes('.spec.');
}

function collectAllFiles(dir: string, result: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!shouldIgnoreFolder(entry.name)) collectAllFiles(full, result);
    } else {
      if (!shouldIgnoreFile(full)) result.push(full);
    }
  }
  return result;
}

// ─── Auditorias ──────────────────────────────────────────────

function auditModuleSpecs(issues: AuditIssue[]) {
  if (!fs.existsSync(MODULES_DIR) || !fs.existsSync(SPECS_DIR)) return;

  const modules = fs.readdirSync(MODULES_DIR)
    .filter(f => fs.statSync(path.join(MODULES_DIR, f)).isDirectory());

  for (const mod of modules) {
    const modPath = path.join(MODULES_DIR, mod);
    const specFiles = fs.readdirSync(SPECS_DIR).filter(f => f.startsWith(mod) && f.endsWith('.md'));

    // Spec existence
    if (specFiles.length === 0) {
      issues.push({
        severity: 'CRITICAL', category: 'Arquitetura',
        message: `Módulo '${mod}' sem spec em /reference/specs/${mod}-*.md`,
      });
    } else {
      const content = fs.readFileSync(path.join(SPECS_DIR, specFiles[0]), 'utf8');
      for (const section of ['PROBLEMA', 'OBJETIVOS', 'CONTRATOS', 'CRITÉRIOS DE ACEITE']) {
        if (!content.includes(section)) {
          issues.push({
            severity: 'MEDIUM', category: 'Documentação',
            message: `Spec '${specFiles[0]}' incompleta — seção '${section}' ausente.`,
          });
        }
      }
    }

    // Contracts
    const contractsPath = path.join(modPath, 'contracts.ts');
    if (!fs.existsSync(contractsPath)) {
      issues.push({ severity: 'MEDIUM', category: 'Contratos', message: `Módulo '${mod}' sem contracts.ts.` });
    } else if (!fs.readFileSync(contractsPath, 'utf8').includes('z.object')) {
      issues.push({ severity: 'MEDIUM', category: 'Contratos', message: `Contracts de '${mod}' não usa Zod.` });
    }

    // Services validation
    const servicesDir = path.join(modPath, 'services');
    if (fs.existsSync(servicesDir)) {
      for (const svc of fs.readdirSync(servicesDir).filter(f => f.endsWith('.ts'))) {
        const content = fs.readFileSync(path.join(servicesDir, svc), 'utf8');
        if (!content.includes('.parse(') && !content.includes('.safeParse(')) {
          issues.push({ severity: 'MEDIUM', category: 'Contratos', message: `Service '${svc}' sem validação Zod.` });
        }
      }
    }
  }
}

function auditSecrets(issues: AuditIssue[], files: string[]) {
  const allowlist: AllowlistItem[] = fs.existsSync(ALLOWLIST_FILE)
    ? JSON.parse(fs.readFileSync(ALLOWLIST_FILE, 'utf8'))
    : [];

  // 1. .env tracked
  for (const env of getTrackedEnvFiles()) {
    issues.push({
      severity: 'CRITICAL', category: 'Segurança',
      message: `Arquivo sensível '${env}' rastreado pelo Git!`,
    });
  }

  // 2. Scan files
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    const relPath = path.relative(ROOT_DIR, file);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // 2.1 Pattern matching
      for (const pattern of SECRET_PATTERNS) {
        // Reset regex lastIndex (they are global)
        pattern.regex.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.regex.exec(line)) !== null) {
          const value = match[0];

          // Allowlist check
          const allowed = allowlist.find(a => value.includes(a.value));
          if (allowed) {
            if (new Date(allowed.expiresAt) < new Date()) {
              issues.push({
                severity: 'CRITICAL', category: 'Segurança', file: relPath, line: lineNum,
                message: `Allowlist EXPIRADA para '${pattern.name}' (expirou: ${allowed.expiresAt})`,
              });
            } else {
              console.log(`  ✅ Allowlist: ${pattern.name} em ${relPath}:${lineNum} (${allowed.reason})`);
            }
            continue;
          }

          // Bypass check
          const bypassMatch = line.match(/\/\/ sdd-ignore-secret:\s*reason=(\S+)/);
          if (bypassMatch) {
            console.log(`  ⚠️ Bypass: ${relPath}:${lineNum} (reason=${bypassMatch[1]})`);
            continue;
          }
          if (line.includes('// sdd-ignore-secret')) {
            issues.push({
              severity: 'CRITICAL', category: 'Segurança', file: relPath, line: lineNum,
              message: `Bypass sem 'reason=' para ${pattern.name}`,
            });
            continue;
          }

          // Test path awareness
          if (isTestPath(relPath) && pattern.severity === 'MEDIUM') continue;

          issues.push({
            severity: pattern.severity, category: 'Segurança',
            file: relPath, line: lineNum,
            message: `Segredo detectado: ${pattern.name}`,
            snippet: line.trim().substring(0, 60),
          });
        }
      }

      // 2.2 Entropy heuristic (only for .ts/.tsx/.js files, skip config)
      if (/\.(ts|tsx|js|jsx)$/.test(relPath) && !relPath.includes('.config.')) {
        const entropyRegex = /['"]([a-zA-Z0-9\/\+=]{40,})['"]/g;
        let em: RegExpExecArray | null;
        while ((em = entropyRegex.exec(line)) !== null) {
          const candidate = em[1];
          if (calculateEntropy(candidate) > 4.5 && !line.includes('sdd-ignore-secret')) {
            issues.push({
              severity: 'MEDIUM', category: 'Segurança', file: relPath, line: lineNum,
              message: `Alta entropia (${calculateEntropy(candidate).toFixed(1)}) em string longa`,
              snippet: candidate.substring(0, 16) + '...',
            });
          }
        }
      }

      // 2.3 Dangerous env fallback (only flag if looks like a real secret, not a URL)
      if (line.includes('process.env.') && line.includes('||') && /['"]/.test(line)) {
        // Ignore URL fallbacks which are safe
        if (!line.includes('http://') && !line.includes('https://')) {
          issues.push({
            severity: 'LOW', category: 'Segurança', file: relPath, line: lineNum,
            message: `Fallback hardcoded em env var (verificar se é segredo)`,
          });
        }
      }
    }
  }
}

function auditAntiPatterns(issues: AuditIssue[], files: string[]) {
  const CONFIG_FILES = ['.config.js', '.config.ts', '.config.mjs', 'tsconfig.json'];

  for (const file of files) {
    if (!(file.endsWith('.ts') || file.endsWith('.tsx'))) continue;
    const basename = path.basename(file);
    if (CONFIG_FILES.some(c => basename.includes(c))) continue;

    const relPath = path.relative(ROOT_DIR, file);
    const lines = fs.readFileSync(file, 'utf8').split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip comment lines
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

      // Match `: any`, `as any`, `<any>`
      if (/:\s*any\b/.test(line) || /\bas\s+any\b/.test(line) || /<\s*any\s*>/.test(line)) {
        issues.push({
          severity: 'LOW', category: 'Anti-pattern',
          file: relPath, line: i + 1,
          message: `Anti-pattern 'any' detectado`,
          snippet: line.trim().substring(0, 60),
        });
      }
    }
  }
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  const issues: AuditIssue[] = [];

  console.log('🔍 Iniciando Auditoria SDD Refinada...\n');

  // Collect all scannable files
  const allFiles = collectAllFiles(ROOT_DIR);
  console.log(`📁 ${allFiles.length} arquivos para análise.\n`);

  // Run audits
  console.log('── 1/3 Verificando Módulos & Specs ──');
  auditModuleSpecs(issues);

  console.log('── 2/3 Verificando Segurança ──');
  auditSecrets(issues, allFiles);

  console.log('── 3/3 Verificando Anti-patterns ──');
  auditAntiPatterns(issues, allFiles);

  // Summary
  const criticals = issues.filter(i => i.severity === 'CRITICAL');
  const mediums = issues.filter(i => i.severity === 'MEDIUM');
  const lows = issues.filter(i => i.severity === 'LOW');

  console.log('\n## 🧠 SDD Audit Report\n');

  if (criticals.length > 0) {
    console.log('### 🔴 Críticos');
    criticals.forEach(i => {
      console.log(`- [${i.category}] ${i.message}`);
      if (i.file) console.log(`  📍 ${i.file}:${i.line}`);
    });
  }
  if (mediums.length > 0) {
    console.log('\n### 🟡 Médios');
    mediums.forEach(i => {
      console.log(`- [${i.category}] ${i.message}`);
      if (i.file) console.log(`  📍 ${i.file}:${i.line}`);
    });
  }
  if (lows.length > 0) {
    console.log(`\n### 🟢 Melhorias (${lows.length} itens)`);
    lows.forEach(i => console.log(`- [${i.category}] ${i.message} → ${i.file}:${i.line}`));
  }

  if (issues.length === 0) {
    console.log('🚀 Nenhum problema detectado! 100% SDD Compliance.');
  }

  // Save results for score script
  fs.writeFileSync(path.join(ROOT_DIR, 'scripts/audit-results.json'), JSON.stringify(issues, null, 2));
  console.log(`\n📊 Auditoria concluída: ${criticals.length} críticos, ${mediums.length} médios, ${lows.length} melhorias.`);
}

main().catch(e => { console.error(e); process.exit(1); });
