#!/usr/bin/env node
/**
 * Traduit src/locales/auto.fr.json vers auto.ar.json / auto.en.json via Lovable AI Gateway.
 * Ne traduit que les clés manquantes (idempotent).
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(process.cwd(), 'src/locales');
const load = (f) => (fs.existsSync(path.join(DIR, f)) ? JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')) : {});
const fr = load('auto.fr.json');

const ENDPOINT = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const KEY = process.env.LOVABLE_API_KEY;

async function translateBatch(entries, lang) {
    const langName = lang === 'ar' ? 'arabe' : 'anglais';
    const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
                {
                    role: 'system',
                    content:
                        `Tu traduis des libellés d'interface d'une application de gestion de projets BTP du français vers l'${langName}. ` +
                        'Réponds STRICTEMENT en JSON: un objet {clé: traduction}. Conserve les clés à l\'identique. Pas de commentaire.',
                },
                { role: 'user', content: JSON.stringify(Object.fromEntries(entries)) },
            ],
        }),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const json = await res.json();
    const raw = json.choices[0].message.content.replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
}

(async () => {
    for (const lang of ['ar', 'en']) {
        const file = `auto.${lang}.json`;
        const current = load(file);
        const missing = Object.entries(fr).filter(([k]) => !current[k]);
        console.log(`${lang}: ${missing.length} clés à traduire`);
        for (let i = 0; i < missing.length; i += 60) {
            const batch = missing.slice(i, i + 60);
            try {
                Object.assign(current, await translateBatch(batch, lang));
                console.log(`  ${lang} ${i + batch.length}/${missing.length}`);
            } catch (e) {
                console.error(`  échec lot ${i}: ${e.message}`);
            }
            fs.writeFileSync(path.join(DIR, file), `${JSON.stringify(current, null, 2)}\n`);
        }
    }
})();
