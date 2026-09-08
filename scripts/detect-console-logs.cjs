#!/usr/bin/env node
/**
 * detect-console-logs.cjs — inventaire des appels console.* restants.
 *
 * Règle d'or : toute trace passe par LoggerService (`logger.debug/info/warning/error`).
 * Ce script liste les fichiers fautifs et le remplacement attendu, sans modifier le code.
 *
 * Usage: node scripts/detect-console-logs.cjs [--fail]
 */
const { execSync } = require('node:child_process');

const MAPPING = {
  'console.log': 'logger.debug | logger.info',
  'console.info': 'logger.info',
  'console.warn': 'logger.warning',
  'console.error': 'logger.error',
  'console.debug': 'logger.debug',
};

// Fichiers légitimes : le logger lui-même et le filtre console.
const ALLOWLIST = [
  'src/application/services/LoggerService.ts',
  'src/utils/console-filter.ts',
  'src/utils/error-capture.ts',
];

let raw = '';
try {
  raw = execSync(
    "rg -n --no-heading -g 'src/**/*.{ts,tsx}' -g '!**/*.test.*' 'console\\.(log|info|warn|error|debug)\\(' .",
    { encoding: 'utf-8' },
  );
} catch {
  raw = '';
}

const rows = raw
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [file, lineNo, ...rest] = line.split(':');
    return { file: file.replace(/^\.\//, ''), lineNo, code: rest.join(':').trim() };
  })
  .filter((row) => !ALLOWLIST.some((allowed) => row.file.endsWith(allowed)));

const byFile = rows.reduce((acc, row) => {
  acc[row.file] = (acc[row.file] || 0) + 1;
  return acc;
}, {});

console.log(`Appels console.* hors LoggerService : ${rows.length}\n`);
Object.entries(byFile)
  .sort((a, b) => b[1] - a[1])
  .forEach(([file, count]) => console.log(`${String(count).padStart(4)}  ${file}`));

console.log('\nRemplacements attendus :');
Object.entries(MAPPING).forEach(([from, to]) => console.log(`  ${from}() -> ${to}()`));

if (process.argv.includes('--fail') && rows.length > 0) process.exit(1);
