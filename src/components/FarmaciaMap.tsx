import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { Farmacia, Rilievo, getStatoFarmacia, getLabelStato } from '../types'
import { useEffect } from 'react'

interface Props {
  farmacie: Farmacia[]
  rilievi: Rilievo[]
  onFarmaciaClick?: (f: Farmacia) => void
  height?: string
}

function getMapColor(stato: string): string {
  switch (stato) {
    case 'da_fare': return '#d64545'
    case 'in_corso': return '#de911d'
    case 'completata': return '#3f9142'
    case 'in_attesa': return '#6366f1'
    default: return '#627d98'
  }
}

function FitBounds({ farmacie }: { farmacie: Farmacia[] }) {
  const map = useMap()
  useEffect(() => {
    if (farmacie.length > 0) {
      const bounds = farmacie.map(f => [f.lat, f.lng] as [number, number])
      map.fitBounds(bounds, { padding: [30, 30] })
    }
  }, [farmacie, map])
  return null
}

export default function FarmaciaMap({ farmacie, rilievi, onFarmaciaClick, height = '500px' }: Props) {
  const center: [number, number] = [42.0, 12.5]

  return (
    <MapContainer
      center={center}
      zoom={6}
      style={{ height, width: '100%', borderRadius: '6px' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FitBounds farmacie={farmacie} />
      {farmacie.map(f => {
        const stato = getStatoFarmacia(rilievi, f.id)
        const colore = getMapColor(stato)
        const fasiComplete = rilievi.filter(r => r.farmaciaId === f.id && r.completata).length

        return (
          <CircleMarker
            key={f.id}
            center={[f.lat, f.lng]}
            radius={8}
            pathOptions={{
              color: 'white',
              fillColor: colore,
              fillOpacity: 0.9,
              weight: 2,
            }}
            eventHandlers={{
              click: () => onFarmaciaClick?.(f),
            }}
          >
            <Popup>
              <div className="text-[13px] min-w-[200px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                <p className="font-semibold text-sm mb-0.5" style={{ color: '#102a43' }}>{f.nome}</p>
                <p style={{ color: '#829ab1' }}>{f.indirizzo}, {f.citta}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colore }} />
                  <span className="font-medium" style={{ color: '#334e68' }}>{getLabelStato(stato)}</span>
                  <span style={{ color: '#9fb3c8' }}>({fasiComplete}/3)</span>
                </div>
                {f.referente && <p className="mt-1.5" style={{ color: '#829ab1' }}>Referente: {f.referente}</p>}
                {f.telefono && <p style={{ color: '#829ab1' }}>Tel: {f.telefono}</p>}
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
