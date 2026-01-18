import { useRef, useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L, { Icon } from 'leaflet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LocateFixed, Navigation, Pencil, Trash2, Check, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const vertexIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxMiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI2IiBjeT0iNiIgcj0iNSIgZmlsbD0id2hpdGUiIHN0cm9rZT0iIzIyYzU1ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

interface PolygonEditorProps {
  center?: [number, number];
  zoom?: number;
  defaultPolygon?: [number, number][];
  onPolygonChange?: (polygon: [number, number][]) => void;
  onAreaChange?: (areaHa: number) => void;
  className?: string;
  readOnly?: boolean;
}

function GoToLocation({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], zoom || 17);
    }
  }, [lat, lng, zoom, map]);
  return null;
}

interface DrawingHandlerProps {
  isDrawing: boolean;
  points: [number, number][];
  onAddPoint: (point: [number, number]) => void;
}

function DrawingHandler({ isDrawing, points, onAddPoint }: DrawingHandlerProps) {
  const [mousePosition, setMousePosition] = useState<[number, number] | null>(null);

  useMapEvents({
    click: (e) => {
      if (isDrawing) {
        onAddPoint([e.latlng.lat, e.latlng.lng]);
      }
    },
    mousemove: (e) => {
      if (isDrawing) {
        setMousePosition([e.latlng.lat, e.latlng.lng]);
      }
    },
  });

  if (!isDrawing || points.length === 0 || !mousePosition) return null;

  return (
    <Polyline
      positions={[...points, mousePosition]}
      pathOptions={{ color: '#22c55e', weight: 2, dashArray: '5, 5' }}
    />
  );
}

export function PolygonEditor({
  center = [-8.0578, -34.8829],
  zoom = 16,
  defaultPolygon = [],
  onPolygonChange,
  onAreaChange,
  className,
  readOnly = false,
}: PolygonEditorProps) {
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [goToCoords, setGoToCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [polygon, setPolygon] = useState<[number, number][]>(defaultPolygon);

  useEffect(() => {
    if (center && !latInput && !lngInput) {
      setLatInput(center[0].toString());
      setLngInput(center[1].toString());
    }
  }, [center]);

  useEffect(() => {
    setPolygon(defaultPolygon);
  }, [defaultPolygon]);

  const calculateArea = useCallback((coords: [number, number][]) => {
    if (coords.length < 3) return 0;
    const latLngPoints = coords.map(([lat, lng]) => L.latLng(lat, lng));
    const areaM2 = L.GeometryUtil.geodesicArea(latLngPoints);
    return Math.round((areaM2 / 10000) * 1000) / 1000;
  }, []);

  const handleGoToCoords = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setGoToCoords({ lat, lng });
    } else {
      alert('Coordenadas invalidas. Latitude deve estar entre -90 e 90, Longitude entre -180 e 180.');
    }
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLatInput(lat.toFixed(6));
          setLngInput(lng.toFixed(6));
          setGoToCoords({ lat, lng });
        },
        (err) => {
          console.error('Erro ao obter localizacao:', err);
          alert('Nao foi possivel obter sua localizacao. Verifique as permissoes do navegador.');
        }
      );
    }
  };

  const startDrawing = () => {
    setIsDrawing(true);
    setDrawingPoints([]);
  };

  const addPoint = (point: [number, number]) => {
    setDrawingPoints(prev => [...prev, point]);
  };

  const finishDrawing = () => {
    if (drawingPoints.length >= 3) {
      const newPolygon = [...drawingPoints];
      setPolygon(newPolygon);
      const area = calculateArea(newPolygon);
      
      console.log('Poligono criado:', newPolygon, 'Area:', area, 'ha');
      
      onPolygonChange?.(newPolygon);
      onAreaChange?.(area);
    }
    setIsDrawing(false);
    setDrawingPoints([]);
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setDrawingPoints([]);
  };

  const clearPolygon = () => {
    setPolygon([]);
    onPolygonChange?.([]);
    onAreaChange?.(0);
  };

  const currentArea = polygon.length >= 3 ? calculateArea(polygon) : 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Inputs de coordenadas */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Latitude</Label>
          <Input
            placeholder="-8.0578"
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            type="number"
            step="0.000001"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Longitude</Label>
          <Input
            placeholder="-34.8829"
            value={lngInput}
            onChange={(e) => setLngInput(e.target.value)}
            type="number"
            step="0.000001"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleGoToCoords} className="flex-1">
          <Navigation className="w-4 h-4 mr-2" />
          Ir para coordenadas
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleLocateMe} className="flex-1">
          <LocateFixed className="w-4 h-4 mr-2" />
          Usar minha localizacao
        </Button>
      </div>

      {/* Controles de desenho */}
      {!readOnly && (
        <div className="flex gap-2 items-center">
          {!isDrawing ? (
            <>
              <Button type="button" variant="default" size="sm" onClick={startDrawing}>
                <Pencil className="w-4 h-4 mr-2" />
                Desenhar area
              </Button>
              {polygon.length > 0 && (
                <Button type="button" variant="destructive" size="sm" onClick={clearPolygon}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              )}
            </>
          ) : (
            <>
              <Button 
                type="button" 
                variant="default" 
                size="sm" 
                onClick={finishDrawing}
                disabled={drawingPoints.length < 3}
              >
                <Check className="w-4 h-4 mr-2" />
                Finalizar ({drawingPoints.length} pontos)
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={cancelDrawing}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </>
          )}
          {polygon.length > 0 && !isDrawing && (
            <span className="text-sm text-muted-foreground ml-2">
              Area: <strong>{currentArea.toFixed(3)} ha</strong> ({polygon.length} vertices)
            </span>
          )}
        </div>
      )}

      {isDrawing && (
        <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950 p-2 rounded">
          Clique no mapa para adicionar pontos. Minimo 3 pontos para formar uma area.
        </p>
      )}

      {/* Mapa */}
      <div className="rounded-lg overflow-hidden border" style={{ height: '400px' }}>
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a>'
          />

          {goToCoords && <GoToLocation lat={goToCoords.lat} lng={goToCoords.lng} zoom={17} />}

          <DrawingHandler 
            isDrawing={isDrawing} 
            points={drawingPoints} 
            onAddPoint={addPoint} 
          />

          {/* Pontos sendo desenhados */}
          {isDrawing && drawingPoints.map((point, idx) => (
            <Marker key={idx} position={point} icon={vertexIcon} />
          ))}

          {/* Linha conectando pontos durante desenho */}
          {isDrawing && drawingPoints.length >= 2 && (
            <Polyline
              positions={drawingPoints}
              pathOptions={{ color: '#22c55e', weight: 2 }}
            />
          )}

          {/* Poligono finalizado */}
          {!isDrawing && polygon.length >= 3 && (
            <Polygon
              positions={polygon}
              pathOptions={{
                color: '#22c55e',
                fillColor: '#22c55e',
                fillOpacity: 0.3,
                weight: 2,
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
