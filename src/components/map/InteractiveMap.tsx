import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Globe,
  Target,
  Info,
  Compass,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default markers in Leaflet - more robust approach
const DefaultIcon = L.icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

type Coordinate = { lat: number; lng: number };

interface MapData {
  center?: Coordinate;
  polygon?: Coordinate[];
  warehouseShape?: Coordinate[];
  address?: string;
  shapeType?: "polygon" | "rectangle" | "circle" | "diamond";
}

interface InteractiveMapProps {
  title?: string;
  description?: string;
  value?: MapData;
  onChange?: (data: MapData) => void;
  allowPolygon?: boolean;
  className?: string;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  title = "Carte interactive",
  description = "Sélectionnez une localisation sur la carte",
  value = {},
  onChange,
  allowPolygon = false,
  className = "",
}) => {
  const [mapData, setMapData] = useState<MapData>(value);
  const [address, setAddress] = useState(value?.address || "");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const mauritaniaCities = [
    { name: "Nouakchott", lat: 18.0735, lng: -15.9582, isCapital: true },
    { name: "Nouadhibou", lat: 20.9, lng: -17.0347 },
    { name: "Rosso", lat: 16.5167, lng: -15.8 },
    { name: "Kaédi", lat: 16.15, lng: -13.5 },
    { name: "Zouérat", lat: 22.75, lng: -12.4667 },
    { name: "Kiffa", lat: 16.6167, lng: -11.4 },
    { name: "Atar", lat: 20.5167, lng: -13.05 },
    { name: "Aleg", lat: 17.05, lng: -13.9167 },
    { name: "Boutilimit", lat: 17.55, lng: -14.7 },
    { name: "Tidjikja", lat: 18.55, lng: -11.4333 },
  ];

  useEffect(() => {
    if (value) {
      setMapData(value);
      setAddress(value.address || "");
    }
  }, [value]);

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    const updatedData = { ...mapData, address: newAddress };
    setMapData(updatedData);
    if (onChange) {
      onChange(updatedData);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        const updatedData = { ...mapData, center };
        setMapData(updatedData);

        if (onChange) {
          onChange(updatedData);
        }

        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Erreur de géolocalisation:", error);
        alert(
          "Impossible d'obtenir votre position. Veuillez vérifier les permissions de géolocalisation."
        );
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const mapCenter: [number, number] = mapData.center
    ? [mapData.center.lat, mapData.center.lng]
    : [20.0, -12.0];
  const mapZoom = mapData.center ? 10 : 6;

  return (
    <Card className={`${className} border-0 shadow-elegant bg-gradient-to-br from-card via-card/90 to-muted/20 backdrop-blur-sm`}>
      <CardHeader className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-b border-border/50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-lg">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
          </div>
          <Badge variant="secondary" className="bg-gradient-to-r from-accent/20 to-accent/10 text-accent-foreground border-accent/20">
            <Compass className="h-3 w-3 mr-1" />
            Mauritanie
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-3">
          <Label htmlFor="map-address" className="text-sm font-medium text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Adresse de localisation
          </Label>
          <Input
            id="map-address"
            placeholder="Saisissez l'adresse complète..."
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            className="border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background/50 backdrop-blur-sm"
          />
        </div>

        {mapData.center && (
          <div className="bg-gradient-to-r from-muted/50 to-accent/10 border border-accent/20 p-4 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Coordonnées GPS précises</span>
            </div>
            <div className="font-mono text-sm text-muted-foreground bg-background/60 px-3 py-2 rounded-lg border">
              Lat: {mapData.center.lat.toFixed(6)} | Lng: {mapData.center.lng.toFixed(6)}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Carte interactive de la Mauritanie
          </Label>
          <div className="relative z-0 w-full h-96 border border-border/50 rounded-xl overflow-hidden shadow-lg bg-background/50 backdrop-blur-sm">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {mauritaniaCities.map((city, index) => (
                <Marker key={index} position={[city.lat, city.lng]}>
                  <Popup>
                    <div className="text-center">
                      <strong
                        className={
                          city.isCapital ? "text-red-600" : "text-blue-600"
                        }
                      >
                        {city.name}
                      </strong>
                      {city.isCapital && (
                        <div className="text-xs text-red-500">Capitale</div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}

              {mapData.center && (
                <Marker position={[mapData.center.lat, mapData.center.lng]}>
                  <Popup>
                    <div className="text-center">
                      <strong className="text-green-600">
                        Position sélectionnée
                      </strong>
                      <div className="text-xs text-gray-600">
                        {mapData.center.lat.toFixed(6)},{" "}
                        {mapData.center.lng.toFixed(6)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {mapData.warehouseShape && mapData.warehouseShape.length > 0 && (
                <Polygon
                  positions={mapData.warehouseShape.map((point) => ({
                    lat: point.lat,
                    lng: point.lng,
                  }))}
                  pathOptions={{
                    color: "#3b82f6",
                    fillColor: "#3b82f6",
                    fillOpacity: 0.2,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="text-center">
                      <strong className="text-blue-600">
                        Forme de l'entrepôt
                      </strong>
                      <div className="text-xs text-gray-600">
                        Type: {mapData?.shapeType || "polygon"}
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              )}
            </MapContainer>

            {!mapData.center && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1001] bg-black/10 backdrop-blur-sm">
                <div className="bg-gradient-to-br from-background/95 to-muted/95 border border-border/50 px-6 py-4 rounded-xl shadow-lg text-center backdrop-blur-sm">
                  <Target className="h-10 w-10 mx-auto text-primary mb-3" />
                  <p className="text-sm text-foreground font-medium mb-1">
                    Cliquez sur la carte pour sélectionner une position
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Explorez les villes de Mauritanie avec les contrôles de navigation
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="flex items-center gap-2 bg-gradient-to-r from-background to-muted/50 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all shadow-md"
          >
            <Navigation
              className={`h-4 w-4 ${isGettingLocation ? "animate-spin text-primary" : "text-accent"}`}
            />
            {isGettingLocation
              ? "Localisation en cours..."
              : "Utiliser ma position GPS actuelle"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveMap;
