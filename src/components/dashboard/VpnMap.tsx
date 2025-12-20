import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '@/contexts/LanguageContext';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon
const customIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: hsl(217, 91%, 60%);
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 20px hsla(217, 91%, 60%, 0.6);
      animation: pulse-glow 2s ease-in-out infinite;
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface MapUpdaterProps {
  center: [number, number];
}

const MapUpdater = ({ center }: MapUpdaterProps) => {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo(center, map.getZoom(), { duration: 1.5 });
  }, [center, map]);
  return null;
};

interface VpnMapProps {
  location: {
    lat: number;
    lon: number;
    city: string;
    country: string;
    ip: string;
    org?: string;
  };
}

const VpnMap = ({ location }: VpnMapProps) => {
  const { t } = useLanguage();
  const position: [number, number] = [location.lat, location.lon];

  const countryFlags: Record<string, string> = {
    NL: '🇳🇱', US: '🇺🇸', DE: '🇩🇪', GB: '🇬🇧', FR: '🇫🇷', 
    JP: '🇯🇵', RU: '🇷🇺', CA: '🇨🇦', AU: '🇦🇺', CH: '🇨🇭',
  };

  return (
    <div className="dashboard-card h-[300px] lg:h-[400px] overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">{t('vpnLocation')}</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-2xl">{countryFlags[location.country] || '🌍'}</span>
          <span className="text-muted-foreground">{location.city}, {location.country}</span>
        </div>
      </div>
      <div className="h-[calc(100%-40px)] rounded-lg overflow-hidden">
        <MapContainer
          center={position}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <Marker position={position} icon={customIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{location.city}, {location.country}</p>
                <p className="text-xs font-mono">{location.ip}</p>
                {location.org && <p className="text-xs text-muted-foreground">{location.org}</p>}
              </div>
            </Popup>
          </Marker>
          <MapUpdater center={position} />
        </MapContainer>
      </div>
    </div>
  );
};

export default VpnMap;
