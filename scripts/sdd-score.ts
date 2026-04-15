import * as fs from 'fs';
import * as path from 'path';

// ─── Tipos ───────────────────────────────────────────────────

interface AuditIssue {
  severity: 'CRITICAL' | 'MEDIUM' | 'LOW';
  category: 'Segurança' | 'Arquitetura' | 'Contratos' | 'Documentação' | 'Anti-pattern';
  message: string;
  file?: string;
  line?: number;
  snippet?: string;
}

// ─── Pesos por Categoria ─────────────────────────────────────
// Cada MEDIUM desconta X pontos do score base de 100. 
// LOW desconta menos. CRITICAL bloqueia imediatamente.
const WEIGHT: Record<string, number> = {
  'Contratos':    8,   // Médio-alto: risco de inconsistência
  'Segurança':    5,   // Médio: alertas de segurança não-críticos
  'Anti-pattern': 1,   // Baixo: melhoria incremental
};

const ROOT_DIR = process.cwd();
const MODS_DIR = path.join(ROOT_DIR, 'apps/web/src/modules');

// ─── Main ────────────────────────────────────────────────────

async function calculateScore() {
  const resultsFile = path.join(ROOT_DIR, 'scripts/audit-results.json');
  if (!fs.existsSync(resultsFile)) {
    console.error('❌ audit-results.json não encontrado. Execute o runner primeiro.');
    process.exit(1);
  }

  const issues: AuditIssue[] = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
  const criticals = issues.filter(i => i.severity === 'CRITICAL');
  const mediums   = issues.filter(i => i.severity === 'MEDIUM');
  const lows      = issues.filter(i => i.severity === 'LOW');

  console.log('\n## 🛡️ SDD GOVERNANCE REPORT\n');

  // ── Hard Gate: qualquer CRITICAL bloqueia imediatamente ──
  if (criticals.length > 0) {
    console.log('### 🔴 GATE BLOQUEADO — Violações Críticas\n');
    criticals.forEach(i => {
      console.log(`- [${i.category}] ${i.message}`);
      if (i.file) console.log(`  📍 ${i.file}:${i.line}`);
      if (i.snippet) console.log(`  💬 ${i.snippet}`);
    });
    console.log('\n❌ AUDITORIA FALHOU: Corrija TODOS os itens críticos antes de prosseguir.');

    // Gera report mesmo em falha
    writeReport(0, criticals, mediums, lows);
    process.exit(1);
  }

  // ── Cálculo de Score com pesos por categoria ──
  let score = 100;

  for (const issue of mediums) {
    const weight = WEIGHT[issue.category] ?? 5;
    score -= weight;
  }
  for (const issue of lows) {
    const weight = Math.max(1, Math.floor((WEIGHT[issue.category] ?? 1) / 2));
    score -= weight;
  }
  score = Math.max(0, score);

  // ── Output ──
  if (mediums.length > 0) {
    console.log('### 🟡 Médios\n');
    mediums.forEach(i => console.log(`- [${i.category}] ${i.message} → ${i.file ?? 'Global'}`));
  }

  if (lows.length > 0) {
    console.log(`\n### 🟢 Melhorias (${lows.length} itens)\n`);
    // Group by category for readability
    const grouped: Record<string, number> = {};
    for (const l of lows) {
      grouped[l.category] = (grouped[l.category] || 0) + 1;
    }
    for (const [cat, count] of Object.entries(grouped)) {
      console.log(`- ${cat}: ${count} ocorrência(s)`);
    }
  }

  console.log(`\n### 📊 SCORE FINAL: ${score}/100 ${score < 80 ? '❌' : '✅'}`);

  writeReport(score, criticals, mediums, lows);

  if (score < 80) {
    console.log('\n🟡 STATUS: SCORE ABAIXO DE 80 — corrija os itens médios para elevar a qualidade.');
  } else {
    console.log('\n🟢 STATUS: APROVADO');
  }
}

function writeReport(
  score: number,
  criticals: AuditIssue[],
  mediums: AuditIssue[],
  lows: AuditIssue[],
) {
  const lines: string[] = [
    `## 🧠 SDD Audit Report`,
    ``,
    `### 📊 Score Final: ${score}/100 ${score < 80 ? '❌' : '✅'}`,
    ``,
  ];

  if (criticals.length) {
    lines.push(`#### 🔴 Críticos (${criticals.length})`);
    criticals.forEach(i => lines.push(`- [${i.category}] ${i.message} (${i.file ?? ''}:${i.line ?? ''})`));
    lines.push('');
  }
  if (mediums.length) {
    lines.push(`#### 🟡 Médios (${mediums.length})`);
    mediums.forEach(i => lines.push(`- [${i.category}] ${i.message} (${i.file ?? ''}:${i.line ?? ''})`));
    lines.push('');
  }
  if (lows.length) {
    lines.push(`#### 🟢 Melhorias (${lows.length})`);
    lows.forEach(i => lines.push(`- [${i.category}] ${i.message} (${i.file ?? ''}:${i.line ?? ''})`));
    lines.push('');
  }

  lines.push(`#### 🔧 Ações Recomendadas`);
  if (criticals.length) lines.push('1. Corrigir violações críticas IMEDIATAMENTE.');
  if (mediums.length)   lines.push('2. Resolver problemas médios para elevar o score.');
  if (lows.length)      lines.push('3. Eliminar anti-patterns para qualidade máxima.');

  fs.writeFileSync(path.join(ROOT_DIR, 'scripts/audit-report.md'), lines.join('\n'));
}

calculateScore().catch(err => { console.error(err); process.exit(1); });
