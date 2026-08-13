import React from 'react';
import { describe, expect, it } from 'vitest';
import { ReportFooter, ReportHeader } from '../ReportPageFrame';

/**
 * Tests de non-régression sur la structure des rapports (section 8 du plan) :
 *  T1 en-tête complet en page 1 uniquement
 *  T2 en-tête allégé sur les pages suivantes
 *  T3/T4 pagination « Page X / Y » sur chaque page
 *  T5 page 1 non vide (le bloc de synthèse est rendu dans le flux)
 */

type Node = React.ReactElement<any> | null | undefined | string | number | boolean;

const walk = (node: any, visit: (el: React.ReactElement<any>) => void) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, visit));
    return;
  }
  visit(node);
  walk(node.props?.children, visit);
};

const texts = (node: Node): string[] => {
  const out: string[] = [];
  walk(node, (el) => {
    const c = el.props?.children;
    if (typeof c === 'string') out.push(c);
    if (Array.isArray(c)) c.filter((x) => typeof x === 'string').forEach((x: string) => out.push(x));
  });
  return out;
};

const findRenderProps = (node: Node) => {
  const out: Array<(p: any) => any> = [];
  walk(node, (el) => {
    if (typeof el.props?.render === 'function') out.push(el.props.render);
  });
  return out;
};

const COMPANY = {
  name: 'Direction Générale',
  address: 'Nouakchott',
  phone: '+222 00 00 00 00',
  email: 'contact@dgeer.mr',
};

describe('Structure des rapports PDF', () => {
  const header = ReportHeader({ title: 'Rapport Projet', subtitle: 'Boucle 33 kV', company: COMPANY });

  it('T1/T5 — rend l’en-tête organisationnel complet dans le flux de la page 1', () => {
    const flat = texts(header);
    expect(flat).toContain(COMPANY.name);
    expect(flat).toContain(COMPANY.address);
    expect(flat.some((t) => t.includes('Boucle 33 kV'))).toBe(true);
  });

  it('T2 — l’en-tête allégé est absolu, fixe, et vide en page 1', () => {
    const renders = findRenderProps(header);
    expect(renders.length).toBe(1);
    expect(renders[0]({ pageNumber: 1 })).toBeNull();
    const page2 = renders[0]({ pageNumber: 2 });
    expect(texts(page2)).toContain('Rapport Projet');

    let lightStyle: any = null;
    walk(header, (el) => {
      if (typeof el.props?.render === 'function') lightStyle = el.props.style;
    });
    // hauteur nulle dans le flux => aucune régression « page 1 vide »
    expect(lightStyle?.position).toBe('absolute');
  });

  it('T1 — l’en-tête complet est omis quand showFullHeader=false', () => {
    const secondary = ReportHeader({ title: 'Rapport Projet', company: COMPANY, showFullHeader: false });
    expect(texts(secondary)).not.toContain(COMPANY.name);
    expect(findRenderProps(secondary).length).toBe(1);
  });

  it('T3/T4 — pied de page paginé « Page X / Y » sur chaque page', () => {
    const footer = ReportFooter({});
    const renders = findRenderProps(footer);
    expect(renders.length).toBe(1);
    expect(renders[0]({ pageNumber: 1, totalPages: 6 })).toBe('Page 1 / 6');
    expect(renders[0]({ pageNumber: 6, totalPages: 6 })).toBe('Page 6 / 6');
    expect((footer as any).props.fixed).toBe(true);
  });
});
