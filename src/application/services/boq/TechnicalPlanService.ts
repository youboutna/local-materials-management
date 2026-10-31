import type { ITechnicalPlanReader } from '@/domain/repositories/ITechnicalPlanReader';
import type { TechnicalPlanDTO, TechnicalPlanElementDTO, TechnicalPlanPageDTO } from '@/dtos/boq/TechnicalPlanDTO';
import type { MeterInputDTO } from '@/dtos/boq/MeterInputDTO';
import type { ToMeterInputsContext } from './UnifiedBoqParser';
import { TECHNICAL_PLAN_PATTERNS, TECHNICAL_PLAN_POLICY } from '@/config/referentials/boq/technical-plan.referential';
import { MeterService } from './MeterService';
import { getElementType } from '@/config/referentials/boq/element-types.referential';
import { getDocumentService } from '../DocumentService';
import { getAuthService } from '../AuthService';

/** Review-first bridge. A section or OCR label alone never authorizes a quantity. */
export class TechnicalPlanService {
  private readonly cache = new Map<string, TechnicalPlanDTO>();
  constructor(private readonly reader: ITechnicalPlanReader) {}

  async parse(file: File): Promise<TechnicalPlanDTO> {
    if (!file.name.toLowerCase().endsWith('.pdf')) throw new Error('Only PDF plans are supported');
    const hash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    const sha256 = Array.from(new Uint8Array(hash), (value) => value.toString(16).padStart(2, '0')).join('');
    const cached = this.cache.get(sha256);
    if (cached) return structuredClone({ ...cached, fileName: file.name });
    const result = TechnicalPlanService.extract(await this.reader.read(file), file.name, sha256);
    this.cache.set(sha256, structuredClone(result));
    return result;
  }

  static extract(pages: TechnicalPlanPageDTO[], fileName: string, sha256: string): TechnicalPlanDTO {
    const result: TechnicalPlanDTO = { pages, fileName, sha256, cartouches: [], elements: [], warnings: [] };
    const fingerprints = new Set<string>();
    for (const page of pages) {
      const fingerprint = page.text.replace(/\s+/g, ' ').trim();
      if (fingerprint && fingerprints.has(fingerprint)) {
        result.warnings.push({ code: 'duplicate_page', page: page.page });
        continue;
      }
      fingerprints.add(fingerprint);
      const scale = page.text.match(TECHNICAL_PLAN_PATTERNS.scale)?.[1];
      result.cartouches.push({ page: page.page, scale: scale ? Number(scale) : undefined,
        planche: page.text.match(TECHNICAL_PLAN_PATTERNS.planche)?.[1],
        phase: page.text.match(TECHNICAL_PLAN_PATTERNS.phase)?.[1],
        date: page.text.match(TECHNICAL_PLAN_PATTERNS.date)?.[1]?.trim() });
      if (!scale) result.warnings.push({ code: 'missing_scale', page: page.page });
      if (page.source === 'ocr' && page.confidence < TECHNICAL_PLAN_POLICY.minimumOcrConfidence) result.warnings.push({ code: 'ocr_low_confidence', page: page.page });
      const pattern = new RegExp(TECHNICAL_PLAN_PATTERNS.section);
      for (const match of page.text.matchAll(pattern)) {
        const prefix = match[1] as keyof typeof TECHNICAL_PLAN_POLICY.elementPrefixes;
        const unit = match[5] as keyof typeof TECHNICAL_PLAN_POLICY.units | undefined;
        const factor = unit ? TECHNICAL_PLAN_POLICY.units[unit] : undefined;
        if (!factor) result.warnings.push({ code: 'ambiguous_unit', page: page.page });
        result.elements.push({ ref: `${match[1]}${match[2]}`, page: page.page, rawLabel: match[0],
          elementType: TECHNICAL_PLAN_POLICY.elementPrefixes[prefix],
          width: factor ? Number(match[3].replace(',', '.')) * factor : undefined,
          height: factor ? Number(match[4].replace(',', '.')) * factor : undefined,
          count: 1, confirmed: false });
      }
      if (!result.elements.some((element) => element.page === page.page)) result.warnings.push({ code: 'missing_dimensions', page: page.page });
    }
    return result;
  }

  static toMeterInputs(plan: TechnicalPlanDTO, elements: readonly TechnicalPlanElementDTO[], ctx: ToMeterInputsContext, documentId?: string): MeterInputDTO[] {
    if (!ctx.contextId) throw new Error('Project context required');
    const seen = new Set<string>();
    const inputs = elements.filter((element) => element.confirmed).map((element, index): MeterInputDTO => {
      const definition = getElementType(element.elementType);
      if (!definition || !Number.isInteger(element.count) || element.count <= 0) throw new Error('Invalid plan element');
      const key = `${element.page}:${element.ref}`;
      if (seen.has(key)) throw new Error('Duplicate plan element');
      seen.add(key);
      for (const dimension of ['length', 'width', 'height'] as const) {
        const value = element[dimension];
        if (definition.dimensions[dimension] && (value == null || !Number.isFinite(value) || value <= 0)) throw new Error(`Missing ${dimension}: ${element.ref}`);
      }
      return { source: ctx.source, contextId: ctx.contextId, phaseId: ctx.phaseId,
        designation: element.ref, elementType: element.elementType, unit: definition.defaultUnit,
        length: element.length, width: element.width, height: element.height, quantity: 0,
        provenance: { format: 'plan', fileName: plan.fileName, fileSha256: plan.sha256,
          documentId, page: element.page, rawLabel: element.rawLabel, rowIndex: index + 1 },
        metadata: { planElementCount: element.count, planCartouche: plan.cartouches.find((cartouche) => cartouche.page === element.page) } };
    });
    return MeterService.enrich(inputs).map((line, index) => {
      const element = elements.filter((item) => item.confirmed)[index];
      // Count is applied once to the final per-element quantity, not to dimensions.
      return { ...line, quantity: line.quantity * element.count, metadata: { ...line.metadata,
        meteringPerElement: line.metadata?.metering, metering: undefined } };
    });
  }

  async archive(file: File, plan: TechnicalPlanDTO, ctx: ToMeterInputsContext): Promise<string> {
    const documents = getDocumentService();
    const existing = await documents.getProjectDocuments(ctx.contextId);
    const match = existing.find((document) => document.metadata?.planSha256 === plan.sha256 && document.phaseId === (ctx.phaseId ?? null));
    if (match) return match.id;
    const user = await getAuthService().getCurrentUser();
    if (!user) throw new Error('Sign in to archive a plan');
    const document = await documents.createDocument({ title: file.name, documentType: 'plan', file,
      projectId: ctx.contextId, phaseId: ctx.phaseId, uploadedBy: user.id,
      metadata: { planSha256: plan.sha256, technicalPlan: plan, extractionReviewed: false } });
    return document.id;
  }
}