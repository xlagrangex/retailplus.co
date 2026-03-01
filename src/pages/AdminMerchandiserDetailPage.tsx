import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useToast } from '../components/Toast'
import KanbanBoard from '../components/KanbanBoard'
import MessageThread from '../components/MessageThread'
import { getStatoFarmacia, getLabelStato, getFaseCorrente, StatoFarmacia } from '../types'
import {
  ArrowLeft, Mail, Phone, Trash2, Plus, Search, MapPin, X, Unlink,
} from 'lucide-react'

const statoColorsLocal: Record<StatoFarmacia, { bg: string; text: string; border: string; dot: string }> = {
  da_fare: { bg: 'bg-status-todo-50', text: 'text-status-todo-600', border: 'border-status-todo-100', dot: '#8da4b8' },
  in_corso: { bg: 'bg-status-progress-50', text: 'text-status-progress-600', border: 'border-status-progress-100', dot: '#5d8a82' },
  completata: { bg: 'bg-status-done-50', text: 'text-status-done-600', border: 'border-status-done-100', dot: '#2b7268' },
  in_attesa: { bg: 'bg-status-waiting-50', text: 'text-status-waiting-600', border: 'border-status-waiting-100', dot: '#4a6fa5' },
}

export default function AdminMerchandiserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { users, farmacie, rilievi, assegnazioni, removeUser, assignFarmacia, unassignFarmacia } = useData()
  const { showToast } = useToast()
  const [selectedFarmaciaForChat, setSelectedFarmaciaForChat] = useState<string | null>(null)
  const [showAddFarmacie, setShowAddFarmacie] = useState(false)
  const [farmaciaSearch, setFarmaciaSearch] = useState('')

  const merchandiser = users.find(u => u.id === id)

  const assigned = useMemo(() => assegnazioni.filter(a => a.merchandiserId === id), [assegnazioni, id])
  const assignedFarmacie = useMemo(() => farmacie.filter(f => assigned.some(a => a.farmaciaId === f.id)), [farmacie, assigned])
  const completate = useMemo(() => assignedFarmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'completata').length, [assignedFarmacie, rilievi])
  const pct = assignedFarmacie.length > 0 ? Math.round((completate / assignedFarmacie.length) * 100) : 0

  const assignedIds = useMemo(() => new Set(assegnazioni.map(a => a.farmaciaId)), [assegnazioni])
  const unassignedFarmacie = useMemo(() => farmacie.filter(f => !assignedIds.has(f.id)), [farmacie, assignedIds])
  const filteredUnassigned = unassignedFarmacie.filter(f =>
    (f.nome + f.citta + f.provincia).toLowerCase().includes(farmaciaSearch.toLowerCase())
  )

  if (!merchandiser) {
    return (
      <div className="text-center py-16">
        <p className="text-brand-500">Merchandiser non trovata</p>
        <button onClick={() => navigate('/admin/merchandiser')} className="btn-secondary mt-4">
          <ArrowLeft size={14} /> Torna alla lista
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/merchandiser')} className="p-1.5 rounded-md hover:bg-brand-100 transition-colors">
          <ArrowLeft size={18} className="text-brand-500" />
        </button>
        <div className="w-11 h-11 rounded-lg bg-brand-100 flex items-center justify-center">
          <span className="text-sm font-bold text-brand-600">{merchandiser.nome[0]}{merchandiser.cognome[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-heading font-bold text-brand-900 truncate">{merchandiser.nome} {merchandiser.cognome}</h1>
          <div className="flex items-center gap-3 text-xs text-brand-400">
            <span className="flex items-center gap-1"><Mail size={11} /> {merchandiser.email}</span>
            {merchandiser.telefono && <span className="flex items-center gap-1"><Phone size={11} /> {merchandiser.telefono}</span>}
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm(`Eliminare ${merchandiser.nome} ${merchandiser.cognome}?`)) {
              removeUser(merchandiser.id)
              navigate('/admin/merchandiser')
            }
          }}
          className="btn-ghost text-xs text-brand-500 hover:text-red-600"
        >
          <Trash2 size={14} /> Elimina
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-3 text-center">
          <p className="text-xl font-heading font-bold text-brand-900">{assignedFarmacie.length}</p>
          <p className="text-[10px] text-brand-400">Farmacie</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-heading font-bold text-status-done-500">{completate}</p>
          <p className="text-[10px] text-brand-400">Completate</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-heading font-bold text-status-progress-500">
            {assignedFarmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'in_corso').length}
          </p>
          <p className="text-[10px] text-brand-400">In corso</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-heading font-bold text-brand-900">{pct}%</p>
          <p className="text-[10px] text-brand-400">Progresso</p>
        </div>
      </div>
      {assignedFarmacie.length > 0 && (
        <div className="w-full bg-brand-100 rounded-full h-2">
          <div className="h-2 rounded-full bg-accent-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Kanban */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-sm font-heading font-bold text-brand-700">Pipeline farmacie</h2>
          <KanbanBoard
            farmacie={assignedFarmacie}
            rilievi={rilievi}
            assegnazioni={assegnazioni}
            users={users}
            onFarmaciaClick={f => setSelectedFarmaciaForChat(f.id)}
          />
        </div>

        {/* Right: Chat */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-heading font-bold text-brand-700 mb-2">Comunicazioni</h2>
          <div className="card overflow-hidden">
            <MessageThread
              merchandiserId={merchandiser.id}
              maxHeight="calc(100vh - 380px)"
              compact
              selectedFarmaciaId={selectedFarmaciaForChat}
              onClearFarmaciaFilter={() => setSelectedFarmaciaForChat(null)}
              farmacie={assignedFarmacie}
            />
          </div>
        </div>
      </div>

      {/* Assegnazione farmacie */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-heading font-bold text-brand-700">
            Farmacie assegnate ({assignedFarmacie.length})
          </h2>
          <button
            onClick={() => setShowAddFarmacie(!showAddFarmacie)}
            className="flex items-center gap-1 text-[11px] font-medium text-accent-600 hover:text-accent-700 transition-colors"
          >
            <Plus size={13} /> Assegna farmacie
          </button>
        </div>

        {/* Add farmacie dropdown */}
        {showAddFarmacie && (
          <div className="border border-brand-200 rounded-md overflow-hidden">
            <div className="p-2 border-b border-brand-100">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-400" />
                <input
                  type="text"
                  placeholder="Cerca farmacia non assegnata..."
                  value={farmaciaSearch}
                  onChange={e => setFarmaciaSearch(e.target.value)}
                  className="input pl-8 py-1.5 text-xs"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredUnassigned.length > 0 ? (
                filteredUnassigned.slice(0, 20).map(f => (
                  <button
                    key={f.id}
                    onClick={() => {
                      assignFarmacia(f.id, merchandiser.id)
                      showToast(`${f.nome} assegnata a ${merchandiser.nome} ${merchandiser.cognome}`)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-brand-50 transition-colors"
                  >
                    <MapPin size={12} className="text-brand-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-brand-800 truncate">{f.nome}</p>
                      <p className="text-[10px] text-brand-400">{f.citta} ({f.provincia})</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-xs text-brand-400 italic text-center py-3">Nessuna farmacia disponibile</p>
              )}
            </div>
          </div>
        )}

        {assignedFarmacie.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {assignedFarmacie.map(f => {
              const stato = getStatoFarmacia(rilievi, f.id)
              const sc = statoColorsLocal[stato]
              const faseCorrente = getFaseCorrente(rilievi, f.id)

              return (
                <div key={f.id} className="rounded-md border border-brand-100 p-3 hover:bg-brand-50/50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-medium text-brand-900 flex-1 truncate">{f.nome}</p>
                    <span className={`badge text-[10px] py-0 px-1.5 ${sc.bg} ${sc.text} border ${sc.border}`}>
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: sc.dot }} />
                      {getLabelStato(stato)}
                    </span>
                    <button
                      onClick={() => {
                        unassignFarmacia(f.id)
                        showToast(`Assegnazione rimossa: ${f.nome}`)
                      }}
                      className="text-brand-300 hover:text-brand-600 transition-colors p-0.5"
                      title="Rimuovi assegnazione"
                    >
                      <Unlink size={12} />
                    </button>
                  </div>
                  <p className="text-[11px] text-brand-400">{f.citta} ({f.provincia})</p>
                  <p className="text-[10px] text-brand-400 mt-1">
                    Fase corrente: <span className="font-medium text-brand-600">{faseCorrente}/3</span>
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-brand-400 italic">Nessuna farmacia assegnata</p>
          </div>
        )}
      </div>
    </div>
  )
}
