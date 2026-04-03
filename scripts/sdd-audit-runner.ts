import * as fs from 'fs';
import * as path from 'path';

interface AuditIssue {
  severity: 'CRITICAL' | 'MEDIUM' | 'BAIXO';
  message: string;
}

const ROOT_DIR = process.cwd();
const MODULES_DIR = path.join(ROOT_DIR, 'apps/web/src/modules');
const SPECS_DIR = path.join(ROOT_DIR, 'reference/specs');

const IGNORE_FOLDERS = ['node_modules', '.next', '.git', 'dist', 'scripts'];
const IGNORE_FILES = ['.config.js', '.config.ts', 'tsconfig.json'];

function logAudit(severity: string, message: string) {
  const color = severity === 'CRITICAL' ? '🔴' : severity === 'MEDIUM' ? '🟡' : '🟢';
  console.log(`${color} ${severity}: ${message}`);
}

async function auditProject() {
  const issues: AuditIssue[] = [];

  console.log('🔍 Iniciando Auditoria SDD...\n');

  // 1. Validar Mapeamento Módulo <-> Spec
  if (fs.existsSync(MODULES_DIR)) {
    const modules = fs.readdirSync(MODULES_DIR).filter(f => fs.statSync(path.join(MODULES_DIR, f)).isDirectory());

    for (const mod of modules) {
      const modPath = path.join(MODULES_DIR, mod);
      
      // Check for Spec
      const specFiles = fs.readdirSync(SPECS_DIR).filter(f => f.startsWith(mod) && f.endsWith('.md'));
      if (specFiles.length === 0) {
        issues.push({ severity: 'CRITICAL', message: `Módulo '${mod}' não possui especificação correspondente em /reference/specs/${mod}-*.md` });
      } else {
        // Validar Qualidade da Spec
        const specContent = fs.readFileSync(path.join(SPECS_DIR, specFiles[0]), 'utf8');
        const mandatorySections = ['PROBLEMA', 'OBJETIVOS', 'CONTRATOS', 'CRITÉRIOS DE ACEITE'];
        for (const section of mandatorySections) {
          if (!specContent.includes(section)) {
            issues.push({ severity: 'MEDIUM', message: `Spec do módulo '${mod}' está incompleta. Seção '${section}' não encontrada.` });
          }
        }
      }

      // Check for Contracts
      const contractsPath = path.join(modPath, 'contracts.ts');
      if (!fs.existsSync(contractsPath)) {
        issues.push({ severity: 'MEDIUM', message: `Módulo '${mod}' não possui arquivo 'contracts.ts'.` });
      } else {
        const contractsContent = fs.readFileSync(contractsPath, 'utf8');
        if (!contractsContent.includes('z.object')) {
          issues.push({ severity: 'MEDIUM', message: `Contrato do módulo '${mod}' não utiliza Zod (z.object).` });
        }
      }

      // Check for Service Validation
      const servicesDir = path.join(modPath, 'services');
      if (fs.existsSync(servicesDir)) {
        const services = fs.readdirSync(servicesDir).filter(f => f.endsWith('.ts'));
        for (const svc of services) {
          const svcContent = fs.readFileSync(path.join(servicesDir, svc), 'utf8');
          if (!svcContent.includes('.parse(') && !svcContent.includes('.safeParse(')) {
            issues.push({ severity: 'MEDIUM', message: `Service '${svc}' no módulo '${mod}' não realiza validação (.parse) dos dados.` });
          }
        }
      }
    }
  }

  // 2. Grep Contextual de Anti-patterns (any)
  function findAny(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        if (!IGNORE_FOLDERS.includes(file)) findAny(fullPath);
      } else {
        if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          if (IGNORE_FILES.some(f => file.includes(f))) continue;
          
          const content = fs.readFileSync(fullPath, 'utf8');
          // Regex para 'any' mas ignorando comentários (simplificado)
          // Procura por ': any' ou '<any>' ou 'as any'
          const anyRegex = /(?<!\/\/\s*| \*\s*):\s*any\b|(?<!\/\/\s*| \*\s*)<\s*any\s*>|(?<!\/\/\s*| \*\s*)as\s*any\b/g;
          if (anyRegex.test(content)) {
            issues.push({ severity: 'BAIXO', message: `Anti-pattern 'any' detectado em: ${path.relative(ROOT_DIR, fullPath)}` });
          }
        }
      }
    }
  }
  
  findAny(path.join(ROOT_DIR, 'apps/web/src'));

  // 3. Output Final
  const criticals = issues.filter(i => i.severity === 'CRITICAL');
  const mediums = issues.filter(i => i.severity === 'MEDIUM');
  const lows = issues.filter(i => i.severity === 'BAIXO');

  console.log('## 🧠 SDD Audit Report\n');
  
  if (criticals.length > 0) {
    console.log('### 🔴 Críticos');
    criticals.forEach(i => console.log(`- ${i.message}`));
  }

  if (mediums.length > 0) {
    console.log('\n### 🟡 Médios');
    mediums.forEach(i => console.log(`- ${i.message}`));
  }

  if (lows.length > 0) {
    console.log('\n### 🟢 Melhorias');
    lows.forEach(i => console.log(`- ${i.message}`));
  }

  if (issues.length === 0) {
    console.log('🚀 Nenhum problema detectado! Projeto 100% SDD Compliance.');
  }

  // Exportar dados para o Score script (via arquivo temporário ou similar se passarmos em pipe)
  fs.writeFileSync(path.join(ROOT_DIR, 'scripts/audit-results.json'), JSON.stringify(issues));
  
  console.log('\nAudit Runner concluído.');
}

auditProject().catch(err => {
  console.error(err);
  process.exit(1);
});
