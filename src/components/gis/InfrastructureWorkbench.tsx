import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Geometry } from 'geojson';
import { getProjectWorkbenchService } from '@/application/services/ProjectWorkbenchService';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import AddressSearchBox from '@/components/gis/AddressSearchBox';
import type { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import type { InfrastructureAssetDTO, InfrastructureAnalysisDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
import { GeoJsonZoneCodec } from '@/dtos/transforms/GeoJsonZoneCodec';
import { INFRA_ASSET_TYPES, INFRA_ASSET_STATUSES } from '@/config/referentials/projects/project-workbench.referential';
import { Plus, Pencil, Trash2, Scan, Save } from 'lucide-react';
export function InfrastructureWorkbench({ project, canManage }: { project: ProjectDetailDTO; canManage: boolean }) {
  const { t } = useLanguage(); const client = useQueryClient(); const service = getProjectWorkbenchService();
  const assets = useQuery({ queryKey: ['infra-assets', project.id], queryFn: () => service.assets(project.id) });
  const [editing, setEditing] = useState<InfrastructureAssetDTO | 'new' | null>(null);
  const [name, setName] = useState(''); const [type, setType] = useState<string>(INFRA_ASSET_TYPES[0]); const [status, setStatus] = useState<string>('planned');
  const [geometry, setGeometry] = useState(''); const [buffer, setBuffer] = useState(0); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [analysis, setAnalysis] = useState<InfrastructureAnalysisDTO | null>(null);
  const zones = project.interventionZones || [];
  const zoneGeometry = GeoJsonZoneCodec.toFeatureCollection(zones);
  const first = zones[0]?.coordinates[0];
  const center: [number,number] = first ? [first.lat,first.lng] : [18.0735,-15.9582];
  const edit = (asset: InfrastructureAssetDTO | 'new') => { setEditing(asset); setName(asset === 'new' ? '' : asset.name); setType(asset === 'new' ? INFRA_ASSET_TYPES[0] : asset.assetType); setStatus(asset === 'new' ? 'planned' : asset.status); setGeometry(asset === 'new' ? '' : JSON.stringify(asset.geometry,null,2)); setError(''); };
  const action = async (work: () => Promise<unknown>) => { setBusy(true); setError(''); try { await work(); await client.invalidateQueries({ queryKey: ['infra-assets',project.id] }); } catch(e) { setError(e instanceof Error ? e.message : t('common.error')); } finally { setBusy(false); } };
  return <section className="space-y-4">
    <div className="flex flex-wrap items-end gap-3"><div><Label htmlFor="infra-buffer">{t('workbench.buffer')}</Label><Input id="infra-buffer" className="w-36" type="number" min="0" max="100000" value={buffer} onChange={e => setBuffer(Number(e.target.value))} /></div><Button variant="outline" disabled={busy || !zones.length} onClick={() => action(async () => { const collection: Geometry = { type: 'GeometryCollection', geometries: zoneGeometry.features.map(feature => { if (feature.properties.shape === 'circle') throw new Error(t('workbench.circle_analysis')); return feature.geometry as Geometry; }) }; setAnalysis(await service.analyze(project.id,collection,buffer)); })}><Scan className="h-4 w-4 mr-2" />{t('workbench.analyze')}</Button>{canManage && <Button onClick={() => edit('new')}><Plus className="h-4 w-4 mr-2" />{t('workbench.add')}</Button>}</div>
    {error && <p role="alert" className="text-destructive">{error}</p>}{assets.error && <p role="alert" className="text-destructive">{assets.error.message}</p>}
    {analysis && <div className="flex flex-wrap gap-8 border-y border-border py-4">{[['present',analysis.presentCount],['realized',analysis.completedCount],['length',analysis.intersectedLengthMeters.toFixed(2)]].map(([key,value]) => <div key={key}><p className="text-sm text-muted-foreground">{t(`workbench.${key}`)}</p><p className="text-2xl font-semibold tabular-nums">{value}</p></div>)}</div>}
    <div className="h-[420px] overflow-hidden border border-border"><MapContainer center={center} zoom={13} className="h-full w-full"><TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{zones.length > 0 && <GeoJSON key={JSON.stringify(zoneGeometry)} data={zoneGeometry as GeoJSON.FeatureCollection} />}{assets.data?.map(asset => <GeoJSON key={`${asset.id}:${JSON.stringify(asset.geometry)}`} data={asset.geometry} eventHandlers={{ click: () => canManage && edit(asset) }} />)}{analysis && <GeoJSON key={JSON.stringify(analysis.bufferGeojson)} data={analysis.bufferGeojson} />}</MapContainer></div>
    {editing && <form className="space-y-4 border-y border-border py-4" onSubmit={e => { e.preventDefault(); action(async () => { await service.saveAsset({ id: editing === 'new' ? undefined : editing.id, projectId: project.id, name, assetType: type, status, geometry: JSON.parse(geometry) }); setEditing(null); }); }}><div className="grid sm:grid-cols-3 gap-3"><div><Label htmlFor="infra-name">{t('workbench.label')}</Label><Input id="infra-name" required value={name} onChange={e => setName(e.target.value)} /></div><Select value={type} onValueChange={setType}><SelectTrigger aria-label={t('workbench.type')}><SelectValue /></SelectTrigger><SelectContent>{INFRA_ASSET_TYPES.map(value => <SelectItem key={value} value={value}>{t(`workbench.${value}`)}</SelectItem>)}</SelectContent></Select><Select value={status} onValueChange={setStatus}><SelectTrigger aria-label={t('workbench.status')}><SelectValue /></SelectTrigger><SelectContent>{INFRA_ASSET_STATUSES.map(value => <SelectItem key={value} value={value}>{t(`workbench.${value}`)}</SelectItem>)}</SelectContent></Select></div><AddressSearchBox onSelect={selection => setGeometry(JSON.stringify({ type:'Point',coordinates:[selection.lng,selection.lat] },null,2))} /><Label htmlFor="infra-geometry">{t('workbench.geometry')}</Label><Textarea id="infra-geometry" required rows={6} value={geometry} onChange={e => setGeometry(e.target.value)} /><div className="flex gap-2"><Button disabled={busy}><Save className="h-4 w-4 mr-2" />{t('common.save')}</Button><Button type="button" variant="outline" onClick={() => setEditing(null)}>{t('common.cancel')}</Button></div></form>}
    <div className="divide-y divide-border">{assets.data?.map(asset => <div key={asset.id} className="flex items-center justify-between py-3 gap-3"><div><p className="font-medium">{asset.name}</p><p className="text-sm text-muted-foreground">{t(`workbench.${asset.assetType}`)} · {t(`workbench.${asset.status}`)}</p></div>{canManage && <div className="flex gap-2"><Button variant="ghost" size="icon" aria-label={t('common.edit')} onClick={() => edit(asset)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" disabled={busy} aria-label={t('common.delete')} onClick={() => { if (window.confirm(t('common.confirm_delete'))) action(() => service.deleteAsset(project.id,asset.id)); }}><Trash2 className="h-4 w-4" /></Button></div>}</div>)}</div>
  </section>;
}