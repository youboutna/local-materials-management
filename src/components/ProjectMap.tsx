import "leaflet/dist/leaflet.css";
import L from "leaflet";
import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from '@/contexts/LanguageContext';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle } from "react-leaflet";
import { ProjectDTO } from "@/dtos/entities/ProjectDTO";
import { MapLocation } from "@/domain/entities/Location";
import { Badge } from "@/components/ui/badge";
import type { InterventionZoneDTO } from "@/dtos/entities/InterventionZoneDTO";
import { getProjectCoordinates } from '@/utils/projectLocationBuckets';

export type ProjectStatus =
  | "en cours"
  | "terminé"
  | "en attente"
  | "en inspection"
  | "suspendu"
  | "annulé";

interface ProjectMapProps {
  projects?: ProjectDTO[];
  locations?: MapLocation[];
  defaultCenter?: [number, number];
  defaultZoom?: number;
  height?: string;
  className?: string;
  focusRegion?: string;
  selectable?: boolean;
  onLocationSelect?: (latitude: number, longitude: number) => void;
  interactive?: boolean;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case "en cours":
      return "#3b82f6";
    case "terminé":
      return "#10b981";
    case "en attente":
      return "#f59e0b";
    case "en inspection":
      return "#eab308";
    case "suspendu":
      return "#8b5cf6";
    case "annulé":
      return "#ef4444";
    default:
      return "#6b7280";
  }
};

const createCustomIcon = (status?: string, type?: string) => {
  const color = type === "material" ? "#e67e22" : getStatusColor(status);
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: "custom-marker",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const ProjectMap: React.FC<ProjectMapProps> = ({
  projects,
  locations,
  defaultCenter = [20.5279, -10.0309],
  defaultZoom = 6,
  height = "400px",
  className = "",
  focusRegion,
  selectable = false,
  onLocationSelect,
  interactive = true,
}) => {
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    if (locations) {
      setMapLocations(locations);
    } else if (projects) {
      const projectLocations: MapLocation[] = projects
        .flatMap((project) => {
          const coordinates = getProjectCoordinates(project);
          if (!coordinates) return [];
          return {
            id: project.id,
            name: project.title,
            type: "project" as const,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            status: project.status,
            region: project.location,
            startDate: project.startDate,
            endDate: project.endDate,
          };
        });
      setMapLocations(projectLocations);
    }
  }, [projects, locations]);

  const uniqueStatuses = Array.from(
    new Set(mapLocations.map((loc) => loc.status).filter(Boolean))
  );

  // -------- Multi-polygon intervention zones (visual + traceable) ------------
  // Aggregate `interventionZones` from every project so search/filter screens
  // can visualise multiple shapes (polygon/rectangle/circle/point) at once.
  const zoneOverlays = useMemo(() => {
    if (!projects?.length) return [] as Array<{
      projectId: string;
      projectTitle: string;
      zone: InterventionZoneDTO;
    }>;
    return projects.flatMap((p) =>
      (p.interventionZones ?? []).map((zone) => ({
        projectId: p.id,
        projectTitle: p.title,
        zone,
      }))
    );
  }, [projects]);

  useEffect(() => {
    if (zoneOverlays.length > 0) {
      console.info(
        `[ProjectMap] rendering ${zoneOverlays.length} intervention zone(s)`,
        zoneOverlays.map((o) => ({
          project: o.projectTitle,
          type: o.zone.type,
          label: o.zone.label,
          vertices: o.zone.coordinates.length,
          radiusMeters: o.zone.radiusMeters,
        }))
      );
    }
  }, [zoneOverlays]);

  const shapeColor = (t: InterventionZoneDTO['type']): string => {
    switch (t) {
      case 'rectangle':
        return '#7c3aed';
      case 'circle':
        return '#2563eb';
      case 'point':
        return '#0ea5e9';
      case 'polygon':
      default:
        return '#10b981';
    }
  };

  if (!mapLocations.length && !zoneOverlays.length) {
    return (
      <div className={`relative ${className}`} style={{ height }}>
        <div className="h-full flex items-center justify-center text-gray-500 bg-gray-100 rounded-lg">
          {t('dashboard.map_no_data')}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className} z-0`} style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%" }}
        className="rounded-lg"
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {mapLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={createCustomIcon(location.status, location.type)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-sm">{location.name}</h3>
                <p className="text-xs text-gray-600 mb-2">{location.region}</p>
                {location.adresse && (
                  <p className="text-xs text-gray-600 mb-2">
                    📍 {location.adresse}
                  </p>
                )}
                {location.status && (
                  <Badge
                    style={{ backgroundColor: getStatusColor(location.status) }}
                    className="text-white text-xs mb-1"
                  >
                    {location.status.toUpperCase()}
                  </Badge>
                )}
                {location.type === "material" && (
                  <Badge className="bg-orange-500 text-white text-xs mb-1">
                    {t('dashboard.material_label').toUpperCase()}
                  </Badge>
                )}
                {location.startDate && (
                  <p className="text-xs">
                    {t('dashboard.start_label')}: {" "}
                    {new Date(location.startDate).toLocaleDateString("fr-FR")}
                  </p>
                )}
                {location.endDate && (
                  <p className="text-xs">
                    {t('dashboard.end_label')}: {" "}
                    {new Date(location.endDate).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* === Intervention-zone overlays (multi-polygons / circles / points) === */}
        {zoneOverlays.map(({ projectId, projectTitle, zone }, idx) => {
          const color = shapeColor(zone.type);
          const key = `zone-${projectId}-${idx}`;
          if (zone.type === 'circle' && zone.coordinates[0]) {
            return (
              <Circle
                key={key}
                center={[zone.coordinates[0].lat, zone.coordinates[0].lng]}
                radius={zone.radiusMeters ?? 500}
                pathOptions={{ color, fillOpacity: 0.2 }}
              >
                <Popup>
                  <strong>{projectTitle}</strong>
                  <div className="text-xs">{zone.label ?? 'Zone'} · cercle · r={zone.radiusMeters ?? 0}m</div>
                </Popup>
              </Circle>
            );
          }
          if (zone.type === 'point' && zone.coordinates[0]) {
            return (
              <Marker
                key={key}
                position={[zone.coordinates[0].lat, zone.coordinates[0].lng]}
              >
                <Popup>
                  <strong>{projectTitle}</strong>
                  <div className="text-xs">{zone.label ?? 'Point'}</div>
                </Popup>
              </Marker>
            );
          }
          if (zone.coordinates.length >= 3) {
            return (
              <Polygon
                key={key}
                positions={zone.coordinates.map((c) => [c.lat, c.lng] as [number, number])}
                pathOptions={{ color, fillOpacity: 0.2 }}
              >
                <Popup>
                  <strong>{projectTitle}</strong>
                  <div className="text-xs">
                    {zone.label ?? 'Zone'} · {zone.type} · {zone.coordinates.length} sommets
                  </div>
                </Popup>
              </Polygon>
            );
          }
          return null;
        })}
      </MapContainer>

      {(uniqueStatuses.length > 0 || zoneOverlays.length > 0) && (
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border max-w-xs z-[1000]">
          <h4 className="font-semibold text-sm mb-2">{t('dashboard.legend_title')}</h4>
          <div className="grid grid-cols-1 gap-1 text-xs">
              <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border border-white shadow-sm flex-shrink-0"
                style={{ backgroundColor: "#e67e22" }}
              />
              <span className="truncate">{t('dashboard.materials_label')}</span>
            </div>
            {uniqueStatuses.map((status) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border border-white shadow-sm flex-shrink-0"
                  style={{ backgroundColor: getStatusColor(status) }}
                />
                <span className="truncate">{status}</span>
              </div>
            ))}
            {zoneOverlays.length > 0 && (
              <>
                <div className="border-t my-1" />
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Zones d'intervention ({zoneOverlays.length})
                </div>
                {(['polygon', 'rectangle', 'circle', 'point'] as const)
                  .filter((s) => zoneOverlays.some((o) => o.zone.type === s))
                  .map((s) => (
                    <div key={`zlg-${s}`} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 border border-white shadow-sm flex-shrink-0"
                        style={{
                          backgroundColor: shapeColor(s),
                          borderRadius: s === 'circle' || s === 'point' ? '9999px' : '2px',
                          opacity: 0.7,
                        }}
                      />
                      <span className="truncate capitalize">{s}</span>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMap;
