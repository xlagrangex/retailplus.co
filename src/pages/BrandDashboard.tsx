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
        <p className="page-subtitle">Panoramica avanzamento merchandising</p>
      </div>
      <StatsCards farmacie={farmacie} rilievi={rilievi} />
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-heading font-bold text-brand-700">Mappa nazionale</h2>
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
      <LegendItem color="#8da4b8" label="Da fare" />
      <LegendItem color="#5d8a82" label="In corso" />
      <LegendItem color="#2b7268" label="Completata" />
      <LegendItem color="#4a6fa5" label="In attesa" />
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
    const matchSearch = (f.nome + f.citta + f.indirizzo + f.provincia + f.cap + (f.codiceCliente || '') + (f.telefono || '')).toLowerCase().includes(search.toLowerCase())
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
                <th className="text-left px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Codice</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Farmacia</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Indirizzo</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Citta</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">CAP</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Prov.</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Telefono</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Stato</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Fasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {filtered.map(f => {
                const stato = getStatoFarmacia(rilievi, f.id)
                return (
                  <tr key={f.id} className="hover:bg-brand-50/50 transition-colors">
                    <td className="px-3 py-3 text-[13px] text-brand-500 font-mono">{f.codiceCliente || '—'}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-brand-900 text-[13px]">{f.nome}</p>
                    </td>
                    <td className="px-3 py-3 text-[13px] text-brand-600">{f.indirizzo || '—'}</td>
                    <td className="px-3 py-3 text-[13px] text-brand-600">{f.citta || '—'}</td>
                    <td className="px-3 py-3 text-[13px] text-brand-500">{f.cap || '—'}</td>
                    <td className="px-3 py-3 text-[13px] text-brand-500">{f.provincia || '—'}</td>
                    <td className="px-3 py-3 text-[13px] text-brand-500">{f.telefono || '—'}</td>
                    <td className="px-3 py-3">
                      <StatoBadge stato={stato} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        {[1, 2, 3].map(fase => {
                          const done = rilievi.some(r => r.farmaciaId === f.id && r.fase === fase && r.completata)
                          return (
                            <span
                              key={fase}
                              className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-semibold ${
                                done ? 'bg-status-done-50 text-status-done-700 border border-status-done-100' : 'bg-brand-50 text-brand-400 border border-brand-100'
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
    da_fare: { bg: 'bg-status-todo-50', text: 'text-status-todo-600', border: 'border-status-todo-100', dot: '#8da4b8' },
    in_corso: { bg: 'bg-status-progress-50', text: 'text-status-progress-600', border: 'border-status-progress-100', dot: '#5d8a82' },
    completata: { bg: 'bg-status-done-50', text: 'text-status-done-600', border: 'border-status-done-100', dot: '#2b7268' },
    in_attesa: { bg: 'bg-status-waiting-50', text: 'text-status-waiting-600', border: 'border-status-waiting-100', dot: '#4a6fa5' },
  }[stato] || { bg: 'bg-brand-50', text: 'text-brand-600', border: 'border-brand-100', dot: '#627d98' }

  return (
    <span className={`badge ${config.bg} ${config.text} border ${config.border}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.dot }} />
      {getLabelStato(stato)}
    </span>
  )
}
