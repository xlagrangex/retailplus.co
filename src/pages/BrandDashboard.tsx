import { useData } from '../context/DataContext'
import StatsCards from '../components/StatsCards'
import FarmaciaMap from '../components/FarmaciaMap'
import { getStatoFarmacia, getColoreStato, getLabelStato } from '../types'
import { useState } from 'react'
import { Search, MapPin } from 'lucide-react'

export default function BrandDashboard() {
  const { farmacie, rilievi } = useData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Panoramica avanzamento espositori</p>
      </div>
      <StatsCards farmacie={farmacie} rilievi={rilievi} />
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Mappa Farmacie</h2>
        <FarmaciaMap farmacie={farmacie} rilievi={rilievi} height="450px" />
        <div className="flex items-center gap-6 mt-3 justify-center">
          <LegendItem color="#ef4444" label="Da fare" />
          <LegendItem color="#eab308" label="In corso" />
          <LegendItem color="#22c55e" label="Completata" />
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </div>
  )
}

export function BrandMapPage() {
  const { farmacie, rilievi } = useData()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Mappa Espositori</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <FarmaciaMap farmacie={farmacie} rilievi={rilievi} height="calc(100vh - 220px)" />
        <div className="flex items-center gap-6 mt-3 justify-center">
          <LegendItem color="#ef4444" label="Da fare" />
          <LegendItem color="#eab308" label="In corso" />
          <LegendItem color="#22c55e" label="Completata" />
        </div>
      </div>
    </div>
  )
}

export function BrandFarmaciePage() {
  const { farmacie, rilievi } = useData()
  const [search, setSearch] = useState('')
  const [filtroStato, setFiltroStato] = useState<string>('tutti')

  const filtered = farmacie.filter(f => {
    const matchSearch = (f.nome + f.citta + f.indirizzo).toLowerCase().includes(search.toLowerCase())
    const stato = getStatoFarmacia(rilievi, f.id)
    const matchStato = filtroStato === 'tutti' || stato === filtroStato
    return matchSearch && matchStato
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Elenco Farmacie</h1>

      {/* Filtri */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca farmacia, citta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select
          value={filtroStato}
          onChange={e => setFiltroStato(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="tutti">Tutti gli stati</option>
          <option value="da_fare">Da fare</option>
          <option value="in_corso">In corso</option>
          <option value="completata">Completate</option>
        </select>
      </div>

      {/* Tabella */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Farmacia</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Citta</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stato</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Fasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(f => {
                const stato = getStatoFarmacia(rilievi, f.id)
                const fasiComplete = rilievi.filter(r => r.farmaciaId === f.id && r.completata).length
                return (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{f.nome}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin size={12} /> {f.indirizzo}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{f.citta} ({f.provincia})</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: getColoreStato(stato) + '20',
                          color: getColoreStato(stato),
                        }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getColoreStato(stato) }} />
                        {getLabelStato(stato)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex gap-1">
                        {[1, 2, 3].map(fase => {
                          const done = rilievi.some(r => r.farmaciaId === f.id && r.fase === fase && r.completata)
                          return (
                            <span
                              key={fase}
                              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
                                done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              {fase}
                            </span>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-gray-400">Nessuna farmacia trovata</p>
        )}
      </div>
    </div>
  )
}
