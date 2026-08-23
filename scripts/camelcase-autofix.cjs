#!/usr/bin/env node
/**
 * camelcase-autofix — applique en boucle les suggestions du compilateur TypeScript
 * ("Did you mean 'xxYy'?") pour finaliser le passage des DTOs en camelCase.
 *
 * Usage: node scripts/camelcase-autofix.cjs [maxPasses]
 *
 * Ne touche que les positions signalées par tsgo : aucune réécriture aveugle.
 */
const { execSync } = require('child_process');
const fs = require('fs');

const MAX = parseInt(process.argv[2] || '12', 10);
const CODES = new Set(['2551', '2561', '2339', '2724']);

function typecheck() {
  try {
    return execSync('bunx tsgo --noEmit -p tsconfig.app.json', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    return (e.stdout || '') + (e.stderr || '');
  }
}

const ERR = /^(.+?)\((\d+),(\d+)\): error TS(\d+): (.*)$/;

function pass() {
  const out = typecheck();
  const edits = new Map(); // file -> [{line, col, from, to}]
  let total = 0;
  let fixable = 0;
  for (const line of out.split('\n')) {
    const m = ERR.exec(line.trim());
    if (!m) continue;
    total++;
    const [, file, ln, col, code, msg] = m;
    if (!CODES.has(code)) continue;
    const from = /'([A-Za-z0-9_]+)' does not exist|specify known properties, but '([A-Za-z0-9_]+)'/.exec(msg);
    const to = /Did you mean (?:to write )?'([A-Za-z0-9_]+)'\?/.exec(msg);
    if (!from || !to) continue;
    const oldName = from[1] || from[2];
    const newName = to[1];
    // sécurité : même mot, seule la casse/les underscores changent (bidirectionnel)
    if (oldName.replace(/_/g, '').toLowerCase() !== newName.replace(/_/g, '').toLowerCase()) continue;
    if (oldName === newName) continue;
    fixable++;
    if (!edits.has(file)) edits.set(file, []);
    edits.get(file).push({ line: +ln, col: +col, oldName, newName });
  }

  let applied = 0;
  for (const [file, list] of edits) {
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    // appliquer de la fin vers le début pour préserver les colonnes
    list.sort((a, b) => b.line - a.line || b.col - a.col);
    for (const e of list) {
      const idx = e.line - 1;
      const l = lines[idx];
      if (l === undefined) continue;
      const start = e.col - 1;
      if (l.slice(start, start + e.oldName.length) === e.oldName) {
        lines[idx] = l.slice(0, start) + e.newName + l.slice(start + e.oldName.length);
        applied++;
      }
    }
    fs.writeFileSync(file, lines.join('\n'));
  }
  return { total, fixable, applied };
}

let prev = -1;
for (let i = 1; i <= MAX; i++) {
  const { total, fixable, applied } = pass();
  console.log(`pass ${i}: erreurs=${total} corrigeables=${fixable} appliquées=${applied}`);
  if (applied === 0 || total === prev) break;
  prev = total;
}
const finalOut = typecheck();
const remaining = finalOut.split('\n').filter((l) => l.includes('error TS'));
console.log(`\nerreurs restantes: ${remaining.length}`);
console.log(remaining.slice(0, 40).join('\n'));
