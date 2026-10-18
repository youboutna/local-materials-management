import type { ProjectOperationDTO, SaveProjectOperationDTO, SaveInfrastructureDTO, InfrastructureAssetDTO, WorkbenchProjectDTO, AssetTypeDTO, InfraDomainDTO, InfraStructureDTO, SaveInfraStructureDTO, ImportFeatureItemDTO, ImportResultDTO, GeometryKind, InfraRealization } from '@/dtos/entities/ProjectWorkbenchDTO';
import type { Geometry } from 'geojson';
type Row = Record<string, unknown>;
const optional = (value: unknown): string | undefined => typeof value === 'string' && value ? value : undefined;
const GEOMETRY_TYPES = ['Point','MultiPoint','LineString','MultiLineString','Polygon','MultiPolygon','GeometryCollection'];
const isGeometry = (value: unknown): value is Geometry => !!value && typeof value === 'object' && GEOMETRY_TYPES.includes(String((value as Row).type));
const parseGeometry = (text: string): Geometry => {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error('Invalid GeoJSON geometry'); }
  const candidate = parsed && typeof parsed === 'object' && (parsed as Row).type === 'Feature' ? (parsed as Row).geometry : parsed;
  if (!isGeometry(candidate)) throw new Error('Invalid GeoJSON geometry');
  return candidate;
};
export class ProjectWorkbenchTransformer {
  static project(row: Row): WorkbenchProjectDTO { return { id: String(row.id), title: String(row.title), reference: optional(row.reference), canManage: row.can_manage === true }; }
  static operation(row: Row): ProjectOperationDTO { return { id: String(row.id), projectId: String(row.project_id), phaseId: optional(row.phase_id), taskId: optional(row.task_id), kind: row.kind as ProjectOperationDTO['kind'], occurredOn: String(row.occurred_on), label: String(row.label), resourceFamily: row.resource_family as ProjectOperationDTO['resourceFamily'], quantity: Number(row.quantity), unit: String(row.unit), amount: Number(row.amount), currency: String(row.currency), sourceReference: optional(row.source_reference), notes: optional(row.notes), status: (optional(row.status) || 'draft') as ProjectOperationDTO['status'], contextCode: optional(row.context_code) || 'unreconciled', sourceLineId: optional(row.source_line_id), decompteId: optional(row.decompte_id), resourceId: optional(row.resource_id), perspective: (optional(row.perspective) || 'owner') as ProjectOperationDTO['perspective'], requestKey: optional(row.request_key) }; }
  static toOperationRow(input: SaveProjectOperationDTO): Row { return { project_id: input.projectId, phase_id: input.phaseId || null, task_id: input.taskId || null, kind: input.kind, occurred_on: input.occurredOn, label: input.label.trim(), resource_family: input.resourceFamily || null, quantity: input.quantity, unit: input.unit, amount: input.amount, currency: input.currency, source_reference: input.sourceReference || null, notes: input.notes || null, status: input.status || 'draft', context_code: input.contextCode || 'unreconciled', source_line_id: input.sourceLineId || null, decompte_id: input.decompteId || null, resource_id: input.resourceId || null, perspective: input.perspective || 'owner', request_key: input.requestKey || null }; }
  static formToOperation(form: SaveProjectOperationDTO): SaveProjectOperationDTO { return { ...form, quantity: Number(form.quantity), amount: Number(form.amount), label: form.label.trim() }; }

  static domain(row: Row): InfraDomainDTO { return { code: String(row.code), labelFr: String(row.label_fr), labelAr: optional(row.label_ar), labelEn: optional(row.label_en) }; }
  static assetType(row: Row): AssetTypeDTO { return { code: String(row.code), domainCode: String(row.domain_code), assetGroup: optional(row.asset_group), assetType: optional(row.asset_type), labelFr: String(row.label_fr), labelAr: optional(row.label_ar), labelEn: optional(row.label_en), geometryKind: String(row.geometry_kind) as GeometryKind, icon: optional(row.icon) }; }
  static asset(row: Row): InfrastructureAssetDTO { return { id: String(row.id), projectId: String(row.project_id), name: String(row.name), assetTypeCode: String(row.asset_type_code), status: String(row.status), geometry: row.geojson as Geometry, properties: (row.properties || {}) as Row, updatedAt: optional(row.updated_at), realization: optional(row.realization) as InfraRealization | undefined, inspectionId: optional(row.inspection_id), completedOn: optional(row.completed_on), phaseId: optional(row.phase_id) }; }
  static structure(row: Row): InfraStructureDTO { return { id: String(row.id), projectId: String(row.project_id), structureType: String(row.structure_type), name: optional(row.name), geometry: row.geojson as Geometry, properties: (row.properties || {}) as Row, updatedAt: optional(row.updated_at) }; }
  static importResult(data: unknown): ImportResultDTO { const row = (data || {}) as Row; return { importedCount: Number(row.importedCount || 0), ids: Array.isArray(row.ids) ? row.ids.map(String) : [], errors: Array.isArray(row.errors) ? (row.errors as Row[]).map(e => ({ name: optional(e.name), error: String(e.error) })) : [] }; }

  /** Vérifie la cohérence géométrie / type d'ouvrage avant envoi (la base revalide). */
  static assertKind(geometry: Geometry, kind?: GeometryKind) { if (kind && kind !== 'Geometry' && geometry.type !== kind) throw new Error(`Geometry type ${geometry.type} does not match expected ${kind}`); }
  static formToAsset(form: Omit<SaveInfrastructureDTO, 'geometry'> & { geometry: string }, kind?: GeometryKind): SaveInfrastructureDTO {
    if (!form.name.trim()) throw new Error('Infrastructure name is required');
    if (!form.assetTypeCode) throw new Error('Asset type is required');
    const geometry = parseGeometry(form.geometry);
    ProjectWorkbenchTransformer.assertKind(geometry, kind);
    return { ...form, name: form.name.trim(), status: form.status.trim() || 'planned', geometry };
  }
  static formToStructure(form: Omit<SaveInfraStructureDTO, 'geometry'> & { geometry: string }): SaveInfraStructureDTO {
    if (!form.structureType.trim()) throw new Error('Structure type is required');
    return { ...form, structureType: form.structureType.trim(), name: form.name?.trim() || undefined, geometry: parseGeometry(form.geometry) };
  }
  /**
   * Convertit un GeoJSON métier (FeatureCollection, Feature ou géométrie) en lignes d'import.
   * Le type d'ouvrage vient de `properties.asset_type_code` (ou `typeProperty`), sinon du type par défaut.
   */
  static geojsonToImport(text: string, defaultTypeCode: string, typeProperty = 'asset_type_code', nameProperty = 'name'): ImportFeatureItemDTO[] {
    let parsed: Row;
    try { parsed = JSON.parse(text); } catch { throw new Error('Invalid GeoJSON file'); }
    ProjectWorkbenchTransformer.assertWgs84Crs(parsed.crs);
    const features: Row[] = parsed.type === 'FeatureCollection' && Array.isArray(parsed.features) ? parsed.features as Row[]
      : parsed.type === 'Feature' ? [parsed] : isGeometry(parsed) ? [{ type: 'Feature', geometry: parsed, properties: {} }] : [];
    if (!features.length) throw new Error('GeoJSON contains no feature');
    const source = parsed.type === 'FeatureCollection' ? { collection: optional(parsed.name), metadata: parsed.metadata ?? undefined } : undefined;
    return features.map((feature, index) => {
      const properties = { ...((feature.properties || {}) as Row) };
      const code = optional(properties[typeProperty]) || defaultTypeCode;
      if (!code) throw new Error(`Feature ${index + 1}: asset type missing`);
      if (!isGeometry(feature.geometry)) throw new Error(`Feature ${index + 1}: invalid geometry`);
      ProjectWorkbenchTransformer.assertLonLat(feature.geometry, index + 1);
      if (feature.id !== undefined && properties.source_id === undefined) properties.source_id = feature.id;
      if (source && (source.collection || source.metadata)) properties._import = source;
      return { name: optional(properties[nameProperty]) || optional(properties.label) || `${code}-${index + 1}`, asset_type_code: code, status: optional(properties.status) || 'planned', geometry: feature.geometry, properties };
    });
  }
  /** Seules les coordonnées WGS84 lon/lat sont acceptées (CRS84 / EPSG:4326). */
  static assertWgs84Crs(crs: unknown) {
    if (!crs) return;
    const name = String(((crs as Row).properties as Row | undefined)?.name ?? '');
    if (!/CRS84$|EPSG:+4326$|EPSG::4326$/i.test(name)) throw new Error(`Unsupported CRS ${name || 'unknown'}: reproject to WGS84 (EPSG:4326)`);
  }
  static assertLonLat(geometry: Geometry, index: number) {
    const walk = (value: unknown): void => {
      if (Array.isArray(value) && typeof value[0] === 'number') {
        const [lng, lat] = value as number[];
        if (!(lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90)) throw new Error(`Feature ${index}: coordinates must be longitude/latitude`);
      } else if (Array.isArray(value)) value.forEach(walk);
    };
    if (geometry.type === 'GeometryCollection') geometry.geometries.forEach(g => ProjectWorkbenchTransformer.assertLonLat(g, index));
    else walk(geometry.coordinates);
  }
  /** Table attributaire ↔ properties. Les valeurs JSON (nombres, listes, objets) sont conservées. */
  static propertiesToAttributes(properties: Record<string, unknown> = {}): Array<{ key: string; value: string }> {
    return Object.entries(properties).filter(([key]) => key !== '_import').map(([key, value]) => ({ key, value: typeof value === 'string' ? value : JSON.stringify(value) }));
  }
  static attributesToProperties(rows: Array<{ key: string; value: string }>, preserved: Record<string, unknown> = {}): Record<string, unknown> {
    const duplicates = ProjectWorkbenchTransformer.duplicateAttributeKeys(rows);
    if (duplicates.size) throw new Error(`Duplicate attribute: ${[...duplicates].join(', ')}`);
    const out: Record<string, unknown> = preserved._import ? { _import: preserved._import } : {};
    for (const { key, value } of rows) {
      const k = key.trim(); if (!k) continue;
      const v = value.trim();
      if (/^(-?\d+(\.\d+)?|true|false|null|\[.*\]|\{.*\})$/s.test(v)) { try { out[k] = JSON.parse(v); continue; } catch { /* texte */ } }
      out[k] = value;
    }
    return out;
  }
  static duplicateAttributeKeys(rows: Array<{ key: string }>): Set<string> {
    const seen = new Set<string>(); const dup = new Set<string>();
    rows.forEach(({ key }) => { const k = key.trim(); if (!k) return; if (seen.has(k)) dup.add(k); seen.add(k); });
    return dup;
  }
}
