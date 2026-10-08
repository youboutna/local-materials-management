// scripts/zip-dist.mjs
import { createWriteStream, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Résolution robuste : couvre toutes les formes CJS/ESM que Node peut renvoyer
function loadArchiver() {
  const mod = require('archiver');
  const candidates = [mod, mod?.default, mod?.default?.default];
  for (const c of candidates) {
    if (typeof c === 'function') return c;
  }
  console.error('❌ Impossible de charger archiver. Reçu :', typeof mod, Object.keys(mod ?? {}));
  process.exit(1);
}

const archiver = loadArchiver();

const DIST_DIR = resolve(process.cwd(), 'dist');
const OUTPUT_ZIP = resolve(process.cwd(), `dist-${Date.now()}.zip`);

if (!existsSync(DIST_DIR)) {
  console.error("❌ Le dossier dist/ n'existe pas. Lancez d'abord : npm run build");
  process.exit(1);
}

const output = createWriteStream(OUTPUT_ZIP);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`\n✅ Archive créée : ${OUTPUT_ZIP}`);
  console.log(`   Taille  : ${sizeMB} MB`);
  console.log(`   Fichiers: ${countFiles(DIST_DIR)}`);
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') console.warn('⚠️ ', err);
  else throw err;
});

archive.on('error', (err) => {
  console.error('❌ Erreur archiver:', err);
  process.exit(1);
});

archive.pipe(output);
archive.directory(DIST_DIR, false);
archive.finalize().catch((err) => {
  console.error('❌ Erreur finalize:', err);
  process.exit(1);
});

function countFiles(dir) {
  let count = 0;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) count += countFiles(full);
    else count += 1;
  }
  return count;
}