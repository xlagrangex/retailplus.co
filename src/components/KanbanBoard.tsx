import { useMemo, useState } from 'react'
import { Farmacia, Rilievo, Assegnazione, User, StatoFarmacia, FaseNumero, getStatoFarmacia, getLabelStato } from '../types'
import { MapPin, Search, Package, Users } from 'lucide-react'

interface KanbanBoardProps {
  farmacie: Farmacia[]
  rilievi: Rilievo[]
  assegnazioni: Assegnazione[]
  users: User[]
  showMerchandiserName?: boolean
  showFilters?: boolean
  onFarmaciaClick?: (farmacia: Farmacia) => void
}

const columns: { stato: StatoFarmacia; label: string; dot: string; bg: string; headerBg: string; border: string }[] = [
  { stato: 'da_fare', label: 'Da fare', dot: '#8da4b8', bg: 'bg-status-todo-50', headerBg: 'bg-status-todo-50', border: 'border-status-todo-100' },
  { stato: 'in_attesa', label: 'In attesa', dot: '#4a6fa5', bg: 'bg-status-waiting-50', headerBg: 'bg-status-waiting-50', border: 'border-status-waiting-100' },
  { stato: 'in_corso', label: 'In corso', dot: '#5d8a82', bg: 'bg-status-progress-50', headerBg: 'bg-status-progress-50', border: 'border-status-progress-100' },
  { stato: 'completata', label: 'Completata', dot: '#2b7268', bg: 'bg-status-done-50', headerBg: 'bg-status-done-50', border: 'border-status-done-100' },
]

export default function KanbanBoard({
  farmacie,
  rilievi,
  assegnazioni,
  users,
  showMerchandiserName = false,
  showFilters = false,
  onFarmaciaClick,
}: KanbanBoardProps) {
  const [search, setSearch] = useState('')
  const [filterMerchandiser, setFilterMerchandiser] = useState('')
  const [filterProvincia, setFilterProvincia] = useState('')

  const merchandisers = useMemo(() => users.filter(u => u.ruolo === 'merchandiser'), [users])
  const province = useMemo(() => [...new Set(farmacie.map(f => f.provincia).filter(Boolean))].sort(), [farmacie])

  const filtered = useMemo(() => {
    return farmacie.filter(f => {
      if (search && !(f.nome + f.citta + f.indirizzo + f.provincia).toLowerCase().includes(search.toLowerCase())) return false
      if (filterProvincia && f.provincia !== filterProvincia) return false
      if (filterMerchandiser) {
        const ass = assegnazioni.find(a => a.farmaciaId === f.id)
        if (!ass || ass.merchandiserId !== filterMerchandiser) return false
      }
      return true
    })
  }, [farmacie, search, filterProvincia, filterMerchandiser, assegnazioni])

  const grouped = useMemo(() => {
    const map: Record<StatoFarmacia, Farmacia[]> = { da_fare: [], in_attesa: [], in_corso: [], completata: [] }
    filtered.forEach(f => {
      const stato = getStatoFarmacia(rilievi, f.id)
      map[stato].push(f)
    })
    return map
  }, [filtered, rilievi])

  // Stats
  const total = filtered.length
  const completate = grouped.completata.length
  const percentuale = total > 0 ? Math.round((completate / total) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-brand-700">Avanzamento complessivo</p>
          <span className="text-sm font-heading font-bold text-brand-900">{percentuale}%</span>
        </div>
        <div className="w-full h-2 bg-brand-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${percentuale}%`, backgroundColor: '#2b7268' }}
          />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
          {columns.map(col => (
            <div key={col.stato} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col.dot }} />
              <span className="text-xs text-brand-500">{col.label}</span>
              <span className="text-xs font-semibold text-brand-800">{grouped[col.stato].length}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input
            type="text"
            placeholder="Cerca farmacia..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 py-2 text-sm"
          />
        </div>
        {showFilters && (
          <>
            <select
              value={filterMerchandiser}
              onChange={e => setFilterMerchandiser(e.target.value)}
              className="input py-2 text-sm w-auto min-w-[160px]"
            >
              <option value="">Tutti i merchandiser</option>
              {merchandisers.map(m => (
                <option key={m.id} value={m.id}>{m.nome} {m.cognome}</option>
              ))}
            </select>
            <select
              value={filterProvincia}
              onChange={e => setFilterProvincia(e.target.value)}
              className="input py-2 text-sm w-auto min-w-[140px]"
            >
              <option value="">Tutte le province</option>
              {province.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {columns.map(col => (
          <div key={col.stato} className={`rounded-lg border ${col.border} ${col.bg} min-h-[200px] flex flex-col`}>
            {/* Column header */}
            <div className={`px-3 py-2.5 border-b ${col.border} ${col.headerBg} rounded-t-lg flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.dot }} />
                <span className="text-[13px] font-semibold text-brand-800">{col.label}</span>
              </div>
              <span className="text-xs font-bold text-brand-500 bg-white/60 px-2 py-0.5 rounded-full">
                {grouped[col.stato].length}
              </span>
            </div>

            {/* Cards container */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-380px)]">
              {grouped[col.stato].length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package size={24} className="text-brand-300 mb-2" />
                  <p className="text-xs text-brand-400">Nessuna farmacia</p>
                </div>
              ) : (
                grouped[col.stato].map(f => {
                  const ass = assegnazioni.find(a => a.farmaciaId === f.id)
                  const merch = ass ? users.find(u => u.id === ass.merchandiserId) : null
                  const fasiComplete = rilievi.filter(r => r.farmaciaId === f.id && r.completata).length

                  return (
                    <button
                      key={f.id}
                      onClick={() => onFarmaciaClick?.(f)}
                      className="w-full bg-white rounded-md border border-brand-100 p-3 text-left hover:border-brand-300 hover:shadow-card transition-all duration-150"
                    >
                      <p className="text-[13px] font-medium text-brand-900 truncate">{f.nome}</p>
                      <p className="text-[11px] text-brand-400 flex items-center gap-1 mt-1">
                        <MapPin size={10} className="shrink-0" />
                        <span className="truncate">{f.citta} ({f.provincia})</span>
                      </p>
                      {showMerchandiserName && merch && (
                        <p className="text-[11px] text-accent-600 flex items-center gap-1 mt-1">
                          <Users size={10} className="shrink-0" />
                          {merch.nome} {merch.cognome}
                        </p>
                      )}
                      {/* Phase indicators */}
                      <div className="flex items-center gap-1.5 mt-2">
                        {([1, 2, 3] as FaseNumero[]).map(fase => {
                          const done = rilievi.some(r => r.farmaciaId === f.id && r.fase === fase && r.completata)
                          return (
                            <span
                              key={fase}
                              className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                                done
                                  ? 'bg-status-done-500 text-white'
                                  : 'bg-brand-100 text-brand-400'
                              }`}
                            >
                              {fase}
                            </span>
                          )
                        })}
                        <span className="text-[11px] text-brand-500 ml-auto font-medium">{fasiComplete}/3</span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
