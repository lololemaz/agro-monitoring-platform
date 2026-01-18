import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Search, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  value?: Coordinates | null;
  onChange: (coords: Coordinates | null) => void;
  className?: string;
  height?: string;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (coords: Coordinates) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function MapCenterUpdater({ center }: { center: Coordinates | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center, map]);
  
  return null;
}

export function LocationPicker({ value, onChange, className, height = '300px' }: LocationPickerProps) {
  const [latInput, setLatInput] = useState(value?.lat?.toString() || '');
  const [lngInput, setLngInput] = useState(value?.lng?.toString() || '');
  const [mapCenter, setMapCenter] = useState<Coordinates>({ lat: -8.05, lng: -34.9 }); // Recife default

  useEffect(() => {
    if (value) {
      setLatInput(value.lat.toFixed(6));
      setLngInput(value.lng.toFixed(6));
      setMapCenter(value);
    }
  }, [value]);

  const handleMapClick = useCallback((coords: Coordinates) => {
    setLatInput(coords.lat.toFixed(6));
    setLngInput(coords.lng.toFixed(6));
    onChange(coords);
  }, [onChange]);

  const handleInputChange = useCallback(() => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const coords = { lat, lng };
      onChange(coords);
      setMapCenter(coords);
    }
  }, [latInput, lngInput, onChange]);

  const handleClearLocation = useCallback(() => {
    setLatInput('');
    setLngInput('');
    onChange(null);
  }, [onChange]);

  const handleUseCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLatInput(coords.lat.toFixed(6));
          setLngInput(coords.lng.toFixed(6));
          setMapCenter(coords);
          onChange(coords);
        },
        (error) => {
          console.error('Erro ao obter localizacao:', error);
        }
      );
    }
  }, [onChange]);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Localização</Label>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="lat" className="text-xs text-muted-foreground">Latitude</Label>
          <Input
            id="lat"
            type="number"
            step="any"
            placeholder="-8.050000"
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            onBlur={handleInputChange}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lng" className="text-xs text-muted-foreground">Longitude</Label>
          <Input
            id="lng"
            type="number"
            step="any"
            placeholder="-34.900000"
            value={lngInput}
            onChange={(e) => setLngInput(e.target.value)}
            onBlur={handleInputChange}
            className="h-9"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseCurrentLocation}
          className="flex-1"
        >
          <Crosshair className="w-4 h-4 mr-1.5" />
          Usar minha localização
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearLocation}
          >
            Limpar
          </Button>
        )}
      </div>

      <div className="rounded-lg overflow-hidden border" style={{ height }}>
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={handleMapClick} />
          <MapCenterUpdater center={value || null} />
          {value && (
            <Marker position={[value.lat, value.lng]} icon={defaultIcon} />
          )}
        </MapContainer>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Clique no mapa para selecionar a localização ou insira as coordenadas manualmente.
      </p>
    </div>
  );
}
