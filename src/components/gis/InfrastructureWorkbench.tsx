import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { FeatureCollection } from 'geojson';
import { useInfrastructureWorkbench } from '@/hooks/hexagonal/useProjectWorkbenchHex';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import AddressSearchBox from '@/components/gis/AddressSearchBox';
import InfraGeometryDrawer from '@/components/gis/InfraGeometryDrawer';
import InfraAttributeTable, { type AttributeRow } from '@/components/gis/InfraAttributeTable';
import type { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import type { InfrastructureAssetDTO, InfrastructureAnalysisDTO, InfraStructureDTO, AssetTypeDTO, InfraRealization, GeometryKind, ImportResultDTO, ImportFeatureItemDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
import { GeoJsonZoneCodec } from '@/dtos/transforms/GeoJsonZoneCodec';
import { ProjectWorkbenchTransformer } from '@/dtos/transforms/ProjectWorkbenchTransformer';
import { INFRA_ASSET_STATUSES, INFRA_REALIZATIONS, INFRA_GEOMETRY_KINDS } from '@/config/referentials/projects/project-workbench.referential';
import { Plus, Pencil, Trash2, Scan, Save, Upload, Layers, Tags } from 'lucide-react';

type Panel = 'feature' | 'structure' | 'import' | 'type' | null;
const NONE = '__none__';

export function InfrastructureWorkbench({ project, canManage }: { project: ProjectDetailDTO; canManage: boolean }) {
  const { t, language } = useLanguage();
  const infra = useInfrastructureWorkbench(project.id);
  const label = (item?: { labelFr: string; labelAr?: string; labelEn?: string }) => !item ? '' : (language === 'ar' ? item.labelAr : language === 'en' ? item.labelEn : item.labelFr) || item.labelFr;
  const typeByCode = useMemo(() => new Map(infra.assetTypes.map(type => [type.code, type])), [infra.assetTypes]);

  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [buffer, setBuffer] = useState(0); const [analysis, setAnalysis] = useState<InfrastructureAnalysisDTO | null>(null);
  // Ouvrage
  const [featureId, setFeatureId] = useState<string | undefined>(); const [name, setName] = useState(''); const [typeCode, setTypeCode] = useState(''); const [status, setStatus] = useState('planned'); const [geometry, setGeometry] = useState(''); const [attributes, setAttributes] = useState<AttributeRow[]>([]); const [preserved, setPreserved] = useState<Record<string, unknown>>({}); const [showRaw, setShowRaw] = useState(false); const [drawKey, setDrawKey] = useState(0);
  // Support
  const [structureId, setStructureId] = useState<string | undefined>(); const [structureType, setStructureType] = useState(''); const [structureName, setStructureName] = useState(''); const [structureGeometry, setStructureGeometry] = useState(''); const [structureAttributes, setStructureAttributes] = useState<AttributeRow[]>([]);
  // Import
  const [importText, setImportText] = useState(''); const [importType, setImportType] = useState(''); const [typeProperty, setTypeProperty] = useState('asset_type_code'); const [importReport, setImportReport] = useState<ImportResultDTO | null>(null); const [preview, setPreview] = useState<ImportFeatureItemDTO[] | null>(null);
  // Type d'ouvrage
  const [newType, setNewType] = useState({ code: '', domainCode: '', domainLabelFr: '', labelFr: '', labelAr: '', labelEn: '', assetGroup: '', geometryKind: 'Point' as GeometryKind });
  // Réalisation
  const [realizationAsset, setRealizationAsset] = useState(''); const [realization, setRealization] = useState<InfraRealization>('completed'); const [inspectionId, setInspectionId] = useState(''); const [phaseId, setPhaseId] = useState(''); const [completedOn, setCompletedOn] = useState('');

  const zones = project.interventionZones || [];
  const zoneGeometry = GeoJsonZoneCodec.toFeatureCollection(zones);
  const first = zones[0]?.coordinates?.[0];
  const center: [number, number] = first ? [first.lat, first.lng] : [18.0735, -15.9582];
  const selectedKind = typeByCode.get(typeCode)?.geometryKind;

  const action = async (work: () => Promise<unknown>, done?: string) => {
    setBusy(true); setError(''); setNotice('');
    try { await work(); await infra.refresh(); if (done) setNotice(done); }
    catch (e) { setError(e instanceof Error ? e.message : String((e as { message?: string })?.message || t('common.error'))); }
    finally { setBusy(false); }
  };
  const openFeature = (asset?: InfrastructureAssetDTO) => { setPanel('feature'); setFeatureId(asset?.id); setName(asset?.name || ''); setTypeCode(asset?.assetTypeCode || infra.assetTypes[0]?.code || ''); setStatus(asset?.status || 'planned'); setGeometry(asset ? JSON.stringify(asset.geometry, null, 2) : ''); setAttributes(ProjectWorkbenchTransformer.propertiesToAttributes(asset?.properties)); setPreserved(asset?.properties || {}); setShowRaw(false); setDrawKey(k => k + 1); setError(''); };
  const openStructure = (structure?: InfraStructureDTO) => { setPanel('structure'); setStructureId(structure?.id); setStructureType(structure?.structureType || ''); setStructureName(structure?.name || ''); setStructureGeometry(structure ? JSON.stringify(structure.geometry, null, 2) : ''); setStructureAttributes(ProjectWorkbenchTransformer.propertiesToAttributes(structure?.properties)); setDrawKey(k => k + 1); setError(''); };
  const openRealization = (asset: InfrastructureAssetDTO) => { setRealizationAsset(asset.id); setRealization(asset.realization || 'completed'); setInspectionId(asset.inspectionId || ''); setPhaseId(asset.phaseId || ''); setCompletedOn(asset.completedOn || ''); };
  const statuses = Array.from(new Set([...INFRA_ASSET_STATUSES, status].filter(Boolean)));
  const typeOptions = (types: AssetTypeDTO[]) => types.map(type => <SelectItem key={type.code} value={type.code}>{label(type)} · {type.geometryKind}</SelectItem>);

  return <section className="space-y-4">
    <div className="flex flex-wrap items-end gap-3">
      <div><Label htmlFor="infra-buffer">{t('workbench.buffer')}</Label><Input id="infra-buffer" className="w-36" type="number" min="0" max="100000" value={buffer} onChange={e => { setBuffer(Number(e.target.value)); setAnalysis(null); }} /></div>
      <Button variant="outline" disabled={busy || !zones.length} onClick={() => action(async () => { setAnalysis(await infra.analyze(zoneGeometry as FeatureCollection, buffer)); })}><Scan className="h-4 w-4 mr-2" />{t('workbench.analyze')}</Button>
      {canManage && <>
        <Button onClick={() => openFeature()} disabled={!infra.assetTypes.length}><Plus className="h-4 w-4 mr-2" />{t('workbench.add')}</Button>
        <Button variant="outline" onClick={() => { setPanel('import'); setImportReport(null); setImportType(infra.assetTypes[0]?.code || ''); }}><Upload className="h-4 w-4 mr-2" />{t('workbench.import_geojson')}</Button>
        <Button variant="outline" onClick={() => openStructure()}><Layers className="h-4 w-4 mr-2" />{t('workbench.add_structure')}</Button>
        <Button variant="outline" onClick={() => setPanel('type')}><Tags className="h-4 w-4 mr-2" />{t('workbench.add_asset_type')}</Button>
      </>}
    </div>
    {!zones.length && <p className="text-sm text-muted-foreground">{t('workbench.no_zone')}</p>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {notice && <p role="status" className="text-primary">{notice}</p>}
    {infra.error && <p role="alert" className="text-destructive">{(infra.error as Error).message}</p>}

    {analysis && <div className="flex flex-wrap gap-8 border-y border-border py-4">{([['present', analysis.presentCount], ['realized', analysis.completedCount], ['length', Number(analysis.intersectedLengthMeters || 0).toFixed(2)]] as const).map(([key, value]) => <div key={key}><p className="text-sm text-muted-foreground">{t(`workbench.${key}`)}</p><p className="text-2xl font-semibold tabular-nums">{value}</p></div>)}</div>}

    <div className="h-[420px] overflow-hidden border border-border"><MapContainer center={center} zoom={13} className="h-full w-full">
      <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {zones.length > 0 && <GeoJSON key={JSON.stringify(zoneGeometry)} data={zoneGeometry as FeatureCollection} style={{ color: 'hsl(var(--primary))', weight: 2, fillOpacity: 0.05 }} />}
      {infra.structures.map(structure => <GeoJSON key={`s:${structure.id}:${structure.updatedAt}`} data={structure.geometry} style={{ color: 'hsl(var(--muted-foreground))', dashArray: '4' }} eventHandlers={{ click: () => canManage && openStructure(structure) }} />)}
      {infra.assets.map(asset => <GeoJSON key={`f:${asset.id}:${asset.updatedAt}:${asset.realization}`} data={asset.geometry} style={{ color: asset.realization === 'completed' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))', weight: 3 }} eventHandlers={{ click: () => canManage && openFeature(asset) }} />)}
      {analysis?.bufferGeojson && <GeoJSON key={JSON.stringify(analysis.bufferGeojson)} data={analysis.bufferGeojson} style={{ color: 'hsl(var(--accent-foreground))', fillOpacity: 0.08 }} />}
    </MapContainer></div>

    {panel === 'feature' && <form className="space-y-4 border-y border-border py-4" onSubmit={e => { e.preventDefault(); action(async () => { await infra.saveAsset(ProjectWorkbenchTransformer.formToAsset({ id: featureId, projectId: project.id, name, assetTypeCode: typeCode, status, geometry, properties: ProjectWorkbenchTransformer.attributesToProperties(attributes, preserved) }, selectedKind)); setPanel(null); }, t('workbench.saved')); }}>
      <div className="grid sm:grid-cols-3 gap-3">
        <div><Label htmlFor="infra-name">{t('workbench.label')}</Label><Input id="infra-name" required value={name} onChange={e => setName(e.target.value)} /></div>
        <div><Label>{t('workbench.type')}</Label><Select value={typeCode} onValueChange={setTypeCode}><SelectTrigger aria-label={t('workbench.type')}><SelectValue /></SelectTrigger><SelectContent>{typeOptions(infra.assetTypes)}</SelectContent></Select></div>
        <div><Label>{t('workbench.status')}</Label><Select value={status} onValueChange={setStatus}><SelectTrigger aria-label={t('workbench.status')}><SelectValue /></SelectTrigger><SelectContent>{statuses.map(value => <SelectItem key={value} value={value}>{t(`workbench.${value}`)}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <InfraGeometryDrawer key={`f${drawKey}`} kind={selectedKind} center={center} context={zoneGeometry as FeatureCollection} value={geometry ? (() => { try { return JSON.parse(geometry); } catch { return null; } })() : null} onChange={g => setGeometry(g ? JSON.stringify(g, null, 2) : '')} />
      <Button type="button" variant="link" size="sm" className="px-0" onClick={() => setShowRaw(v => !v)}>{t('workbench.advanced_geojson')}</Button>
      {showRaw && <Textarea id="infra-geometry" aria-label={t('workbench.geometry')} rows={6} value={geometry} onChange={e => setGeometry(e.target.value)} onBlur={() => setDrawKey(k => k + 1)} />}
      <h4 className="font-medium">{t('workbench.attribute_table')}</h4>
      <InfraAttributeTable rows={attributes} onChange={setAttributes} />
      <div className="flex gap-2"><Button disabled={busy}><Save className="h-4 w-4 mr-2" />{t('common.save')}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setPanel(null)}>{t('common.cancel')}</Button></div>
    </form>}

    {panel === 'structure' && <form className="space-y-4 border-y border-border py-4" onSubmit={e => { e.preventDefault(); action(async () => { await infra.saveStructure(ProjectWorkbenchTransformer.formToStructure({ id: structureId, projectId: project.id, structureType, name: structureName, geometry: structureGeometry, properties: ProjectWorkbenchTransformer.attributesToProperties(structureAttributes) })); setPanel(null); }, t('workbench.saved')); }}>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><Label htmlFor="structure-type">{t('workbench.structure_type')}</Label><Input id="structure-type" required value={structureType} onChange={e => setStructureType(e.target.value)} placeholder="pole, vault, duct…" /></div>
        <div><Label htmlFor="structure-name">{t('workbench.label')}</Label><Input id="structure-name" value={structureName} onChange={e => setStructureName(e.target.value)} /></div>
      </div>
      <InfraGeometryDrawer key={`s${drawKey}`} center={center} context={zoneGeometry as FeatureCollection} value={structureGeometry ? (() => { try { return JSON.parse(structureGeometry); } catch { return null; } })() : null} onChange={g => setStructureGeometry(g ? JSON.stringify(g) : '')} />
      <h4 className="font-medium">{t('workbench.attribute_table')}</h4>
      <InfraAttributeTable rows={structureAttributes} onChange={setStructureAttributes} />
      <div className="flex gap-2"><Button disabled={busy}><Save className="h-4 w-4 mr-2" />{t('common.save')}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setPanel(null)}>{t('common.cancel')}</Button></div>
    </form>}

    {panel === 'import' && <form className="space-y-4 border-y border-border py-4" onSubmit={e => { e.preventDefault(); action(async () => { if (!preview) { setPreview(ProjectWorkbenchTransformer.geojsonToImport(importText, importType, typeProperty.trim() || 'asset_type_code')); return; } setImportReport(await infra.importAssets(preview)); setPreview(null); }); }}>
      <div className="grid sm:grid-cols-3 gap-3">
        <div><Label htmlFor="import-file">{t('workbench.geojson_file')}</Label><Input id="import-file" type="file" accept=".geojson,.json,application/geo+json,application/json" onChange={async e => { const file = e.target.files?.[0]; if (file) { setImportText(await file.text()); setPreview(null); setImportReport(null); } }} /></div>
        <div><Label>{t('workbench.default_type')}</Label><Select value={importType} onValueChange={setImportType}><SelectTrigger aria-label={t('workbench.default_type')}><SelectValue /></SelectTrigger><SelectContent>{typeOptions(infra.assetTypes)}</SelectContent></Select></div>
        <div><Label htmlFor="import-prop">{t('workbench.type_property')}</Label><Input id="import-prop" value={typeProperty} onChange={e => setTypeProperty(e.target.value)} /></div>
      </div>
      <Textarea aria-label={t('workbench.geometry')} rows={4} value={importText} onChange={e => { setImportText(e.target.value); setPreview(null); }} placeholder='{"type":"FeatureCollection","features":[…]}' />
      <div className="flex gap-2"><Button disabled={busy || !importText.trim()}><Upload className="h-4 w-4 mr-2" />{preview ? t('workbench.confirm_import') : t('workbench.preview_import')}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => { setPanel(null); setPreview(null); }}>{t('common.cancel')}</Button></div>
      {preview && <div className="overflow-x-auto border border-border"><table className="w-full text-sm"><thead className="bg-muted/50"><tr><th className="text-start p-2">{t('workbench.label')}</th><th className="text-start p-2">{t('workbench.type')}</th><th className="text-start p-2">{t('workbench.geometry')}</th><th className="text-start p-2">{t('workbench.attribute_table')}</th></tr></thead><tbody>{preview.map((item, index) => { const known = typeByCode.get(item.asset_type_code); const mismatch = known && known.geometryKind !== 'Geometry' && known.geometryKind !== item.geometry.type; return <tr key={index} className="border-t border-border align-top"><td className="p-2 font-medium">{item.name}</td><td className={`p-2 ${!known || mismatch ? 'text-destructive' : ''}`}>{known ? label(known) : `${item.asset_type_code} — ${t('workbench.unknown_type')}`}{mismatch ? ` — ${t('workbench.geometry_mismatch')}` : ''}</td><td className="p-2">{item.geometry.type}</td><td className="p-2 text-muted-foreground">{Object.keys(item.properties).filter(k => k !== '_import').join(', ')}</td></tr>; })}</tbody></table></div>}
      {importReport && <div className="text-sm space-y-1"><p>{t('workbench.imported_count')}: <span className="font-semibold tabular-nums">{importReport.importedCount}</span> · {t('workbench.rejected_count')}: <span className="font-semibold tabular-nums">{importReport.errors.length}</span></p>{importReport.errors.slice(0, 20).map((item, index) => <p key={index} className="text-destructive">{item.name || `#${index + 1}`} — {item.error}</p>)}</div>}
    </form>}

    {panel === 'type' && <form className="space-y-4 border-y border-border py-4" onSubmit={e => { e.preventDefault(); action(async () => { await infra.saveAssetType({ ...newType, domainLabelFr: infra.domains.some(d => d.code === newType.domainCode) ? undefined : newType.domainLabelFr || newType.domainCode }); setPanel(null); }, t('workbench.saved')); }}>
      <p className="text-sm text-muted-foreground">{t('workbench.asset_type_admin_hint')}</p>
      <div className="grid sm:grid-cols-4 gap-3">
        <div><Label htmlFor="type-code">{t('workbench.code')}</Label><Input id="type-code" required pattern="[a-z0-9_]+" value={newType.code} onChange={e => setNewType({ ...newType, code: e.target.value })} /></div>
        <div><Label htmlFor="type-domain">{t('workbench.domain')}</Label><Input id="type-domain" required list="infra-domains" value={newType.domainCode} onChange={e => setNewType({ ...newType, domainCode: e.target.value })} /><datalist id="infra-domains">{infra.domains.map(d => <option key={d.code} value={d.code}>{label(d)}</option>)}</datalist></div>
        {!infra.domains.some(d => d.code === newType.domainCode) && newType.domainCode && <div><Label htmlFor="type-domain-label">{t('workbench.domain_label')}</Label><Input id="type-domain-label" value={newType.domainLabelFr} onChange={e => setNewType({ ...newType, domainLabelFr: e.target.value })} /></div>}
        <div><Label>{t('workbench.geometry_kind')}</Label><Select value={newType.geometryKind} onValueChange={value => setNewType({ ...newType, geometryKind: value as GeometryKind })}><SelectTrigger aria-label={t('workbench.geometry_kind')}><SelectValue /></SelectTrigger><SelectContent>{INFRA_GEOMETRY_KINDS.map(kind => <SelectItem key={kind} value={kind}>{kind}</SelectItem>)}</SelectContent></Select></div>
        <div><Label htmlFor="type-fr">{t('workbench.label')} (fr)</Label><Input id="type-fr" required value={newType.labelFr} onChange={e => setNewType({ ...newType, labelFr: e.target.value })} /></div>
        <div><Label htmlFor="type-ar">{t('workbench.label')} (ar)</Label><Input id="type-ar" dir="rtl" value={newType.labelAr} onChange={e => setNewType({ ...newType, labelAr: e.target.value })} /></div>
        <div><Label htmlFor="type-en">{t('workbench.label')} (en)</Label><Input id="type-en" value={newType.labelEn} onChange={e => setNewType({ ...newType, labelEn: e.target.value })} /></div>
        <div><Label htmlFor="type-group">{t('workbench.asset_group')}</Label><Input id="type-group" value={newType.assetGroup} onChange={e => setNewType({ ...newType, assetGroup: e.target.value })} /></div>
      </div>
      <div className="flex gap-2"><Button disabled={busy}><Save className="h-4 w-4 mr-2" />{t('common.save')}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setPanel(null)}>{t('common.cancel')}</Button></div>
    </form>}

    {canManage && <form className="flex flex-wrap gap-3 items-end border-y border-border py-4" onSubmit={e => { e.preventDefault(); action(() => infra.saveRealization({ projectId: project.id, assetId: realizationAsset, realization, inspectionId: inspectionId || undefined, completedOn: completedOn || undefined, phaseId: phaseId || undefined }), t('workbench.saved')); }}>
      <div className="min-w-48"><Label>{t('workbench.infrastructure')}</Label><Select value={realizationAsset} onValueChange={setRealizationAsset}><SelectTrigger aria-label={t('workbench.infrastructure')}><SelectValue /></SelectTrigger><SelectContent>{infra.assets.map(asset => <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="min-w-36"><Label>{t('workbench.realization')}</Label><Select value={realization} onValueChange={value => setRealization(value as InfraRealization)}><SelectTrigger aria-label={t('workbench.realization')}><SelectValue /></SelectTrigger><SelectContent>{INFRA_REALIZATIONS.map(value => <SelectItem key={value} value={value}>{t(`workbench.${value}`)}</SelectItem>)}</SelectContent></Select></div>
      <div className="min-w-40"><Label>{t('workbench.phase')}</Label><Select value={phaseId || NONE} onValueChange={value => setPhaseId(value === NONE ? '' : value)}><SelectTrigger aria-label={t('workbench.phase')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NONE}>—</SelectItem>{(project.phases || []).map(phase => <SelectItem key={phase.id} value={phase.id}>{phase.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="min-w-48"><Label>{t('workbench.inspection')}</Label><Select value={inspectionId || NONE} onValueChange={value => setInspectionId(value === NONE ? '' : value)}><SelectTrigger aria-label={t('workbench.inspection')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NONE}>—</SelectItem>{(project.inspections || []).map(inspection => <SelectItem key={inspection.id} value={inspection.id}>{inspection.title}</SelectItem>)}</SelectContent></Select></div>
      <div><Label htmlFor="infra-completed">{t('workbench.date')}</Label><Input id="infra-completed" required={realization === 'completed'} type="date" value={completedOn} onChange={e => setCompletedOn(e.target.value)} /></div>
      <Button disabled={busy || !realizationAsset || (realization === 'completed' && (!inspectionId || !completedOn))}><Save className="h-4 w-4 mr-2" />{t('workbench.confirm_realization')}</Button>
    </form>}

    <h3 className="font-semibold">{t('workbench.network_features')} <span className="text-muted-foreground tabular-nums">({infra.assets.length})</span></h3>
    <div className="divide-y divide-border">{infra.assets.map(asset => <div key={asset.id} className="flex items-center justify-between py-3 gap-3">
      <div><p className="font-medium">{asset.name}</p><p className="text-sm text-muted-foreground">{label(typeByCode.get(asset.assetTypeCode)) || asset.assetTypeCode} · {t(`workbench.${asset.status}`)}{asset.realization ? ` · ${t('workbench.realization')}: ${t(`workbench.${asset.realization}`)}${asset.completedOn ? ` (${asset.completedOn})` : ''}` : ''} · {ProjectWorkbenchTransformer.propertiesToAttributes(asset.properties).length} {t('workbench.attributes')}</p></div>
      {canManage && <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => openRealization(asset)}>{t('workbench.realization')}</Button>
        <Button variant="ghost" size="icon" aria-label={t('common.edit')} onClick={() => openFeature(asset)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" disabled={busy} aria-label={t('common.delete')} onClick={() => { if (window.confirm(t('common.confirm_delete'))) action(() => infra.deleteAsset(asset.id)); }}><Trash2 className="h-4 w-4" /></Button>
      </div>}
    </div>)}</div>

    <h3 className="font-semibold">{t('workbench.structures')} <span className="text-muted-foreground tabular-nums">({infra.structures.length})</span></h3>
    <div className="divide-y divide-border">{infra.structures.map(structure => <div key={structure.id} className="flex items-center justify-between py-3 gap-3">
      <div><p className="font-medium">{structure.name || structure.structureType}</p><p className="text-sm text-muted-foreground">{structure.structureType} · {structure.geometry.type}</p></div>
      {canManage && <div className="flex gap-2">
        <Button variant="ghost" size="icon" aria-label={t('common.edit')} onClick={() => openStructure(structure)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" disabled={busy} aria-label={t('common.delete')} onClick={() => { if (window.confirm(t('common.confirm_delete'))) action(() => infra.deleteStructure(structure.id)); }}><Trash2 className="h-4 w-4" /></Button>
      </div>}
    </div>)}</div>
  </section>;
}
