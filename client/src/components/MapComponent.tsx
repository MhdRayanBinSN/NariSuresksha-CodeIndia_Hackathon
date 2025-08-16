import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { LatLngExpression, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeolocationPosition } from '../lib/geolocation';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  position?: GeolocationPosition;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    type: 'user' | 'incident' | 'report';
    popup?: string;
    count?: number;
  }>;
  center?: LatLngExpression;
  zoom?: number;
  className?: string;
  onClick?: (lat: number, lng: number) => void;
}

export const MapComponent = ({
  position,
  markers = [],
  center,
  zoom = 13,
  className = "h-64 w-full",
  onClick,
}: MapComponentProps) => {
  const mapRef = useRef<any>(null);

  const mapCenter: LatLngExpression = center || 
    (position ? [position.lat, position.lng] : [28.6139, 77.2090]); // Default to Delhi

  useEffect(() => {
    if (position && mapRef.current) {
      mapRef.current.flyTo([position.lat, position.lng], zoom);
    }
  }, [position, zoom]);

  const getMarkerIcon = (type: string, count?: number) => {
    const colors = {
      user: '#3B82F6', // Blue
      incident: '#EF4444', // Red
      report: '#F59E0B', // Amber
    };

    const color = colors[type as keyof typeof colors] || '#6B7280';
    
    return new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
          <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
          ${count ? `<text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${count}</text>` : ''}
        </svg>
      `)}`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  const handleMapClick = (e: any) => {
    if (onClick) {
      onClick(e.latlng.lat, e.latlng.lng);
    }
  };

  return (
    <div className={className} data-testid="map-component">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full rounded-lg"
        ref={mapRef}
        eventHandlers={{
          click: handleMapClick,
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User position marker */}
        {position && (
          <>
            <Marker 
              position={[position.lat, position.lng]}
              icon={getMarkerIcon('user')}
            >
              <Popup>Your current location</Popup>
            </Marker>
            {position.accuracy && (
              <Circle
                center={[position.lat, position.lng]}
                radius={position.accuracy}
                fillColor="#3B82F6"
                fillOpacity={0.1}
                color="#3B82F6"
                weight={1}
              />
            )}
          </>
        )}
        
        {/* Custom markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={getMarkerIcon(marker.type, marker.count)}
          >
            {marker.popup && <Popup>{marker.popup}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
