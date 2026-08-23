#!/usr/bin/env node
/**
 * Codemod Phase 6 / Lot 5 — traduit les propriétés d'objets littéraux
 * (label / placeholder / title / description / scopeLabel / message ...)
 * situées DANS un composant React ou un hook (`useXxx`), donc là où `t()` est disponible.
 *
 * Usage: node scripts/i18n-objprops-codemod.cjs <fichier.tsx> [...]
 */
const fs = require('fs');
const path = require('path');

const LOCALE_DIR = path.join(process.cwd(), 'src/locales');
const FR_PATH = path.join(LOCALE_DIR, 'auto.fr.json');
const KEYS = ['label', 'placeholder', 'title', 'description', 'scopeLabel', 'emptyMessage', 'message', 'tooltip', 'name', 'helpText'];
const OBJ_RE = new RegExp(`(\\s)(${KEYS.join('|')}):\\s*'([A-ZÀ-ÿ][^'\\\\]{2,90})'`, 'g');

const slug = (s) =>
    s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 48);

const fr = fs.existsSync(FR_PATH) ? JSON.parse(fs.readFileSync(FR_PATH, 'utf8')) : {};

const COMP_RE = /(const\s+[A-Z][A-Za-z0-9_]*(?::\s*[^=]+)?\s*=\s*\([^)]*\)\s*(?::\s*[^=]+)?=>\s*\{|function\s+[A-Z][A-Za-z0-9_]*\s*\([^)]*\)\s*\{|export\s+function\s+use[A-Z][A-Za-z0-9_]*\s*\(|function\s+use[A-Z][A-Za-z0-9_]*\s*\(|const\s+use[A-Z][A-Za-z0-9_]*\s*=\s*\()/;

let total = 0;
for (const file of process.argv.slice(2)) {
    if (!fs.existsSync(file)) continue;
    let src = fs.readFileSync(file, 'utf8');
    const ns = slug(path.basename(file, '.tsx'));
    const m = COMP_RE.exec(src);
    if (!m) continue;
    const bodyStart = m.index;
    let replaced = 0;

    let next = src.replace(OBJ_RE, (match, ws, prop, text, offset) => {
        if (offset < bodyStart) return match;
        const clean = text.trim();
        if (!/[A-Za-zÀ-ÿ]{3}/.test(clean)) return match;
        const key = `auto.${ns}.${slug(clean)}`;
        fr[key] = clean;
        replaced += 1;
        return `${ws}${prop}: t('${key}')`;
    });

    if (!replaced) continue;

    if (!/useLanguage\(\)/.test(next)) {
        // point d'insertion : première accolade du corps de la fonction détectée
        const brace = next.indexOf('{', m.index + m[0].length - 1);
        const at = next.indexOf('\n', brace) + 1;
        next = `${next.slice(0, at)}  const { t } = useLanguage();\n${next.slice(at)}`;
        if (!/from '@\/contexts\/LanguageContext'/.test(next)) {
            next = `import { useLanguage } from '@/contexts/LanguageContext';\n${next}`;
        }
    }

    fs.writeFileSync(file, next);
    console.log(`${file}: ${replaced} propriétés`);
    total += replaced;
}

fs.writeFileSync(FR_PATH, `${JSON.stringify(fr, null, 2)}\n`);
console.log(`Total: ${total} propriétés, ${Object.keys(fr).length} clés fr`);
