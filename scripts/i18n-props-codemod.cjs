#!/usr/bin/env node
/**
 * Codemod Phase 6 / Lot 5 — remplace les props textuelles en clair
 * (placeholder, title, label, description, aria-label, emptyMessage, tooltip)
 * par `t('auto.<ns>.<slug>')` et injecte `useLanguage()` dans le composant.
 *
 * Les libellés français alimentent src/locales/auto.fr.json (source de vérité).
 * Usage: node scripts/i18n-props-codemod.cjs <fichier.tsx> [...]
 */
const fs = require('fs');
const path = require('path');

const LOCALE_DIR = path.join(process.cwd(), 'src/locales');
const FR_PATH = path.join(LOCALE_DIR, 'auto.fr.json');
const PROPS = ['placeholder', 'title', 'label', 'description', 'aria-label', 'emptyMessage', 'tooltip', 'searchPlaceholder', 'emptyLabel'];
const PROP_RE = new RegExp(`(\\s)(${PROPS.join('|')})="([A-ZÀ-ÿ][^"{}<>]{2,90})"`, 'g');

const slug = (s) =>
    s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 48);

const fr = fs.existsSync(FR_PATH) ? JSON.parse(fs.readFileSync(FR_PATH, 'utf8')) : {};

/** Injecte `const { t } = useLanguage();` dans le premier composant React du fichier. */
function injectHook(src) {
    if (/useLanguage\(\)/.test(src)) return src;
    const compRe = /(const\s+[A-Z][A-Za-z0-9_]*(?::\s*[^=]+)?\s*=\s*\([^)]*\)\s*(?::\s*[^=]+)?=>\s*\{|function\s+[A-Z][A-Za-z0-9_]*\s*\([^)]*\)\s*\{)/;
    const m = compRe.exec(src);
    if (!m) return null;
    const at = m.index + m[0].length;
    let out = `${src.slice(0, at)}\n  const { t } = useLanguage();${src.slice(at)}`;
    if (!/from '@\/contexts\/LanguageContext'/.test(out)) {
        const lastImport = out.lastIndexOf('\nimport ');
        const end = out.indexOf('\n', out.indexOf(';', lastImport));
        out = `${out.slice(0, end)}\nimport { useLanguage } from '@/contexts/LanguageContext';${out.slice(end)}`;
    }
    return out;
}

let total = 0;
for (const file of process.argv.slice(2)) {
    if (!fs.existsSync(file)) continue;
    let src = fs.readFileSync(file, 'utf8');
    const ns = slug(path.basename(file, '.tsx'));
    let replaced = 0;

    const next = src.replace(PROP_RE, (match, ws, prop, text) => {
        const clean = text.trim();
        if (!/[A-Za-zÀ-ÿ]{3}/.test(clean)) return match;
        const key = `auto.${ns}.${slug(clean)}`;
        fr[key] = clean;
        replaced += 1;
        return `${ws}${prop}={t('${key}')}`;
    });

    if (replaced > 0) {
        const withHook = injectHook(next);
        if (!withHook) {
            console.log(`${file}: SKIP (composant non détecté)`);
            continue;
        }
        fs.writeFileSync(file, withHook);
        console.log(`${file}: ${replaced} props`);
        total += replaced;
    }
}

fs.writeFileSync(FR_PATH, `${JSON.stringify(fr, null, 2)}\n`);
console.log(`Total: ${total} props, ${Object.keys(fr).length} clés fr`);
