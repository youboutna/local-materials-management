/**
 * FacturXTransformer — génère le XML CII (EN 16931 / Factur-X, profil BASIC)
 * à partir des lignes BOQ d'un document du cycle DQE → Facture.
 *
 * Pure TS : aucune dépendance React / Supabase.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { BoqCalculatorService } from '@/application/services/boq/BoqCalculatorService';
import { DocumentIdentityService } from '@/application/services/boq/DocumentIdentityService';
import { getFiscalProfile } from '@/config/referentials/boq/default-values.referential';
import { documentUnitCefactCode } from '@/config/referentials/boq/unit-codes.referential';
import { resolveLineTax, buildVatBuckets } from '@/config/referentials/boq/tax-regimes.referential';
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
        const tax = resolveLineTax(
          {
            vatRate: l.vatRate,
            rasRate: l.rasRate,
            resourceType: l.resourceType ?? null,
            category: l.category ?? null,
            elementType: l.elementType ?? null,
            designation: l.designation ?? null,
          },
          profile,
        );
        const vatRate = tax.vatRate;
        const rasRate = tax.rasRate;
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

    const vatBuckets = buildVatBuckets(
      lines.map((l) => {
        const tax = resolveLineTax(
          {
            vatRate: l.vatRate,
            rasRate: l.rasRate,
            resourceType: l.resourceType ?? null,
            category: l.category ?? null,
            elementType: l.elementType ?? null,
            designation: l.designation ?? null,
          },
          profile,
        );
        return {
          totalHt: l.totalHt ?? (l.quantity ?? 0) * (l.unitPrice ?? 0),
          vatRate: tax.vatRate,
          vatCategoryCode: tax.vatCategoryCode,
          exemptionReason: tax.exemptionReason,
        };
      }),
    );

    const lineItems = lines
      .map((l, i) => {
        const qty = l.quantity ?? 0;
        const pu = l.unitPrice ?? 0;
        const ht = l.totalHt ?? qty * pu;
        const tax = resolveLineTax(
          {
            vatRate: l.vatRate,
            rasRate: l.rasRate,
            resourceType: l.resourceType ?? null,
            category: l.category ?? null,
            elementType: l.elementType ?? null,
            designation: l.designation ?? null,
          },
          profile,
        );
        const vat = tax.vatRate * 100;
        const label = DocumentIdentityService.lineLabel(l, i);
        const classification = DocumentIdentityService.lineCode(l);
        const description = [l.note, l.category].filter(Boolean).join(' — ');
        return `    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument><ram:LineID>${i + 1}</ram:LineID></ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>${
        classification
          ? `
        <ram:SellerAssignedID>${esc(classification)}</ram:SellerAssignedID>`
          : ''
      }
        <ram:Name>${esc(label)}</ram:Name>${
          description
            ? `
        <ram:Description>${esc(description)}</ram:Description>`
            : ''
        }${
          classification
            ? `
        <ram:DesignatedProductClassification>
          <ram:ClassCode listID="ZZZ" listVersionID="BTP">${esc(classification)}</ram:ClassCode>
        </ram:DesignatedProductClassification>`
            : ''
        }
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice><ram:ChargeAmount>${money(pu)}</ram:ChargeAmount></ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${esc(documentUnitCefactCode(l.unit))}">${money(qty)}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${esc(tax.vatCategoryCode)}</ram:CategoryCode>${
            tax.exemptionReason
              ? `
          <ram:ExemptionReason>${esc(tax.exemptionReason)}</ram:ExemptionReason>`
              : ''
          }
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
${vatBuckets
        .map(
          (b) => `      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${money(b.taxAmount)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${money(b.basisAmount)}</ram:BasisAmount>
        <ram:CategoryCode>${esc(b.vatCategoryCode)}</ram:CategoryCode>${
            b.exemptionReason
              ? `
        <ram:ExemptionReason>${esc(b.exemptionReason)}</ram:ExemptionReason>`
              : ''
          }
        <ram:RateApplicablePercent>${money(b.vatRate * 100)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`,
        )
        .join('\n')}
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
