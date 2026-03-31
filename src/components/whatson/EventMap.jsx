import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Custom pink marker icon
const pinkIcon = new L.DivIcon({
  className: '',
  html: `<div style="
    width: 28px; height: 28px;
    background: #fc16a0;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
})

const activeIcon = new L.DivIcon({
  className: '',
  html: `<div style="
    width: 36px; height: 36px;
    background: #2d1b4e;
    border: 3px solid #fc16a0;
    border-radius: 50%;
    box-shadow: 0 2px 10px rgba(252,22,160,0.5);
  "></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
})

function FlyToEvent({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 14, { duration: 0.8 })
    }
  }, [lat, lng, map])
  return null
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export default function EventMap({ events, activeEventId, onMarkerClick, flyTo }) {
  const eventsWithCoords = events.filter((e) => e.lat && e.lng)

  return (
    <MapContainer
      center={[51.48, -0.01]}
      zoom={12}
      className="w-full h-full rounded-2xl"
      style={{ minHeight: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />

      {flyTo && <FlyToEvent lat={flyTo.lat} lng={flyTo.lng} />}

      {eventsWithCoords.map((event) => (
        <Marker
          key={event.id}
          position={[event.lat, event.lng]}
          icon={event.id === activeEventId ? activeIcon : pinkIcon}
          eventHandlers={{
            click: () => onMarkerClick?.(event.id),
          }}
        >
          <Popup>
            <div style={{ fontFamily: "'Nunito', sans-serif", minWidth: 180 }}>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, margin: '0 0 4px', color: '#2d1b4e' }}>
                {event.title}
              </p>
              {event.venue && (
                <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 2px' }}>{event.venue}</p>
              )}
              <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 2px' }}>
                {formatDate(event.date)} {event.time && `· ${event.time}`}
              </p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{event.location}</p>
              {event.is_free && (
                <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 12 }}>
                  Free
                </span>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
