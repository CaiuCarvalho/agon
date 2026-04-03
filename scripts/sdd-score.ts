import * as fs from 'fs';
import * as path from 'path';

interface AuditIssue {
  severity: 'CRITICAL' | 'MEDIUM' | 'BAIXO';
  category?: string;
  message: string;
  file?: string;
  line?: number;
  snippet?: string;
}

const ROOT_DIR = process.cwd();
const MODS_DIR = path.join(ROOT_DIR, 'apps/web/src/modules');

async function calculateScore() {
  const auditResultsFile = path.join(ROOT_DIR, 'scripts/audit-results.json');
  if (!fs.existsSync(auditResultsFile)) {
    console.error('Audit results not found. Run runner first.');
    process.exit(1);
  }

  const issues: AuditIssue[] = JSON.parse(fs.readFileSync(auditResultsFile, 'utf8'));
  const criticals = issues.filter(i => i.severity === 'CRITICAL');
  const mediums = issues.filter(i => i.severity === 'MEDIUM');
  const lows = issues.filter(i => i.severity === 'BAIXO');

  console.log('\n## 🛡️ SDD SECURITY & GOVERNANCE REPORT\n');

  if (criticals.length > 0) {
    console.log('### 🔴 CRÍTICOS (GATE BLOCKED)');
    criticals.forEach(i => {
      console.log(`- [${i.category || 'Geral'}] ${i.message}`);
      if (i.file) console.log(`  Local: ${i.file}:${i.line}`);
      if (i.snippet) console.log(`  Snippet: ${i.snippet}`);
    });
    console.log('\n❌ AUDITORIA FALHOU: Segredos ou violações críticas detectadas.');
    process.exit(1);
  }

  // Se passou pelos críticos, calcula score
  const totalModules = fs.existsSync(MODS_DIR) ? fs.readdirSync(MODS_DIR).length : 1;
  let score = 100;

  score -= (mediums.length * 10);
  score -= (lows.length * 2);
  score = Math.max(0, score);

  console.log('### 🟡 MÉDIOS');
  if (mediums.length > 0) {
    mediums.forEach(i => console.log(`- [${i.category || 'Geral'}] ${i.message} (${i.file || 'Global'})`));
  } else {
    console.log('Nenhum problema médio encontrado.');
  }

  console.log(`\n### 📊 SCORE FINAL: ${score}/100 ${score < 80 ? '❌' : '✅'}`);

  const reportMarkdown = `## 🧠 SDD Audit Report\n\n### 📊 Score Final: ${score}/100 ${score < 80 ? '❌' : '✅'}\n\n` + 
    (criticals.length ? `#### 🔴 Críticos\n${criticals.map(i => `- [${i.category}] ${i.message} (${i.file}:${i.line})`).join('\n')}\n\n` : '') +
    (mediums.length ? `#### 🟡 Médios\n${mediums.map(i => `- [${i.category}] ${i.message} (${i.file}:${i.line})`).join('\n')}\n\n` : '') +
    (lows.length ? `#### 🟢 Melhorias (BAIXO)\n${lows.map(i => `- ${i.message}`).join('\n')}\n\n` : '') +
    `#### 🔧 Ações Recomendadas\n${criticals.length ? '1. Corrigir falhas de segurança e segredos críticos IMEDIATAMENTE.\n' : ''}${mediums.length ? '2. Adicionar validações Zod e mover chaves de teste para mocks.\n' : ''}${lows.length ? '3. Eliminar tipagem "any" e placeholders remanescentes.\n' : ''}`;

  fs.writeFileSync(path.join(ROOT_DIR, 'scripts/audit-report.md'), reportMarkdown);

  if (score < 80) {
    console.log('\n🔴 STATUS: FALHA POR SCORE BAIXO');
    process.exit(1);
  }

  console.log('\n🟢 STATUS: APROVADO (SDD GATE PASSED)');
}

calculateScore().catch(err => { console.error(err); process.exit(1); });
