import { useData } from '../context/DataContext'
import StatsCards from '../components/StatsCards'
import FarmaciaMap from '../components/FarmaciaMap'
import { getStatoFarmacia, getLabelStato, StatoFarmacia } from '../types'
import { useState } from 'react'
import { Search, MapPin, Filter } from 'lucide-react'

export default function BrandDashboard() {
  const { farmacie, rilievi } = useData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Panoramica avanzamento allestimenti</p>
      </div>
      <StatsCards farmacie={farmacie} rilievi={rilievi} />
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-brand-700">Mappa nazionale</h2>
          <Legend />
        </div>
        <FarmaciaMap farmacie={farmacie} rilievi={rilievi} height="450px" />
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <LegendItem color="#d64545" label="Da fare" />
      <LegendItem color="#de911d" label="In corso" />
      <LegendItem color="#3f9142" label="Completata" />
      <LegendItem color="#6366f1" label="In attesa" />
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-brand-500">
      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </div>
  )
}

export function BrandMapPage() {
  const { farmacie, rilievi } = useData()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Mappa espositori</h1>
          <p className="page-subtitle">Visualizzazione geografica di tutti i punti vendita</p>
        </div>
        <Legend />
      </div>
      <div className="card p-4">
        <FarmaciaMap farmacie={farmacie} rilievi={rilievi} height="calc(100vh - 220px)" />
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
      <div>
        <h1 className="page-title">Elenco farmacie</h1>
        <p className="page-subtitle">{farmacie.length} punti vendita registrati</p>
      </div>

      {/* Filtri */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input
            type="text"
            placeholder="Cerca per nome, citta o indirizzo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none" />
          <select
            value={filtroStato}
            onChange={e => setFiltroStato(e.target.value)}
            className="input pl-9 pr-8 appearance-none cursor-pointer"
          >
            <option value="tutti">Tutti gli stati</option>
            <option value="da_fare">Da fare</option>
            <option value="in_corso">In corso</option>
            <option value="completata">Completate</option>
            <option value="in_attesa">In attesa materiale</option>
          </select>
        </div>
      </div>

      {/* Tabella */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Farmacia</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider hidden sm:table-cell">Localita</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Stato</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider hidden md:table-cell">Fasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {filtered.map(f => {
                const stato = getStatoFarmacia(rilievi, f.id)
                return (
                  <tr key={f.id} className="hover:bg-brand-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-brand-900 text-[13px]">{f.nome}</p>
                      <p className="text-xs text-brand-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {f.indirizzo}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-brand-600 hidden sm:table-cell">
                      {f.citta} <span className="text-brand-400">({f.provincia})</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatoBadge stato={stato} />
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="flex gap-1">
                        {[1, 2, 3].map(fase => {
                          const done = rilievi.some(r => r.farmaciaId === f.id && r.fase === fase && r.completata)
                          return (
                            <span
                              key={fase}
                              className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-semibold ${
                                done ? 'bg-success-50 text-success-700 border border-success-100' : 'bg-brand-50 text-brand-400 border border-brand-100'
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
          <p className="text-center py-10 text-brand-400 text-sm">Nessuna farmacia trovata</p>
        )}
      </div>
    </div>
  )
}

function StatoBadge({ stato }: { stato: StatoFarmacia }) {
  const config = {
    da_fare: { bg: 'bg-danger-50', text: 'text-danger-600', border: 'border-danger-100', dot: '#d64545' },
    in_corso: { bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-100', dot: '#de911d' },
    completata: { bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-100', dot: '#3f9142' },
    in_attesa: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', dot: '#6366f1' },
  }[stato] || { bg: 'bg-brand-50', text: 'text-brand-600', border: 'border-brand-100', dot: '#627d98' }

  return (
    <span className={`badge ${config.bg} ${config.text} border ${config.border}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.dot }} />
      {getLabelStato(stato)}
    </span>
  )
}
