#!/usr/bin/env node
/**
 * Codemod Phase 6 — remplace les noeuds texte JSX en clair par <T k="auto.*" />.
 * Les libellés français extraits alimentent src/locales/auto.fr.json (source de vérité),
 * puis scripts/i18n-translate.cjs produit auto.ar.json / auto.en.json.
 *
 * Usage: node scripts/i18n-codemod.cjs <fichier.tsx> [...]
 */
const fs = require('fs');
const path = require('path');

const LOCALE_DIR = path.join(process.cwd(), 'src/locales');
const FR_PATH = path.join(LOCALE_DIR, 'auto.fr.json');

const TEXT_NODE = />(\s*)([A-ZÀ-ÿ][A-Za-zÀ-ÿ0-9'’\-\s,\.\!\?\(\)%:]{1,80}?)(\s*)</g;

const slug = (s) =>
    s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 48);

fs.mkdirSync(LOCALE_DIR, { recursive: true });
const fr = fs.existsSync(FR_PATH) ? JSON.parse(fs.readFileSync(FR_PATH, 'utf8')) : {};

let totalReplaced = 0;
for (const file of process.argv.slice(2)) {
    if (!fs.existsSync(file)) continue;
    let src = fs.readFileSync(file, 'utf8');
    const ns = slug(path.basename(file, '.tsx'));
    let replaced = 0;

    src = src.replace(TEXT_NODE, (match, pre, text, post) => {
        const clean = text.trim();
        if (!/[A-Za-zÀ-ÿ]{3}/.test(clean)) return match;
        if (/^(https?:|www\.)/.test(clean)) return match;
        const key = `auto.${ns}.${slug(clean)}`;
        if (!key.endsWith('.')) fr[key] = clean;
        replaced += 1;
        return `>${pre}<T k="${key}" fallback="${clean.replace(/"/g, '&quot;')}" />${post}<`;
    });

    if (replaced > 0) {
        if (!/from '@\/components\/i18n\/T'/.test(src)) {
            const lastImport = src.lastIndexOf('\nimport ');
            const end = src.indexOf('\n', src.indexOf(';', lastImport));
            src = `${src.slice(0, end)}\nimport { T } from '@/components/i18n/T';${src.slice(end)}`;
        }
        fs.writeFileSync(file, src);
        console.log(`${file}: ${replaced} libellés`);
        totalReplaced += replaced;
    }
}

fs.writeFileSync(FR_PATH, `${JSON.stringify(fr, null, 2)}\n`);
console.log(`Total: ${totalReplaced} remplacements, ${Object.keys(fr).length} clés fr`);
