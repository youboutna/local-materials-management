/**
 * FacturXTransformer — génère le XML CII (EN 16931 / Factur-X, profil BASIC)
 * à partir des lignes BOQ d'un document du cycle DQE → Facture.
 *
 * Pure TS : aucune dépendance React / Supabase.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { BoqCalculatorService } from '@/application/services/boq/BoqCalculatorService';
import { getFiscalProfile } from '@/config/referentials/boq/default-values.referential';
import {
  getInvoiceDocumentType,
  type InvoiceDocumentType,
} from '@/config/referentials/invoices/invoice-document-types.referential';

export interface FacturXParty {
  name: string;
  taxId?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string;
}

export interface FacturXContext {
  documentType: InvoiceDocumentType;
  reference: string;
  issueDate?: string;
  currency?: string;
  fiscalProfileCode?: string | null;
  seller: FacturXParty;
  buyer: FacturXParty;
  note?: string | null;
  /** Avancement facturé pour un décompte (1 → 100). */
  percentage?: number | null;
}

export interface FacturXTotals {
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  withholding: number;
  netToPay: number;
}

const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const money = (v: number): string => (Number.isFinite(v) ? v.toFixed(2) : '0.00');
const ymd = (iso?: string): string => (iso ?? new Date().toISOString()).slice(0, 10).replace(/-/g, '');

function partyXml(tag: string, p: FacturXParty): string {
  return `      <ram:${tag}>
        <ram:Name>${esc(p.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:CityName>${esc(p.city ?? '')}</ram:CityName>
          <ram:CountryID>${esc(p.country ?? 'MR')}</ram:CountryID>
          <ram:LineOne>${esc(p.address ?? '')}</ram:LineOne>
        </ram:PostalTradeAddress>${
          p.taxId
            ? `
        <ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(p.taxId)}</ram:ID></ram:SpecifiedTaxRegistration>`
            : ''
        }
      </ram:${tag}>`;
}

export const FacturXTransformer = {
  /** Totaux fiscaux du document (HT / TVA / TTC / RAS / net à payer). */
  computeTotals(lines: BoqLineDTO[], fiscalProfileCode?: string | null): FacturXTotals {
    const profile = getFiscalProfile(fiscalProfileCode);
    return lines.reduce<FacturXTotals>(
      (acc, l) => {
        const t = BoqCalculatorService.computeTotals(
          {
            unit: l.unit,
            length: l.length,
            width: l.width,
            height: l.height,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            vatRate: l.vatRate,
            rasRate: l.rasRate,
            fees: l.fees,
          },
          profile,
        );
        const totalHt = l.totalHt ?? t.totalHt;
        const vatRate = l.vatRate ?? profile.vatRate;
        const rasRate = l.rasRate ?? profile.withholdingRate;
        acc.totalHt += totalHt;
        acc.totalTva += totalHt * vatRate;
        acc.withholding += totalHt * rasRate;
        acc.totalTtc = acc.totalHt + acc.totalTva;
        acc.netToPay = acc.totalTtc - acc.withholding;
        return acc;
      },
      { totalHt: 0, totalTva: 0, totalTtc: 0, withholding: 0, netToPay: 0 },
    );
  },

  /** XML CII conforme EN 16931 (profil BASIC) — TypeCode issu du référentiel. */
  toCiiXml(lines: BoqLineDTO[], ctx: FacturXContext): string {
    const def = getInvoiceDocumentType(ctx.documentType);
    const currency = ctx.currency ?? getFiscalProfile(ctx.fiscalProfileCode).currency ?? 'MRU';
    const totals = this.computeTotals(lines, ctx.fiscalProfileCode);
    const profile = getFiscalProfile(ctx.fiscalProfileCode);

    const lineItems = lines
      .map((l, i) => {
        const qty = l.quantity ?? 0;
        const pu = l.unitPrice ?? 0;
        const ht = l.totalHt ?? qty * pu;
        const vat = (l.vatRate ?? profile.vatRate) * 100;
        return `    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument><ram:LineID>${i + 1}</ram:LineID></ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct><ram:Name>${esc(l.designation)}</ram:Name></ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice><ram:ChargeAmount>${money(pu)}</ram:ChargeAmount></ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${esc(l.unit || 'C62')}">${qty}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>${money(vat)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${money(ht)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
      })
      .join('\n');

    const notes = [
      ctx.note,
      def.requiresPercentage && ctx.percentage ? `Avancement facturé : ${ctx.percentage} %` : null,
      `Document : ${def.label}`,
    ].filter(Boolean) as string[];

    return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${esc(ctx.reference)}</ram:ID>
    <ram:TypeCode>${def.facturxTypeCode}</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">${ymd(ctx.issueDate)}</udt:DateTimeString></ram:IssueDateTime>
${notes.map((n) => `    <ram:IncludedNote><ram:Content>${esc(n)}</ram:Content></ram:IncludedNote>`).join('\n')}
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
${lineItems}
    <ram:ApplicableHeaderTradeAgreement>
${partyXml('SellerTradeParty', ctx.seller)}
${partyXml('BuyerTradeParty', ctx.buyer)}
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${esc(currency)}</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${money(totals.totalTva)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${money(totals.totalHt)}</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>${money(profile.vatRate * 100)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${money(totals.totalHt)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${money(totals.totalHt)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${esc(currency)}">${money(totals.totalTva)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${money(totals.totalTtc)}</ram:GrandTotalAmount>
        <ram:TotalPrepaidAmount>${money(totals.withholding)}</ram:TotalPrepaidAmount>
        <ram:DuePayableAmount>${money(totals.netToPay)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
  },
};
