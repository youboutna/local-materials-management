#!/usr/bin/env node
/**
 * camelcase-dedup — supprime les doublons créés par le passage en camelCase :
 *  - TS2300 "Duplicate identifier" dans les interfaces DTO
 *  - TS1117 "object literal cannot have multiple properties with the same name"
 * Conserve la PREMIÈRE occurrence, supprime les suivantes.
 */
const { execSync } = require('child_process');
const fs = require('fs');

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
  const byFile = new Map();
  for (const raw of out.split('\n')) {
    const m = ERR.exec(raw.trim());
    if (!m) continue;
    const [, file, ln, col, code, msg] = m;
    if (code !== '2300' && code !== '1117') continue;
    const name = code === '2300' ? (/Duplicate identifier '([A-Za-z0-9_]+)'/.exec(msg) || [])[1] : null;
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file).push({ line: +ln, col: +col, name, code });
  }
  let removed = 0;
  for (const [file, list] of byFile) {
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    const toDelete = new Set();
    if (list.some((e) => e.code === '2300')) {
      // grouper par nom : garder la première ligne, supprimer les suivantes
      const groups = new Map();
      list.filter((e) => e.code === '2300').forEach((e) => {
        if (!groups.has(e.name)) groups.set(e.name, []);
        groups.get(e.name).push(e.line);
      });
      for (const nums of groups.values()) {
        nums.sort((a, b) => a - b).slice(1).forEach((n) => toDelete.add(n));
      }
    }
    // TS1117 : la ligne signalée est la propriété dupliquée -> supprimer
    list.filter((e) => e.code === '1117').forEach((e) => toDelete.add(e.line));
    if (!toDelete.size) continue;
    const kept = lines.filter((_, i) => !toDelete.has(i + 1));
    removed += lines.length - kept.length;
    fs.writeFileSync(file, kept.join('\n'));
  }
  return removed;
}

for (let i = 1; i <= 6; i++) {
  const removed = pass();
  console.log(`dedup pass ${i}: lignes supprimées=${removed}`);
  if (!removed) break;
}
