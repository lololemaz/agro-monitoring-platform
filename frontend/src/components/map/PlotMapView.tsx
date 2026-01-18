import { useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip, Marker, useMap } from 'react-leaflet';
import { Icon, LatLngBoundsExpression } from 'leaflet';
import { PlotWithReadings, PlotStatus } from '@/types/plot';
import 'leaflet/dist/leaflet.css';

const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface PlotMapViewProps {
  plots: PlotWithReadings[];
  farmCenter?: { lat: number; lng: number };
  onPlotClick?: (plot: PlotWithReadings) => void;
  className?: string;
}

const STATUS_COLORS: Record<PlotStatus, { fill: string; stroke: string }> = {
  ok: { fill: '#22c55e', stroke: '#16a34a' },
  warning: { fill: '#eab308', stroke: '#ca8a04' },
  critical: { fill: '#ef4444', stroke: '#dc2626' },
  offline: { fill: '#6b7280', stroke: '#4b5563' },
};

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();
  useMemo(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);
  return null;
}

export function PlotMapView({ plots, farmCenter, onPlotClick, className }: PlotMapViewProps) {
  const defaultCenter: [number, number] = farmCenter 
    ? [farmCenter.lat, farmCenter.lng] 
    : [-8.0578, -34.8829]; // Recife, PE

  const plotsWithPolygons = plots.filter(
    p => p.coordinates?.polygon && p.coordinates.polygon.length >= 3
  );

  const plotsWithPoints = plots.filter(
    p => p.coordinates?.latitude && p.coordinates?.longitude && !p.coordinates?.polygon
  );

  const bounds = useMemo(() => {
    const allPoints: [number, number][] = [];
    
    plotsWithPolygons.forEach(plot => {
      if (plot.coordinates?.polygon) {
        plot.coordinates.polygon.forEach(point => {
          allPoints.push(point);
        });
      }
    });

    plotsWithPoints.forEach(plot => {
      if (plot.coordinates?.latitude && plot.coordinates?.longitude) {
        allPoints.push([plot.coordinates.latitude, plot.coordinates.longitude]);
      }
    });

    if (allPoints.length === 0) return null;

    const lats = allPoints.map(p => p[0]);
    const lngs = allPoints.map(p => p[1]);

    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ] as LatLngBoundsExpression;
  }, [plotsWithPolygons, plotsWithPoints]);

  const getStatusColor = (status?: PlotStatus) => {
    return STATUS_COLORS[status || 'offline'];
  };

  const hasMapData = plotsWithPolygons.length > 0 || plotsWithPoints.length > 0;

  if (!hasMapData) {
    return (
      <div className={`bg-muted/30 rounded-lg border flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <p className="text-muted-foreground">Nenhum talhao com coordenadas definidas</p>
          <p className="text-sm text-muted-foreground mt-1">
            Adicione poligonos aos talhoes para visualizar no mapa
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden border ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a>'
        />

        {bounds && <FitBounds bounds={bounds} />}

        {plotsWithPolygons.map(plot => {
          const colors = getStatusColor(plot.status);
          return (
            <Polygon
              key={plot.id}
              positions={plot.coordinates!.polygon!}
              pathOptions={{
                color: colors.stroke,
                fillColor: colors.fill,
                fillOpacity: 0.5,
                weight: 2,
              }}
              eventHandlers={{
                click: () => onPlotClick?.(plot),
              }}
            >
              <Tooltip direction="top" sticky>
                <div className="text-sm">
                  <p className="font-semibold">{plot.name}</p>
                  {plot.code && <p className="text-xs text-gray-500">{plot.code}</p>}
                  <p className="text-xs">Area: {plot.area} ha</p>
                  {plot.health_score !== undefined && (
                    <p className="text-xs">Saude: {plot.health_score}%</p>
                  )}
                  {plot.current_soil_reading?.moisture !== undefined && (
                    <p className="text-xs">
                      Umidade: {Number(plot.current_soil_reading.moisture).toFixed(1)}%
                    </p>
                  )}
                </div>
              </Tooltip>
            </Polygon>
          );
        })}

        {plotsWithPoints.map(plot => (
          <Marker
            key={plot.id}
            position={[plot.coordinates!.latitude!, plot.coordinates!.longitude!]}
            icon={defaultIcon}
            eventHandlers={{
              click: () => onPlotClick?.(plot),
            }}
          >
            <Tooltip direction="top">
              <div className="text-sm">
                <p className="font-semibold">{plot.name}</p>
                {plot.code && <p className="text-xs text-gray-500">{plot.code}</p>}
                <p className="text-xs">Area: {plot.area} ha</p>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      <div className="bg-card border-t p-2 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.ok.fill }} />
          <span>OK</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.warning.fill }} />
          <span>Alerta</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.critical.fill }} />
          <span>Critico</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.offline.fill }} />
          <span>Offline</span>
        </div>
      </div>
    </div>
  );
}
