import * as fs from 'fs';
import * as path from 'path';

interface AuditIssue {
  severity: 'CRITICAL' | 'MEDIUM' | 'BAIXO';
  message: string;
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

  // Contagem de módulos para base de proporção
  const modules = fs.existsSync(MODS_DIR) 
    ? fs.readdirSync(MODS_DIR).filter(f => fs.statSync(path.join(MODS_DIR, f)).isDirectory())
    : [];
  
  const totalModules = modules.length || 1;

  let score = 100;

  // Deduções por Severidade (Baseado em Pesos de Qualidade)
  const criticals = issues.filter(i => i.severity === 'CRITICAL');
  const mediums = issues.filter(i => i.severity === 'MEDIUM');
  const lows = issues.filter(i => i.severity === 'BAIXO');

  // Cada Critical remove 25 pontos (Máximo 4 quebra o score)
  score -= (criticals.length * 25);

  // Cada Medium remove 10 pontos
  score -= (mediums.length * 10);

  // Cada Low remove 2 pontos
  score -= (lows.length * 2);

  const reportMarkdown = `## 🧠 SDD Audit Report\n\n### 📊 Score Final: ${score}/100 ${score < 80 ? '❌' : '✅'}\n\n` + 
    (criticals.length ? `#### 🔴 Críticos\n${criticals.map(i => `- ${i.message}`).join('\n')}\n\n` : '') +
    (mediums.length ? `#### 🟡 Médios\n${mediums.map(i => `- ${i.message}`).join('\n')}\n\n` : '') +
    (lows.length ? `#### 🟢 Melhorias\n${lows.map(i => `- ${i.message}`).join('\n')}\n\n` : '') +
    `#### 🔧 Ações Recomendadas\n${criticals.length ? '1. Corrigir erros críticos de mapeamento ou spec.\n' : ''}${mediums.length ? '2. Adicionar validações Zod nos services.\n' : ''}${lows.length ? '3. Eliminar uso de "any" nos componentes.\n' : ''}`;

  fs.writeFileSync(path.join(ROOT_DIR, 'scripts/audit-report.md'), reportMarkdown);

  console.log(reportMarkdown);

  if (score < 80 || criticals.length > 0) {
    console.log('\n🔴 STATUS: FALHA NA AUDITORIA (SDD GATE BLOCKED)');
    process.exit(1);
  }

  console.log('\n🟢 STATUS: APROVADO (SDD GATE PASSED)');
}

calculateScore().catch(err => {
  console.error(err);
  process.exit(1);
});

