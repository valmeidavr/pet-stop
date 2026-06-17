'use client'

import { useState } from 'react'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

function toIconUrl(img: string | { src: string }): string {
  return typeof img === 'string' ? img : img.src
}

const icon = L.icon({
  iconUrl: toIconUrl(markerIcon),
  iconRetinaUrl: toIconUrl(markerIcon2x),
  shadowUrl: toIconUrl(markerShadow),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export function MapPickerInner({
  latName,
  lngName,
  defaultCenter,
}: {
  latName: string
  lngName: string
  defaultCenter: [number, number]
}) {
  const [pos, setPos] = useState<[number, number] | null>(null)
  const center = pos ?? defaultCenter

  return (
    <div className="map-picker">
      <p className="map-picker__hint">Arraste o pino para a localização exata do estabelecimento.</p>
      <input type="hidden" name={latName} value={pos ? pos[0] : ''} readOnly />
      <input type="hidden" name={lngName} value={pos ? pos[1] : ''} readOnly />
      <MapContainer center={center} zoom={13} className="map-picker__map" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={center}
          icon={icon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const m = e.target as L.Marker
              const ll = m.getLatLng()
              setPos([ll.lat, ll.lng])
            },
          }}
        />
      </MapContainer>
    </div>
  )
}
