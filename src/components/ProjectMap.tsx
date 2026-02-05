import "leaflet/dist/leaflet.css";
import L from "leaflet";
import React, { useEffect, useState } from "react";
import { useLanguage } from '@/contexts/LanguageContext';
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { ProjectData } from "@/dtos/entities/ProjectDTO";
import { Badge } from "@/components/ui/badge";

// Fix default marker icons
const DefaultIcon = L.icon({
  iconUrl: "/node_modules/leaflet/dist/images/marker-icon.png",
  iconRetinaUrl: "/node_modules/leaflet/dist/images/marker-icon-2x.png",
  shadowUrl: "/node_modules/leaflet/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export interface MapLocation {
  id: string;
  name: string;
  type: "project" | "warehouse" | "material";
  latitude: number;
  longitude: number;
  status?: string;
  region?: string;
  startDate?: string;
  endDate?: string;
  warehouseShape?: { lat: number; lng: number }[];
  warehouseShapeType?: "polygon" | "rectangle" | "circle";
  adresse?: string | undefined;
}

export type ProjectStatus =
  | "en cours"
  | "terminé"
  | "en attente"
  | "en inspection"
  | "suspendu"
  | "annulé";

interface ProjectMapProps {
  projects?: ProjectData[];
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
        .filter(
          (project) =>
            project.coordinates?.latitude && project.coordinates?.longitude
        )
        .map((project) => ({
          id: project.id,
          name: project.title,
          type: "project" as const,
          latitude: project.coordinates!.latitude,
          longitude: project.coordinates!.longitude,
          status: project.status,
          region: project.location,
          startDate: project.startDate,
          endDate: project.endDate,
        }));
      setMapLocations(projectLocations);
    }
  }, [projects, locations]);

  const uniqueStatuses = Array.from(
    new Set(mapLocations.map((loc) => loc.status).filter(Boolean))
  );

  if (!mapLocations.length) {
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
      </MapContainer>

      {uniqueStatuses.length > 0 && (
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
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMap;
