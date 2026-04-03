import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface AuditIssue {
  severity: 'CRITICAL' | 'MEDIUM' | 'BAIXO';
  message: string;
  category?: string;
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

const ROOT_DIR = process.cwd();
const MODULES_DIR = path.join(ROOT_DIR, 'apps/web/src/modules');
const SPECS_DIR = path.join(ROOT_DIR, 'reference/specs');
const ALLOWLIST_FILE = path.join(ROOT_DIR, 'scripts/sdd-secret-allowlist.json');

const IGNORE_FOLDERS = ['node_modules', '.next', '.git', 'dist', 'build', 'coverage'];
const IGNORE_EXTENSIONS = ['.log', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2'];

// Padrões de Segredos
const SECRET_PATTERNS = [
  { name: 'Stripe Live Key', regex: /sk_live_[a-zA-Z0-9]{24,}/g, severity: 'CRITICAL' },
  { name: 'GitHub Token', regex: /ghp_[a-zA-Z0-9]{36,}/g, severity: 'CRITICAL' },
  { name: 'Google API Key', regex: /AIza[a-zA-Z0-9_\-]{35}/g, severity: 'CRITICAL' },
  { name: 'Resend Key', regex: /re_[a-zA-Z0-9]{24,}/g, severity: 'CRITICAL' },
  { name: 'Hardcoded Authorization', regex: /Authorization:\s*Bearer\s+['"][a-zA-Z0-9._\-]{20,}['"]/g, severity: 'CRITICAL' },
  { name: 'Stripe Test Key', regex: /sk_test_[a-zA-Z0-9]{24,}/g, severity: 'MEDIUM' },
  { name: 'Generic Secret', regex: /(secret|token|password|api_key)\s*[:=]\s*['"]([a-zA-Z0-9._\-]{12,})['"]/gi, severity: 'MEDIUM' }
];

function calculateEntropy(str: string): number {
  const len = str.length;
  if (!len) return 0;
  const frequencies: Record<string, number> = {};
  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  return Object.values(frequencies).reduce((sum, f) => {
    const p = f / len;
    return sum - p * Math.log2(p);
  }, 0);
}

function getTrackedEnvFiles(): string[] {
  try {
    const output = execSync('git ls-files .env*', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return output.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function getDiffFiles(): string[] | null {
  try {
    // Tenta pegar diff do PR ou último commit.
    const output = execSync('git diff --name-only HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return output.split('\n').filter(f => f && fs.existsSync(path.join(ROOT_DIR, f)));
  } catch {
    return null;
  }
}

async function auditProject() {
  const issues: AuditIssue[] = [];
  const allowlist: AllowlistItem[] = fs.existsSync(ALLOWLIST_FILE) ? JSON.parse(fs.readFileSync(ALLOWLIST_FILE, 'utf8')) : [];

  console.log('🔍 Iniciando Auditoria SDD Refinada...\n');

  // 1. Validar .env versionados (CRITICAL)
  const trackedEnvs = getTrackedEnvFiles();
  for (const env of trackedEnvs) {
    issues.push({ 
      severity: 'CRITICAL', 
      category: 'Segurança', 
      message: `Arquivo sensível '${env}' está sendo rastreado pelo Git!` 
    });
  }

  // 2. Mapeamento Módulo <-> Spec (Arquitetura)
  if (fs.existsSync(MODULES_DIR)) {
    const modules = fs.readdirSync(MODULES_DIR).filter(f => fs.statSync(path.join(MODULES_DIR, f)).isDirectory());
    for (const mod of modules) {
      const modPath = path.join(MODULES_DIR, mod);
      const specFiles = fs.existsSync(SPECS_DIR) ? fs.readdirSync(SPECS_DIR).filter(f => f.startsWith(mod) && f.endsWith('.md')) : [];
      
      if (specFiles.length === 0) {
        issues.push({ 
          severity: 'CRITICAL', 
          category: 'Arquitetura',
          message: `Módulo '${mod}' não possui especificação correspondente em /reference/specs/${mod}-*.md` 
        });
      } else {
        const specContent = fs.readFileSync(path.join(SPECS_DIR, specFiles[0]), 'utf8');
        const mandatorySections = ['PROBLEMA', 'OBJETIVOS', 'CONTRATOS', 'CRITÉRIOS DE ACEITE'];
        for (const section of mandatorySections) {
          if (!specContent.includes(section)) {
            issues.push({ 
              severity: 'MEDIUM', 
              category: 'Documentação',
              message: `Spec '${specFiles[0]}' está incompleta. Seção '${section}' ausente.` 
            });
          }
        }
      }

      // Contratos e Validações Zod
      const contractsPath = path.join(modPath, 'contracts.ts');
      if (!fs.existsSync(contractsPath)) {
        issues.push({ severity: 'MEDIUM', category: 'Contratos', message: `Módulo '${mod}' sem contracts.ts.` });
      } else if (!fs.readFileSync(contractsPath, 'utf8').includes('z.object')) {
        issues.push({ severity: 'MEDIUM', category: 'Contratos', message: `Contracts de '${mod}' não usa Zod.` });
      }

      const servicesDir = path.join(modPath, 'services');
      if (fs.existsSync(servicesDir)) {
        const services = fs.readdirSync(servicesDir).filter(f => f.endsWith('.ts'));
        for (const svc of services) {
          const content = fs.readFileSync(path.join(servicesDir, svc), 'utf8');
          if (!content.includes('.parse(') && !content.includes('.safeParse(')) {
            issues.push({ severity: 'MEDIUM', category: 'Segurança', message: `Service '${svc}' sem validação Zod.` });
          }
        }
      }
    }
  }

  // 3. Secret Scanning (Segurança)
  const targetFiles = getDiffFiles();
  const filesToScan: string[] = [];
  function collectFiles(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORE_FOLDERS.includes(entry.name)) collectFiles(fullPath);
      } else {
        if (!IGNORE_EXTENSIONS.includes(path.extname(entry.name))) filesToScan.push(fullPath);
      }
    }
  }

  if (targetFiles && targetFiles.length > 0) {
    targetFiles.forEach(f => filesToScan.push(path.join(ROOT_DIR, f)));
  } else {
    collectFiles(ROOT_DIR);
  }

  for (const file of filesToScan) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const relPath = path.relative(ROOT_DIR, file);

    lines.forEach((line, index) => {
      // 3.1 Padrões de Secret
      for (const pattern of SECRET_PATTERNS) {
        const matches = line.matchAll(pattern.regex);
        for (const match of matches) {
          const value = match[0];
          
          // Allowlist Check
          const allowlisted = allowlist.find(a => a.value === value || value.includes(a.value));
          if (allowlisted) {
            const isExpired = new Date(allowlisted.expiresAt) < new Date();
            if (isExpired) {
              issues.push({ severity: 'CRITICAL', category: 'Segurança', file: relPath, line: index + 1, message: `Allowlist EXPIRADA: ${pattern.name}` });
            }
            continue;
          }

          // Bypass Metadata Check
          const bypassRegex = /\/\/ sdd-ignore-secret:\s*reason=([^ ]+)/;
          const bypassMatch = line.match(bypassRegex);
          if (bypassMatch) {
            const reason = bypassMatch[1];
            console.log(`⚠️ Bypass Auditado em ${relPath}:${index+1} (Motivo: ${reason})`);
            continue;
          } else if (line.includes('// sdd-ignore-secret')) {
             issues.push({ severity: 'CRITICAL', category: 'Segurança', file: relPath, line: index + 1, message: `Bypass sem metadados obrigatórios (reason=...) para ${pattern.name}` });
             continue;
          }

          // Context Awareness (sk_test_ permitido em mocks/tests)
          const isTestPath = relPath.includes('mocks') || relPath.includes('tests') || relPath.includes('.test.') || relPath.includes('.spec.');
          if (isTestPath && pattern.name === 'Stripe Test Key') continue;

          issues.push({
            severity: pattern.severity as any,
            category: 'Segurança',
            file: relPath,
            line: index + 1,
            message: `Segredo detectado: ${pattern.name}`,
            snippet: line.trim().substring(0, 50) + '...'
          });
        }
      }

      // 3.2 Heurística de Entropia
      const entropyRegex = /['"]([a-zA-Z0-9\/\+=]{32,})['"]/g;
      const entropyMatches = line.matchAll(entropyRegex);
      for (const match of entropyMatches) {
        const candidate = match[1];
        if (calculateEntropy(candidate) > 4.5 && !line.includes('sdd-ignore-secret')) {
          issues.push({
            severity: 'MEDIUM',
            category: 'Segurança',
            file: relPath,
            line: index + 1,
            message: `Alta entropia detectada em string longa.`,
            snippet: candidate.substring(0, 12) + '...'
          });
        }
      }

      // 3.3 Fallback Perigoso
      if (line.includes('process.env.') && line.includes('||') && /['"]/.test(line)) {
        issues.push({ severity: 'MEDIUM', category: 'Segurança', file: relPath, line: index + 1, message: `Uso de fallback hardcoded em variável de ambiente.` });
      }
    });
  }

  // 4. Salvar Resultados
  fs.writeFileSync(path.join(ROOT_DIR, 'scripts/audit-results.json'), JSON.stringify(issues));
  console.log(`Auditoria concluída. ${issues.length} problemas encontrados.`);
}

auditProject().catch(e => { console.error(e); process.exit(1); });
