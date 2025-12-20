import React from 'react';
import { MapPin, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const VpnMap = () => {
  const { t } = useLanguage();
  
  // Default/mock VPN location data
  const location = {
    lat: 52.3676,
    lon: 4.9041,
    city: 'Amsterdam',
    country: 'NL',
    ip: '185.x.x.x',
    org: 'NordVPN',
  };

  const countryFlags: Record<string, string> = {
    NL: '🇳🇱', US: '🇺🇸', DE: '🇩🇪', GB: '🇬🇧', FR: '🇫🇷', 
    JP: '🇯🇵', RU: '🇷🇺', CA: '🇨🇦', AU: '🇦🇺', CH: '🇨🇭',
  };

  // Using static map image instead of react-leaflet to avoid Context conflicts
  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-l+3b82f6(${location.lon},${location.lat})/${location.lon},${location.lat},4,0/600x400@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`;
  
  // Fallback to OpenStreetMap static image
  const osmMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${location.lon - 10},${location.lat - 5},${location.lon + 10},${location.lat + 5}&layer=mapnik&marker=${location.lat},${location.lon}`;

  return (
    <div className="dashboard-card h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          {t('vpnLocation')}
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-2xl">{countryFlags[location.country] || '🌍'}</span>
          <span className="text-muted-foreground">{location.city}, {location.country}</span>
        </div>
      </div>
      
      <div className="flex-1 min-h-[200px] rounded-lg overflow-hidden relative bg-muted">
        {/* Map iframe */}
        <iframe
          src={osmMapUrl}
          className="w-full h-full border-0"
          style={{ filter: 'hue-rotate(180deg) invert(90%) contrast(90%)' }}
          title="VPN Location Map"
        />
        
        {/* Overlay with location info */}
        <div className="absolute bottom-3 left-3 right-3 bg-card/90 backdrop-blur-sm rounded-lg p-2.5 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{location.city}, {location.country}</p>
                <p className="text-xs text-muted-foreground">{location.org}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs text-foreground">{location.ip}</p>
              <p className="text-[10px] text-muted-foreground">
                {location.lat.toFixed(2)}, {location.lon.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Pulse indicator */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ marginTop: '-30px' }}
        >
          <div className="w-6 h-6 rounded-full bg-primary animate-ping opacity-50" />
          <div className="absolute inset-0 w-6 h-6 rounded-full bg-primary border-2 border-white" />
        </div>
      </div>
    </div>
  );
};

export default VpnMap;
