import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { Farmacia, Rilievo, getStatoFarmacia, getColoreStato, getLabelStato } from '../types'
import { useEffect } from 'react'

interface Props {
  farmacie: Farmacia[]
  rilievi: Rilievo[]
  onFarmaciaClick?: (f: Farmacia) => void
  height?: string
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
  // Centro Italia default
  const center: [number, number] = [42.0, 12.5]

  return (
    <MapContainer
      center={center}
      zoom={6}
      style={{ height, width: '100%', borderRadius: '0.75rem' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds farmacie={farmacie} />
      {farmacie.map(f => {
        const stato = getStatoFarmacia(rilievi, f.id)
        const colore = getColoreStato(stato)
        const fasiComplete = rilievi.filter(r => r.farmaciaId === f.id && r.completata).length

        return (
          <CircleMarker
            key={f.id}
            center={[f.lat, f.lng]}
            radius={10}
            pathOptions={{
              color: colore,
              fillColor: colore,
              fillOpacity: 0.8,
              weight: 2,
            }}
            eventHandlers={{
              click: () => onFarmaciaClick?.(f),
            }}
          >
            <Popup>
              <div className="text-sm min-w-[200px]">
                <p className="font-bold text-base">{f.nome}</p>
                <p className="text-gray-500">{f.indirizzo}, {f.citta}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: colore }}
                  />
                  <span className="font-medium">{getLabelStato(stato)}</span>
                  <span className="text-gray-400">({fasiComplete}/3 fasi)</span>
                </div>
                {f.referente && <p className="mt-1 text-gray-500">Ref: {f.referente}</p>}
                {f.telefono && <p className="text-gray-500">Tel: {f.telefono}</p>}
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
