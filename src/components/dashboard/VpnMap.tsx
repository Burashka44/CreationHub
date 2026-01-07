import React from 'react';
import { MapPin, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const VpnMap = () => {
  const { t } = useLanguage();
  const [location, setLocation] = React.useState({
    lat: 0,
    lon: 0,
    city: 'Loading...',
    country: '',
    ip: 'Loading...',
    org: 'Finding location...',
    countryCode: '',
    source: 'Initializing...'
  });
  const [mapUrl, setMapUrl] = React.useState('');

  React.useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch('/api/system/public-ip');
        const data = await res.json();

        // Support both direct object and envelope
        const loc = data.data || data;

        if (loc.error) throw new Error(loc.reason || 'API Error');
        if (!loc.ip && !loc.city) throw new Error('No IP data received');

        setLocation({
          lat: loc.latitude || 55.75,
          lon: loc.longitude || 37.61,
          city: loc.city || 'Unknown',
          country: loc.country || 'Unknown',
          countryCode: loc.country_code || '',
          ip: loc.ip || 'Unknown',
          org: loc.org || 'ISP Unknown',
          source: 'Server Proxy (Secure)'
        });

        // Only update map if coords exist
        if (loc.latitude && loc.longitude) {
          setMapUrl(`https://www.openstreetmap.org/export/embed.html?bbox=${loc.longitude - 10},${loc.latitude - 5},${loc.longitude + 10},${loc.latitude + 5}&layer=mapnik&marker=${loc.latitude},${loc.longitude}`);
        }



      } catch (e) {
        console.error("GeoIP fetch failed", e);
        // Fallback
        setLocation({
          lat: 55.75,
          lon: 37.61,
          city: 'Moscow',
          country: 'Russia',
          countryCode: 'RU',
          ip: 'Unknown',
          org: 'ISP Unknown',
          source: 'Error (Offline)'
        });
      }
    };

    fetchLocation();
  }, []);

  const countryFlags: Record<string, string> = {
    NL: '🇳🇱', US: '🇺🇸', DE: '🇩🇪', GB: '🇬🇧', FR: '🇫🇷',
    JP: '🇯🇵', RU: '🇷🇺', CA: '🇨🇦', AU: '🇦🇺', CH: '🇨🇭',
  };

  const getFlag = (code: string) => {
    if (!code) return '🌍';
    const codeUpper = code.toUpperCase();
    return countryFlags[codeUpper] || codeUpper;
  };

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          {t('vpnLocation')}
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-2xl">{getFlag(location.countryCode)}</span>
          <span className="text-muted-foreground">{location.city}, {location.country}</span>
        </div>
      </div>

      <div className="flex-1 min-h-[200px] rounded-lg overflow-hidden relative bg-muted">
        {/* Map iframe */}
        {mapUrl && (
          <iframe
            src={mapUrl}
            className="w-full h-full border-0"
            style={{ filter: 'hue-rotate(180deg) invert(90%) contrast(90%)' }}
            title="VPN Location Map"
          />
        )}

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
              <p className="text-[10px] text-muted-foreground">{location.source}</p>
              <p className="text-[10px] text-muted-foreground">
                {location.lat ? `${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}` : ''}
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
