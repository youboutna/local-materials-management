/**
 * T39/T41 — Garde anti-régression : aucun code technique ni acronyme non explicité
 * ne doit être rendu brut dans l'UI (pages et composants).
 *
 * Le scan est statique (lecture des sources) : il verrouille le résultat du
 * branchement i18n des phases 6 / 6.1 sans dépendre d'un navigateur.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'src');

const listTsx = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return listTsx(full);
    return full.endsWith('.tsx') ? [full] : [];
  });

/** Retire commentaires et chaînes d'attributs pour ne garder que le rendu. */
const stripNonRendered = (source: string): string =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const files = listTsx(ROOT);

describe('i18n — aucun code technique rendu brut', () => {
  it('T-V-36 : pas de rendu brut de status/priority/severity/category/unit/role/department', () => {
    const rawRender = /\{\s*[A-Za-z_$][\w$?.]*\.(status|priority|severity|category|unit|role|department)\s*\}/;
    // Exceptions justifiées : codes HTTP numériques du monitoring technique.
    const allowed = ['HttpMonitor.tsx', 'PerformanceMetrics.tsx'];
    const offenders = files
      .filter((f) => !allowed.some((a) => f.endsWith(a)))
      .filter((f) => rawRender.test(stripNonRendered(readFileSync(f, 'utf-8'))))
      .map((f) => f.replace(`${process.cwd()}/`, ''));
    expect(offenders).toEqual([]);
  });

  it('T-V-37 : l’acronyme « WBS » n’apparaît plus dans le texte rendu', () => {
    const offenders = files
      .filter((f) => {
        const src = stripNonRendered(readFileSync(f, 'utf-8'));
        // « WBS » toléré dans les identifiants/valeurs techniques (value="wbs", XML d'import)
        return /(>[^<>{}]*\bWBS\b|\bWBS\b[^<>{}]*<\/)/.test(src);
      })
      .map((f) => f.replace(`${process.cwd()}/`, ''));
    expect(offenders).toEqual([]);
  });

  it('T-V-38 : les listes de sélection de statut/priorité utilisent les référentiels', () => {
    const hardcoded =
      /<SelectItem value="(draft|pending|in_progress|completed|approved|rejected|low|medium|high|critical)"[^>]*>\s*[A-Za-zÀ-ÿ]/;
    const offenders = files
      .filter((f) => hardcoded.test(stripNonRendered(readFileSync(f, 'utf-8'))))
      .map((f) => f.replace(`${process.cwd()}/`, ''));
    expect(offenders).toEqual([]);
  });
});
