/**
 * Scénarios fonctionnels du parser intelligent DQE (spec v2.0) :
 * métré volumique + recommandations (3 & 8), récapitulatif multi-taux (5),
 * tableaux HTML et texte brut (formats d'entrée).
 */
import { describe, expect, it } from 'vitest';
import { detectMetre } from '../parsers/metreDetection';
import { BoqFiscalRecapService } from '../BoqFiscalRecapService';
import { TextTableBoqParser, parseDelimitedText, parseHtmlTable } from '../parsers/TextTableBoqParser';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

describe('Scénario 3 & 8 — métré et recommandations', () => {
  it('calcule le volume d’un terrassement saisi au mètre linéaire', () => {
    const m = detectMetre({ designation: 'Terrassement et fouilles (Réseaux)', unit: 'm', quantity: 3500 });
    expect(m).not.toBeNull();
    expect(m!.profileCode).toBe('TERRASSEMENT');
    expect(m!.volume).toBe(13125);
    const remblai = m!.recommendations.find((r) => r.code === 'REMBLAI');
    expect(remblai?.quantity).toBe(3937.5);
    expect(remblai?.priority).toBe('HIGH');
    expect(m!.recommendations.find((r) => r.code === 'REGARDS')?.quantity).toBe(70);
  });

  it('privilégie la tranchée et les dimensions du libellé', () => {
    const trench = detectMetre({ designation: 'Terrassement en tranchée réseaux', unit: 'ml', quantity: 100 });
    expect(trench?.profileCode).toBe('TRANCHEE');
    expect(trench?.volume).toBe(96);

    const custom = detectMetre({ designation: 'Tranchée (Larg. 0.5m, prof. 1.0m)', unit: 'm', quantity: 200 });
    expect(custom?.volume).toBe(100);
    expect(custom?.fromDesignation).toBe(true);
  });

  it('ignore les lignes hors terrassement ou déjà volumiques', () => {
    expect(detectMetre({ designation: 'Câble U-1000 RO2V 4x150 mm²', unit: 'm', quantity: 2000 })).toBeNull();
    expect(detectMetre({ designation: 'Terrassement', unit: 'm3', quantity: 500 })).toBeNull();
  });
});

describe('Scénario 5 — récapitulatif multi-taux', () => {
  const line = (o: Partial<BoqLineDTO>): BoqLineDTO =>
    ({ source: 'dqe', contextId: 'p', designation: 'x', unit: 'u', quantity: 1, ...o } as BoqLineDTO);

  it('regroupe matériel 5 % et RH 16 %', () => {
    const recap = BoqFiscalRecapService.build([
      line({ totalHt: 2079505, vatRate: 0.05, resourceType: 'material' }),
      line({ totalHt: 7200000, vatRate: 0.16, resourceType: 'labor' }),
    ]);
    expect(recap.multiRate).toBe(true);
    expect(recap.groups).toHaveLength(2);
    expect(recap.groups[0].vatAmount).toBe(103975.25);
    expect(recap.groups[1].block).toBe('labour');
    expect(recap.groups[1].vatAmount).toBe(1152000);
    expect(recap.totalHt).toBe(9279505);
  });

  it('déduit le HT depuis quantité × PU quand le total manque', () => {
    const recap = BoqFiscalRecapService.build([line({ quantity: 10, unitPrice: 100, vatRate: 5 })]);
    expect(recap.totalHt).toBe(1000);
    expect(recap.groups[0].vatRate).toBe(0.05);
    expect(recap.multiRate).toBe(false);
  });
});

describe('Formats texte et HTML', () => {
  it('lit un tableau HTML', () => {
    const matrix = parseHtmlTable(
      '<table><tr><th>Désignation</th><th>Unité</th><th>Qté</th><th>P.U</th></tr>' +
        '<tr><td>Câble&nbsp;BT</td><td>km</td><td>5</td><td>25000</td></tr></table>',
    );
    expect(matrix[0][0]).toBe('Désignation');
    expect(matrix[1]).toEqual(['Câble BT', 'km', '5', '25000']);
  });

  it('découpe un texte collé et ignore les séparateurs', () => {
    const matrix = parseDelimitedText('Désignation;Unité;Qté\n-----\nCâble BT;km;5');
    expect(matrix).toEqual([['Désignation', 'Unité', 'Qté'], ['Câble BT', 'km', '5']]);
  });

  it('parse un fichier HTML complet en lignes DQE', async () => {
    const html =
      '<html><body><table><tr><th>Désignation</th><th>Unité</th><th>Quantité</th><th>P.U</th><th>Montant</th></tr>' +
      '<tr><td>Câble U-1000 RO2V</td><td>m</td><td>2000</td><td>1,6</td><td>3200</td></tr>' +
      '<tr><td>4x150 mm²</td><td></td><td></td><td></td><td></td></tr>' +
      '<tr><td>Total HT</td><td></td><td></td><td></td><td>3200</td></tr></table></body></html>';
    const parsed = await new TextTableBoqParser().parse(new File([html], 'dqe.html', { type: 'text/html' }));
    expect(parsed.rows).toHaveLength(1);
    expect(String(Object.values(parsed.rows[0].raw)[0])).toBe('Câble U-1000 RO2V 4x150 mm²');
    expect(parsed.detectedFiscal?.totalHt).toBe(3200);
  });
});
