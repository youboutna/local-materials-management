#!/usr/bin/env node
/**
 * Branche le référentiel de libellés multilingues sur les fichiers qui déclarent les ENUM.
 *
 * Pour chaque `export enum X` d'un fichier source, ajoute (idempotent) :
 *   export const X_LABELS: Readonly<Record<X, EnumLabel>> = ENUM_LABELS.X as ...;
 * Le nom est suffixé `_I18N_LABELS` si `X_LABELS` existe déjà dans le fichier.
 */
const fs = require('fs');
const path = require('path');

const REF = 'src/config/referentials/i18n/enum-labels.referential.ts';
const src = fs.readFileSync(path.join(process.cwd(), REF), 'utf8');
const known = new Set([...src.matchAll(/^    (\w+): [A-Z_]+_LABELS,$/gm)].map((m) => m[1]));

const SKIP_FILES = [REF];
const snake = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

function walk(dir, acc = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, acc);
        else if (e.name.endsWith('.ts') && !e.name.endsWith('.d.ts')) acc.push(p);
    }
    return acc;
}

let touched = 0;
let consts = 0;
for (const file of walk(path.join(process.cwd(), 'src'))) {
    const rel = path.relative(process.cwd(), file);
    if (SKIP_FILES.includes(rel)) continue;
    let text = fs.readFileSync(file, 'utf8');
    const names = [...text.matchAll(/export enum (\w+)\s*\{/g)].map((m) => m[1]).filter((n) => known.has(n));
    if (!names.length) continue;

    const additions = [];
    for (const name of names) {
        const base = `${snake(name)}_LABELS`;
        const target = new RegExp(`export (const|\\{[^}]*)\\b${base}\\b`).test(text) ? `${snake(name)}_I18N_LABELS` : base;
        if (text.includes(`export const ${target}`)) continue;
        additions.push(
            `/** Libellés multilingues de ${name} (référentiel i18n — code technique inchangé). */\n` +
                `export const ${target}: Readonly<Record<${name}, EnumLabel>> =\n` +
                `    ENUM_LABELS.${name} as Readonly<Record<${name}, EnumLabel>>;`
        );
        consts++;
    }
    if (!additions.length) continue;

    if (!text.includes("enum-labels.referential")) {
        const importLine = `import { ENUM_LABELS, type EnumLabel } from '@/config/referentials/i18n/enum-labels.referential';`;
        const lines = text.split('\n');
        let end = -1;
        let i = 0;
        while (i < lines.length) {
            const l = lines[i];
            if (l.startsWith('import ')) {
                let depth = l.split('{').length - l.split('}').length;
                let j = i;
                while (depth > 0 && j + 1 < lines.length) {
                    j++;
                    depth += lines[j].split('{').length - lines[j].split('}').length;
                }
                end = j;
                i = j + 1;
            } else {
                i++;
                if (end >= 0 && l.trim() && !/^(\/\/|\/\*|\s*\*|import)/.test(l)) break;
            }
        }
        lines.splice(end + 1, 0, importLine);
        text = lines.join('\n');
    }

    text = `${text.replace(/\s*$/, '')}\n\n${additions.join('\n\n')}\n`;
    fs.writeFileSync(file, text);
    touched++;
}
console.log(`${touched} fichiers branchés, ${consts} constantes de libellés ajoutées`);
