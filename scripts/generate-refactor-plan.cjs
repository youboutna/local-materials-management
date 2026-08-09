#!/usr/bin/env node
/**
 * Génère scripts/plan-refactor.json : liste des fichiers à modifier issue de
 * scripts/rapport-audit.json, classée par priorité (P0 -> P3).
 * Usage: node scripts/generate-refactor-plan.js [--report scripts/rapport-audit.json]
 */
const fs = require('fs');
const path = require('path');

const reportPath = process.argv.includes('--report')
  ? process.argv[process.argv.indexOf('--report') + 1]
  : 'scripts/rapport-audit.json';

const report = JSON.parse(fs.readFileSync(path.resolve(reportPath), 'utf8'));

// Poids métier par règle : plus le poids est fort, plus le fichier remonte.
const RULE_META = {
  'P0-SUP001': { priority: 'P0', weight: 100, lot: 'A-supabase-hors-adapter' },
  'P0-DB001': { priority: 'P0', weight: 100, lot: 'A-supabase-hors-adapter' },
  'P0-M001': { priority: 'P0', weight: 90, lot: 'B-mocks-et-todo' },
  'M001': { priority: 'P0', weight: 85, lot: 'B-mocks-et-todo' },
  'M002': { priority: 'P1', weight: 40, lot: 'B-mocks-et-todo' },
  'M003': { priority: 'P1', weight: 35, lot: 'B-mocks-et-todo' },
  'L003': { priority: 'P1', weight: 50, lot: 'C-couches' },
  'L004': { priority: 'P2', weight: 12, lot: 'C-couches' },
  'P1-TRF001': { priority: 'P1', weight: 45, lot: 'D-transformers' },
  'P1-TRF002': { priority: 'P2', weight: 15, lot: 'D-transformers' },
  'P2-CAS002': { priority: 'P1', weight: 30, lot: 'E-dto-camelcase' },
  'D001': { priority: 'P1', weight: 25, lot: 'F-types-dupliques' },
  'P1-TYP001': { priority: 'P2', weight: 10, lot: 'F-types-dupliques' },
  'P0-ANY001': { priority: 'P2', weight: 8, lot: 'G-any' },
  'P2-CAS001': { priority: 'P3', weight: 1, lot: 'H-bruit-snake-case' },
  'S001': { priority: 'P3', weight: 1, lot: 'H-bruit-snake-case' },
};
const DEFAULT_META = { priority: 'P3', weight: 1, lot: 'H-bruit-snake-case' };
const ORDER = { P0: 0, P1: 1, P2: 2, P3: 3 };

const scoreByFile = new Map((report.fileScores || []).map((f) => [f.file, f]));

const files = (report.violations || []).map((entry) => {
  const rules = {};
  let weight = 0;
  const lots = new Set();
  for (const v of entry.violations) {
    const meta = RULE_META[v.ruleId] || DEFAULT_META;
    rules[v.ruleId] = rules[v.ruleId] || {
      priority: meta.priority,
      lot: meta.lot,
      severity: v.severity,
      count: 0,
      lines: [],
    };
    rules[v.ruleId].count++;
    if (rules[v.ruleId].lines.length < 20) rules[v.ruleId].lines.push(v.line);
    weight += meta.weight;
    lots.add(meta.lot);
  }
  const priority = Object.values(rules)
    .map((r) => r.priority)
    .sort((a, b) => ORDER[a] - ORDER[b])[0];
  const meta = scoreByFile.get(entry.file) || {};
  return {
    file: entry.file,
    priority,
    weight,
    layer: meta.layer || null,
    type: meta.type || null,
    score: meta.score ?? null,
    violations: entry.violations.length,
    lots: [...lots].sort(),
    rules,
    status: 'todo',
  };
});

files.sort((a, b) => ORDER[a.priority] - ORDER[b.priority] || b.weight - a.weight);

const byPriority = {};
const byLot = {};
for (const f of files) {
  byPriority[f.priority] = (byPriority[f.priority] || 0) + 1;
  for (const lot of f.lots) byLot[lot] = (byLot[lot] || 0) + 1;
}

const plan = {
  generatedAt: new Date().toISOString(),
  source: reportPath,
  reportTimestamp: report.timestamp,
  stats: report.stats,
  summary: { totalFiles: files.length, byPriority, byLot },
  lots: Object.fromEntries(
    Object.entries(
      Object.values(RULE_META).reduce((acc, m) => {
        acc[m.lot] = acc[m.lot] || { priority: m.priority, rules: [] };
        if (ORDER[m.priority] < ORDER[acc[m.lot].priority]) acc[m.lot].priority = m.priority;
        return acc;
      }, {})
    ).map(([lot, d]) => [
      lot,
      { priority: d.priority, rules: Object.entries(RULE_META).filter(([, m]) => m.lot === lot).map(([id]) => id) },
    ])
  ),
  files,
};

fs.writeFileSync('scripts/plan-refactor.json', JSON.stringify(plan, null, 2));
console.log('plan-refactor.json écrit :', files.length, 'fichiers');
console.table(Object.entries(byPriority).map(([p, c]) => ({ priorite: p, fichiers: c })));
console.table(Object.entries(byLot).map(([lot, c]) => ({ lot, fichiers: c })));
console.log('\nTop P0/P1 :');
console.table(files.filter((f) => f.priority !== 'P2' && f.priority !== 'P3').slice(0, 30).map((f) => ({ file: f.file, priority: f.priority, weight: f.weight, lots: f.lots.join(',') })));
