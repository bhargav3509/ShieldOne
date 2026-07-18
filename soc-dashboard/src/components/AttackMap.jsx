import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const SEVERITY_SHADES = {
  high: '#ffffff',
  medium: '#999999',
  low: '#555555',
};

export default function AttackMap({ attacks, theme }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        y: 30,
        opacity: 0,
        scale: 0.95,
        duration: 0.7,
        ease: 'power3.out',
        delay: 0.6,
      });
    });

    return () => ctx.revert();
  }, []);

  // Adjust marker colors based on theme
  const getMarkerColor = (severity) => {
    if (theme === 'light') {
      return { high: '#111111', medium: '#666666', low: '#aaaaaa' }[severity] || '#888888';
    }
    return SEVERITY_SHADES[severity] || '#888888';
  };

  const tileUrl =
    theme === 'light'
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="card" ref={cardRef}>
      <div className="card-title">
        <span className="icon">◎</span>
        Global Attack Map
      </div>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom={false}
        style={{
          height: '260px',
          width: '100%',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <TileLayer
          key={theme}
          url={tileUrl}
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        {attacks.map((a) => {
          const color = getMarkerColor(a.severity);
          return (
            <CircleMarker
              key={a.id}
              center={[a.lat, a.lng]}
              radius={a.severity === 'high' ? 7 : a.severity === 'medium' ? 5 : 4}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.6,
                weight: 1,
              }}
            >
              <Popup>
                <div style={{ fontSize: '0.78rem' }}>
                  <strong>{a.type}</strong>
                  <br />
                  <span style={{ opacity: 0.7 }}>{a.ip}</span>
                  <br />
                  <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                    {a.severity}
                  </span>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
