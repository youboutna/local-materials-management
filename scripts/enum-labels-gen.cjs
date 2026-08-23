#!/usr/bin/env node
/**
 * Génère le référentiel de libellés multilingues (fr/ar/en) pour TOUS les ENUM du projet.
 *
 * Étapes :
 *  1. Scan de `src/**\/*.ts` pour extraire chaque `export enum X { KEY = 'value' }`
 *  2. Libellé fr dérivé du code (humanisation) puis traduction ar/en via Lovable AI Gateway
 *  3. Écriture de `src/locales/enums.{fr,ar,en}.json` (idempotent, seules les clés manquantes)
 *  4. Génération de `src/config/referentials/i18n/enum-labels.referential.ts`
 *
 * Doctrine : le code technique reste l'unique source de vérité ; seuls les LIBELLÉS sont traduits.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(process.cwd(), 'src');
const LOCALES = path.join(SRC, 'locales');
const OUT_TS = path.join(SRC, 'config/referentials/i18n/enum-labels.referential.ts');
const ENDPOINT = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const KEY = process.env.LOVABLE_API_KEY;

/** ENUM purement techniques (codes d'erreur, etc.) : jamais affichés brut à l'utilisateur. */
const SKIP = new Set(['ErrorCode']);

function walk(dir, acc = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, acc);
        else if (e.name.endsWith('.ts') && !e.name.endsWith('.d.ts')) acc.push(p);
    }
    return acc;
}

const ACRONYMS = { dqe: 'DQE', pv: 'PV', tva: 'TVA', ht: 'HT', ttc: 'TTC', wbs: 'WBS', hse: 'HSE', kpi: 'KPI', bpu: 'BPU', ao: 'AO' };
function humanize(code) {
    const words = String(code)
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .split(/[_\-\s]+/)
        .filter(Boolean)
        .map((w) => (ACRONYMS[w.toLowerCase()] ? ACRONYMS[w.toLowerCase()] : w.toLowerCase()));
    const s = words.join(' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/** @returns {Map<string, {file: string, members: Array<[string,string]>}>} */
function extractEnums() {
    const enums = new Map();
    for (const file of walk(SRC)) {
        const src = fs.readFileSync(file, 'utf8');
        const re = /export enum (\w+)\s*\{([\s\S]*?)\n\}/g;
        let m;
        while ((m = re.exec(src))) {
            const [, name, body] = m;
            if (SKIP.has(name)) continue;
            const members = [];
            for (const line of body.split('\n')) {
                const mm = line.match(/^\s*(\w+)\s*=\s*'([^']*)'/);
                if (mm) members.push([mm[1], mm[2]]);
            }
            if (!members.length) continue;
            if (!enums.has(name)) enums.set(name, { file: path.relative(process.cwd(), file), members });
        }
    }
    return enums;
}

const loadJson = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {});

async function translateBatch(entries, lang) {
    const langName = lang === 'ar' ? 'arabe' : lang === 'en' ? 'anglais' : 'français';
    const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
                {
                    role: 'system',
                    content:
                        `Tu produis les libellés d'interface en ${langName} pour des statuts/types métier d'une application de gestion de projets BTP (Mauritanie). ` +
                        'Les clés ont la forme enum.<NomEnum>.<code>; la valeur fournie est une humanisation brute du code (souvent en anglais). ' +
                        `Rends un libellé métier NATUREL en ${langName}, adapté au contexte indiqué par le nom de l'ENUM. ` +
                        "Réponds STRICTEMENT en JSON: un objet {clé: traduction}. Conserve les clés à l'identique. Libellés courts, sans ponctuation finale.",
                },
                { role: 'user', content: JSON.stringify(Object.fromEntries(entries)) },
            ],
        }),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const raw = (await res.json()).choices[0].message.content.replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
}

function emitTs(enums, labels) {
    const q = (s) => `'${String(s).replace(/'/g, "\\'")}'`;
    const lines = [
        '/**',
        ' * RÉFÉRENTIEL — Libellés multilingues des ENUM (généré par scripts/enum-labels-gen.cjs).',
        ' *',
        " * Doctrine i18n : l'ENUM porte le CODE TECHNIQUE unique (source de vérité, jamais traduit),",
        ' * ce référentiel porte les LIBELLÉS fr/ar/en affichés dans l\'UI.',
        ' * Ne pas éditer à la main : relancer `node scripts/enum-labels-gen.cjs`.',
        ' */',
        '',
        "export type SupportedLang = 'fr' | 'ar' | 'en';",
        '',
        'export interface EnumLabel {',
        '    readonly fr: string;',
        '    readonly ar: string;',
        '    readonly en: string;',
        '}',
        '',
        'export type EnumLabelMap = Readonly<Record<string, EnumLabel>>;',
        '',
    ];
    const names = [...enums.keys()].sort();
    for (const name of names) {
        const { file, members } = enums.get(name);
        lines.push(`/** ${name} — ${file} */`);
        lines.push(`export const ${name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase()}_LABELS: EnumLabelMap = {`);
        const seen = new Set();
        for (const [, value] of members) {
            if (seen.has(value)) continue;
            seen.add(value);
            const k = `enum.${name}.${value}`;
            const l = labels.fr[k] ? { fr: labels.fr[k], ar: labels.ar[k] || labels.fr[k], en: labels.en[k] || labels.fr[k] } : null;
            if (!l) continue;
            lines.push(`    ${q(value)}: { fr: ${q(l.fr)}, ar: ${q(l.ar)}, en: ${q(l.en)} },`);
        }
        lines.push('};');
        lines.push('');
    }
    lines.push('/** Registre global : nom d\'ENUM -> libellés. */');
    lines.push('export const ENUM_LABELS: Readonly<Record<string, EnumLabelMap>> = {');
    for (const name of names) {
        lines.push(`    ${name}: ${name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase()}_LABELS,`);
    }
    lines.push('};');
    lines.push('');
    lines.push('/** Libellé d\'un code ENUM dans la langue demandée (fallback fr puis code). */');
    lines.push('export function getEnumLabel(enumName: string, code: string | null | undefined, lang: SupportedLang = \'fr\'): string {');
    lines.push('    if (!code) return \'\';');
    lines.push('    const entry = ENUM_LABELS[enumName]?.[code];');
    lines.push('    return entry ? entry[lang] || entry.fr : code;');
    lines.push('}');
    lines.push('');
    lines.push('/** Options prêtes pour un Select : { value, label }. */');
    lines.push('export function getEnumOptions(enumName: string, lang: SupportedLang = \'fr\'): Array<{ value: string; label: string }> {');
    lines.push('    const map = ENUM_LABELS[enumName] ?? {};');
    lines.push('    return Object.keys(map).map((value) => ({ value, label: map[value][lang] || map[value].fr }));');
    lines.push('}');
    lines.push('');
    fs.mkdirSync(path.dirname(OUT_TS), { recursive: true });
    fs.writeFileSync(OUT_TS, lines.join('\n'));
}

(async () => {
    const enums = extractEnums();
    const files = { fr: path.join(LOCALES, 'enums.fr.json'), ar: path.join(LOCALES, 'enums.ar.json'), en: path.join(LOCALES, 'enums.en.json') };
    const labels = { fr: loadJson(files.fr), ar: loadJson(files.ar), en: loadJson(files.en) };

    let added = 0;
    for (const [name, { members }] of enums) {
        for (const [key, value] of members) {
            const k = `enum.${name}.${value}`;
            if (!labels.fr[k]) {
                labels.fr[k] = humanize(key);
                added++;
            }
        }
    }
    fs.mkdirSync(LOCALES, { recursive: true });
    fs.writeFileSync(files.fr, `${JSON.stringify(labels.fr, null, 2)}\n`);

    // Passe fr : les codes ENUM sont anglais -> produire de vrais libellés métier français.
    const frRaw = Object.entries(labels.fr).filter(([, v]) => !labels.frDone || !labels.frDone[v]);
    if (KEY && process.env.FR_PASS !== 'skip') {
        const done = loadJson(path.join(LOCALES, 'enums.fr.done.json'));
        const todo = frRaw.filter(([k]) => !done[k]);
        console.log(`fr: ${todo.length} libellés à naturaliser`);
        for (let i = 0; i < todo.length; i += 60) {
            const batch = todo.slice(i, i + 60);
            try {
                const out = await translateBatch(batch, 'fr');
                for (const [k, v] of Object.entries(out)) {
                    if (typeof v === 'string' && v.trim()) { labels.fr[k] = v.trim(); done[k] = v.trim(); }
                }
            } catch (e) {
                console.error(`  échec lot fr ${i}: ${e.message}`);
            }
            fs.writeFileSync(files.fr, `${JSON.stringify(labels.fr, null, 2)}\n`);
            fs.writeFileSync(path.join(LOCALES, 'enums.fr.done.json'), `${JSON.stringify(done, null, 2)}\n`);
        }
    }
    console.log(`${enums.size} ENUM, ${Object.keys(labels.fr).length} libellés fr (${added} nouveaux)`);

    if (KEY) {
        for (const lang of ['ar', 'en']) {
            const missing = Object.entries(labels.fr).filter(([k]) => !labels[lang][k]);
            console.log(`${lang}: ${missing.length} à traduire`);
            for (let i = 0; i < missing.length; i += 60) {
                const batch = missing.slice(i, i + 60);
                try {
                    Object.assign(labels[lang], await translateBatch(batch, lang));
                } catch (e) {
                    console.error(`  échec lot ${i}: ${e.message}`);
                }
                fs.writeFileSync(files[lang], `${JSON.stringify(labels[lang], null, 2)}\n`);
            }
        }
    } else {
        console.warn('LOVABLE_API_KEY absente : ar/en non traduits ce run.');
    }

    emitTs(enums, labels);
    console.log(`écrit ${path.relative(process.cwd(), OUT_TS)}`);
})();
