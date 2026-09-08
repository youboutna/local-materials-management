import { describe, it, expect } from 'vitest';
import { TextTableBoqParser } from '../parsers/TextTableBoqParser';
const html =
  '<html><body><table><tr><th>Désignation</th><th>Unité</th><th>Quantité</th><th>P.U</th><th>Montant</th></tr>' +
  '<tr><td>Câble U-1000 RO2V</td><td>m</td><td>2000</td><td>1,6</td><td>3200</td></tr>' +
  '<tr><td>4x150 mm²</td><td></td><td></td><td></td><td></td></tr>' +
  '<tr><td>Total HT</td><td></td><td></td><td></td><td>3200</td></tr></table></body></html>';
describe('dbg', () => { it('x', async () => {
  const p = await new TextTableBoqParser().parse(new File([html], 'a.html', { type: 'text/html' }));
  console.log(JSON.stringify(p.rows, null, 1));
  expect(1).toBe(1);
}); });
