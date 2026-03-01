import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useToast } from '../components/Toast'
import KanbanBoard from '../components/KanbanBoard'
import MessageThread from '../components/MessageThread'
import {
  Farmacia, Rilievo, FaseNumero,
  getStatoFarmacia, getLabelStato, getLabelFase, getFaseCorrente, StatoFarmacia,
} from '../types'
import {
  ArrowLeft, Mail, Phone, Trash2, Plus, Search, MapPin, X, Unlink,
  LayoutList, Columns, MessageSquare, ChevronDown, ChevronUp, CheckCircle2,
  AlertTriangle, Ruler, Wrench, Package, Navigation, Image as ImageIcon,
} from 'lucide-react'

const statoColors: Record<StatoFarmacia, { bg: string; text: string; border: string; dot: string }> = {
  da_fare: { bg: 'bg-status-todo-50', text: 'text-status-todo-600', border: 'border-status-todo-100', dot: '#8da4b8' },
  in_corso: { bg: 'bg-status-progress-50', text: 'text-status-progress-600', border: 'border-status-progress-100', dot: '#5d8a82' },
  completata: { bg: 'bg-status-done-50', text: 'text-status-done-600', border: 'border-status-done-100', dot: '#2b7268' },
  in_attesa: { bg: 'bg-status-waiting-50', text: 'text-status-waiting-600', border: 'border-status-waiting-100', dot: '#4a6fa5' },
}

export default function AdminMerchandiserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { users, farmacie, rilievi, assegnazioni, campiConfigurazione, removeUser, assignFarmacia, unassignFarmacia } = useData()
  const { showToast } = useToast()
  const [selectedFarmaciaForChat, setSelectedFarmaciaForChat] = useState<string | null>(null)
  const [detailFarmaciaId, setDetailFarmaciaId] = useState<string | null>(null)
  const [showAddFarmacie, setShowAddFarmacie] = useState(false)
  const [farmaciaSearch, setFarmaciaSearch] = useState('')
  const [pipelineView, setPipelineView] = useState<'kanban' | 'table'>('table')
  const [showChat, setShowChat] = useState(true)

  const merchandiser = users.find(u => u.id === id)

  const assigned = useMemo(() => assegnazioni.filter(a => a.merchandiserId === id), [assegnazioni, id])
  const assignedFarmacie = useMemo(() => farmacie.filter(f => assigned.some(a => a.farmaciaId === f.id)), [farmacie, assigned])
  const completate = useMemo(() => assignedFarmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'completata').length, [assignedFarmacie, rilievi])
  const inCorso = useMemo(() => assignedFarmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'in_corso').length, [assignedFarmacie, rilievi])
  const inAttesa = useMemo(() => assignedFarmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'in_attesa').length, [assignedFarmacie, rilievi])
  const daFare = useMemo(() => assignedFarmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'da_fare').length, [assignedFarmacie, rilievi])
  const pct = assignedFarmacie.length > 0 ? Math.round((completate / assignedFarmacie.length) * 100) : 0

  const assignedIds = useMemo(() => new Set(assegnazioni.map(a => a.farmaciaId)), [assegnazioni])
  const unassignedFarmacie = useMemo(() => farmacie.filter(f => !assignedIds.has(f.id)), [farmacie, assignedIds])
  const filteredUnassigned = unassignedFarmacie.filter(f =>
    (f.nome + f.citta + f.provincia).toLowerCase().includes(farmaciaSearch.toLowerCase())
  )

  const detailFarmacia = detailFarmaciaId ? farmacie.find(f => f.id === detailFarmaciaId) : null

  function handleFarmaciaClick(f: Farmacia) {
    setDetailFarmaciaId(f.id)
    setSelectedFarmaciaForChat(f.id)
  }

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
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/merchandiser')} className="p-2 rounded-lg hover:bg-brand-100 transition-colors">
          <ArrowLeft size={20} className="text-brand-500" />
        </button>
        <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
          <span className="text-base font-bold text-brand-600">{merchandiser.nome[0]}{merchandiser.cognome[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-heading font-bold text-brand-900 truncate">{merchandiser.nome} {merchandiser.cognome}</h1>
          <div className="flex items-center gap-4 text-sm text-brand-400 mt-0.5">
            <a href={`mailto:${merchandiser.email}`} className="flex items-center gap-1.5 hover:text-accent-600 transition-colors">
              <Mail size={13} /> {merchandiser.email}
            </a>
            {merchandiser.telefono && (
              <a href={`tel:${merchandiser.telefono}`} className="flex items-center gap-1.5 hover:text-accent-600 transition-colors">
                <Phone size={13} /> {merchandiser.telefono}
              </a>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm(`Eliminare ${merchandiser.nome} ${merchandiser.cognome}?`)) {
              removeUser(merchandiser.id)
              navigate('/admin/merchandiser')
            }
          }}
          className="btn-ghost text-sm text-brand-500 hover:text-red-600"
        >
          <Trash2 size={15} /> Elimina
        </button>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-5 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-heading font-bold text-brand-900">{assignedFarmacie.length}</p>
          <p className="text-xs text-brand-500 mt-1">Farmacie</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-heading font-bold" style={{ color: '#8da4b8' }}>{daFare}</p>
          <p className="text-xs text-brand-500 mt-1">Da fare</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-heading font-bold" style={{ color: '#5d8a82' }}>{inCorso}</p>
          <p className="text-xs text-brand-500 mt-1">In corso</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-heading font-bold" style={{ color: '#2b7268' }}>{completate}</p>
          <p className="text-xs text-brand-500 mt-1">Completate</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-heading font-bold text-accent-600">{pct}%</p>
          <p className="text-xs text-brand-500 mt-1">Progresso</p>
        </div>
      </div>

      {/* Progress bar */}
      {assignedFarmacie.length > 0 && (
        <div className="w-full bg-brand-100 rounded-full h-2.5">
          <div className="h-2.5 rounded-full bg-accent-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      )}

      {/* ── Pipeline section (full width) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-heading font-bold text-brand-800">Pipeline farmacie</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-brand-50 rounded-lg p-0.5">
              <button
                onClick={() => setPipelineView('table')}
                className={`p-2 rounded-md transition-colors ${pipelineView === 'table' ? 'bg-white shadow-sm text-brand-800' : 'text-brand-400 hover:text-brand-600'}`}
                title="Vista tabella"
              >
                <LayoutList size={16} />
              </button>
              <button
                onClick={() => setPipelineView('kanban')}
                className={`p-2 rounded-md transition-colors ${pipelineView === 'kanban' ? 'bg-white shadow-sm text-brand-800' : 'text-brand-400 hover:text-brand-600'}`}
                title="Vista kanban"
              >
                <Columns size={16} />
              </button>
            </div>
          </div>
        </div>

        {pipelineView === 'kanban' ? (
          <KanbanBoard
            farmacie={assignedFarmacie}
            rilievi={rilievi}
            assegnazioni={assegnazioni}
            users={users}
            onFarmaciaClick={handleFarmaciaClick}
          />
        ) : (
          /* ── TABLE VIEW ── */
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-100 bg-brand-50/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Farmacia</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Localita</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Fase 1<br /><span className="normal-case font-normal text-[10px]">Misure</span></th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Fase 2<br /><span className="normal-case font-normal text-[10px]">Plexiglass</span></th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Fase 3<br /><span className="normal-case font-normal text-[10px]">Prodotti</span></th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Stato</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {assignedFarmacie.map(f => {
                    const stato = getStatoFarmacia(rilievi, f.id)
                    const sc = statoColors[stato]
                    const isSelected = detailFarmaciaId === f.id

                    return (
                      <tr
                        key={f.id}
                        onClick={() => handleFarmaciaClick(f)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-accent-50/60' : 'hover:bg-brand-50/60'
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-medium text-brand-900">{f.nome}</p>
                          {f.codiceCliente && <p className="text-[11px] text-brand-400 font-mono mt-0.5">#{f.codiceCliente}</p>}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm text-brand-600">{f.citta}</p>
                          <p className="text-[11px] text-brand-400">{f.provincia}</p>
                        </td>
                        {([1, 2, 3] as FaseNumero[]).map(fase => {
                          const done = rilievi.some(r => r.farmaciaId === f.id && r.fase === fase && r.completata)
                          const inProgress = !done && getFaseCorrente(rilievi, f.id) === fase && stato !== 'da_fare'
                          return (
                            <td key={fase} className="px-3 py-3.5 text-center">
                              {done ? (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-status-done-500 text-white">
                                  <CheckCircle2 size={16} />
                                </span>
                              ) : inProgress ? (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-status-progress-100 text-status-progress-600 border-2 border-status-progress-300 font-bold text-xs animate-pulse">
                                  {fase}
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-100 text-brand-400 font-medium text-xs">
                                  {fase}
                                </span>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-4 py-3.5 text-center">
                          <span className={`badge ${sc.bg} ${sc.text} border ${sc.border}`}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.dot }} />
                            {getLabelStato(stato)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              unassignFarmacia(f.id)
                              showToast(`Assegnazione rimossa: ${f.nome}`)
                            }}
                            className="text-brand-300 hover:text-brand-600 transition-colors p-1"
                            title="Rimuovi assegnazione"
                          >
                            <Unlink size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {assignedFarmacie.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-brand-400">Nessuna farmacia assegnata</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Farmacia Detail Modal ── */}
      {detailFarmacia && (
        <FarmaciaRilievoModal
          farmacia={detailFarmacia}
          rilievi={rilievi}
          campiConfigurazione={campiConfigurazione}
          onClose={() => setDetailFarmaciaId(null)}
        />
      )}

      {/* ── Chat section (collapsible) ── */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setShowChat(!showChat)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-white hover:bg-brand-50/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <MessageSquare size={16} className="text-accent-600" />
            <h2 className="text-sm font-heading font-bold text-brand-800">Comunicazioni</h2>
            {selectedFarmaciaForChat && (
              <span className="text-xs text-accent-600 bg-accent-50 px-2 py-0.5 rounded-full">
                Filtro attivo
              </span>
            )}
          </div>
          {showChat ? <ChevronUp size={16} className="text-brand-400" /> : <ChevronDown size={16} className="text-brand-400" />}
        </button>
        {showChat && (
          <div className="border-t border-brand-100">
            <MessageThread
              merchandiserId={merchandiser.id}
              maxHeight="350px"
              selectedFarmaciaId={selectedFarmaciaForChat}
              onClearFarmaciaFilter={() => setSelectedFarmaciaForChat(null)}
              farmacie={assignedFarmacie}
            />
          </div>
        )}
      </div>

      {/* ── Assegnazione farmacie ── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-heading font-bold text-brand-700">
            Assegna nuove farmacie
          </h2>
          <button
            onClick={() => setShowAddFarmacie(!showAddFarmacie)}
            className="flex items-center gap-1.5 text-xs font-medium text-accent-600 hover:text-accent-700 transition-colors"
          >
            {showAddFarmacie ? <X size={14} /> : <Plus size={14} />}
            {showAddFarmacie ? 'Chiudi' : 'Assegna farmacie'}
          </button>
        </div>

        {showAddFarmacie && (
          <div className="border border-brand-200 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-brand-100 bg-brand-50/30">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                <input
                  type="text"
                  placeholder="Cerca farmacia non assegnata..."
                  value={farmaciaSearch}
                  onChange={e => setFarmaciaSearch(e.target.value)}
                  className="input pl-9 text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-brand-50">
              {filteredUnassigned.length > 0 ? (
                filteredUnassigned.slice(0, 30).map(f => (
                  <button
                    key={f.id}
                    onClick={() => {
                      assignFarmacia(f.id, merchandiser.id)
                      showToast(`${f.nome} assegnata a ${merchandiser.nome} ${merchandiser.cognome}`)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-brand-50 transition-colors"
                  >
                    <MapPin size={14} className="text-brand-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand-800 truncate">{f.nome}</p>
                      <p className="text-xs text-brand-400">{f.citta} ({f.provincia})</p>
                    </div>
                    <Plus size={14} className="text-accent-500 shrink-0" />
                  </button>
                ))
              ) : (
                <p className="text-sm text-brand-400 italic text-center py-6">Nessuna farmacia disponibile</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// FARMACIA RILIEVO MODAL — shows all step data for admin review
// ============================================================

function FarmaciaRilievoModal({
  farmacia, rilievi, campiConfigurazione, onClose,
}: {
  farmacia: Farmacia
  rilievi: Rilievo[]
  campiConfigurazione: { id: string; fase: FaseNumero; nome: string; label: string; tipo: string; unita?: string; attivo: boolean; ordine: number }[]
  onClose: () => void
}) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const stato = getStatoFarmacia(rilievi, farmacia.id)
  const sc = statoColors[stato]
  const faseIcons = { 1: Ruler, 2: Wrench, 3: Package }

  const getRilievoFase = (fase: FaseNumero) =>
    rilievi.find(r => r.farmaciaId === farmacia.id && r.fase === fase)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white shadow-2xl rounded-xl overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-brand-100 px-6 py-4 z-10 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-heading font-bold text-brand-900 truncate">{farmacia.nome}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-brand-400">
                <span className="flex items-center gap-1"><MapPin size={13} /> {farmacia.indirizzo}, {farmacia.citta} ({farmacia.provincia})</span>
                {farmacia.codiceCliente && <span className="font-mono">#{farmacia.codiceCliente}</span>}
              </div>
            </div>
            <span className={`badge ${sc.bg} ${sc.text} border ${sc.border}`}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.dot }} />
              {getLabelStato(stato)}
            </span>
            <button onClick={onClose} className="text-brand-400 hover:text-brand-700 transition-colors p-1.5">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Quick info row */}
          <div className="flex flex-wrap gap-3">
            {farmacia.telefono && (
              <a href={`tel:${farmacia.telefono}`} className="btn-secondary text-xs py-2">
                <Phone size={13} /> {farmacia.telefono}
              </a>
            )}
            {farmacia.referente && (
              <span className="badge bg-brand-50 text-brand-600 border border-brand-100 py-1.5 text-xs">
                Ref: {farmacia.referente}
              </span>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${farmacia.lat},${farmacia.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-2"
            >
              <Navigation size={13} /> Indicazioni
            </a>
          </div>

          {/* Progress stepper */}
          <div className="card p-4">
            <div className="flex items-center gap-0">
              {([1, 2, 3] as FaseNumero[]).map((fase, i) => {
                const done = getRilievoFase(fase)?.completata
                return (
                  <div key={fase} className="flex-1 flex items-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                      done ? 'bg-status-done-500 text-white' : 'bg-brand-100 text-brand-400'
                    }`}>
                      {done ? <CheckCircle2 size={18} /> : fase}
                    </div>
                    {i < 2 && (
                      <div className={`flex-1 h-0.5 mx-3 rounded ${
                        done ? 'bg-status-done-300' : 'bg-brand-100'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── 3 Fasi details ── */}
          {([1, 2, 3] as FaseNumero[]).map(fase => {
            const rilievo = getRilievoFase(fase)
            const done = rilievo?.completata
            const FaseIcon = faseIcons[fase]

            return (
              <div
                key={fase}
                className={`card overflow-hidden ${done ? 'border-status-done-100' : 'border-brand-100'}`}
              >
                {/* Fase header */}
                <div className={`px-5 py-3.5 border-b flex items-center gap-3 ${
                  done ? 'bg-status-done-50/50 border-status-done-100' : 'bg-brand-50/50 border-brand-100'
                }`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    done ? 'bg-status-done-500 text-white' : 'bg-brand-200 text-brand-400'
                  }`}>
                    {done ? <CheckCircle2 size={16} /> : <FaseIcon size={16} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-brand-900">Fase {fase} — {getLabelFase(fase)}</p>
                    {done && rilievo && (
                      <p className="text-xs text-status-done-600">
                        Completata il {rilievo.dataCompletamento}{rilievo.oraCompletamento ? ` alle ${rilievo.oraCompletamento}` : ''}
                      </p>
                    )}
                  </div>
                  {!done && (
                    <span className="text-xs text-brand-400 italic">Non completata</span>
                  )}
                </div>

                {/* Fase body — only show if rilievo exists */}
                {done && rilievo && (
                  <div className="px-5 py-4 space-y-4">
                    {/* Fase 1: Misure */}
                    {fase === 1 && (
                      <FaseMisureDisplay rilievo={rilievo} campiConfigurazione={campiConfigurazione} />
                    )}

                    {/* Fase 2: Montaggio */}
                    {fase === 2 && (
                      <div className="space-y-2">
                        <CheckItem checked={rilievo.kitRicevuto} label="Kit materiale ricevuto" />
                        <CheckItem checked={rilievo.pezziRicevuti} label="Pezzi di plexiglass ricevuti" />
                        <CheckItem checked={rilievo.scaricamentoCompleto} label="Scaricamento/svuotamento scaffale completato" />
                        <CheckItem checked={rilievo.montaggioCompleto} label="Montaggio materiale completato" />
                        {rilievo.problemaKit && (
                          <div className="bg-status-waiting-50 border border-status-waiting-100 rounded-lg p-3 mt-2">
                            <p className="text-xs font-semibold text-status-waiting-700 flex items-center gap-1.5">
                              <AlertTriangle size={13} /> Problema segnalato
                            </p>
                            {rilievo.descrizioneProblema && (
                              <p className="text-sm text-brand-700 mt-1">{rilievo.descrizioneProblema}</p>
                            )}
                            {rilievo.fotoProblema && rilievo.fotoProblema.length > 0 && (
                              <div className="flex gap-2 mt-2 overflow-x-auto">
                                {rilievo.fotoProblema.map((url, i) => (
                                  <img
                                    key={i}
                                    src={url}
                                    alt="Problema"
                                    className="w-20 h-20 object-cover rounded-md border border-brand-200 cursor-pointer hover:opacity-80 shrink-0"
                                    onClick={() => setZoomedImage(url)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fase 3: Prodotti */}
                    {fase === 3 && (
                      <CheckItem checked={rilievo.prodottiPosizionati} label="Prodotti posizionati sugli scaffali" />
                    )}

                    {/* Dynamic fields from valoriDinamici */}
                    {rilievo.valoriDinamici && Object.keys(rilievo.valoriDinamici).length > 0 && fase !== 1 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(rilievo.valoriDinamici).map(([key, val]) => (
                          <div key={key} className="bg-brand-50 rounded-lg px-3 py-2.5 border border-brand-100">
                            <p className="text-[10px] text-brand-400 uppercase tracking-wider">{key}</p>
                            <p className="text-sm font-medium text-brand-800">{String(val)}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Note */}
                    {rilievo.note && (
                      <div className="bg-brand-50 rounded-lg p-3 border border-brand-100">
                        <p className="text-[10px] text-brand-400 uppercase tracking-wider mb-1">Note</p>
                        <p className="text-sm text-brand-700">{rilievo.note}</p>
                      </div>
                    )}

                    {/* Foto */}
                    {rilievo.foto?.length > 0 && (
                      <div>
                        <p className="text-xs text-brand-500 font-medium mb-2 flex items-center gap-1.5">
                          <ImageIcon size={13} /> {rilievo.foto.length} foto
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {rilievo.foto.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Fase ${fase} - foto ${i + 1}`}
                              className="w-24 h-24 object-cover rounded-lg border border-brand-200 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                              onClick={() => setZoomedImage(url)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Image zoom overlay */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setZoomedImage(null)}>
          <img src={zoomedImage} alt="Zoom" className="max-w-full max-h-full object-contain rounded-lg" />
          <button className="absolute top-4 right-4 text-white/80 hover:text-white p-2" onClick={() => setZoomedImage(null)}>
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Helper: Misure display for Fase 1 ──

function FaseMisureDisplay({
  rilievo, campiConfigurazione,
}: {
  rilievo: Rilievo
  campiConfigurazione: { id: string; fase: FaseNumero; nome: string; label: string; tipo: string; unita?: string; attivo: boolean; ordine: number }[]
}) {
  const campiFase1 = campiConfigurazione.filter(c => c.fase === 1 && c.attivo).sort((a, b) => a.ordine - b.ordine)

  if (campiFase1.length > 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {campiFase1.map(campo => {
          const val = rilievo.valoriDinamici?.[campo.nome] ?? (rilievo as any)?.[campo.nome]
          if (campo.tipo === 'checkbox') {
            return <MisuraChip key={campo.id} label={campo.label} value={val ? 'Si' : 'No'} />
          }
          return <MisuraChip key={campo.id} label={campo.label} value={val != null ? `${val}${campo.unita ? ` ${campo.unita}` : ''}` : undefined} />
        })}
      </div>
    )
  }

  // Fallback to hardcoded fields
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <MisuraChip label="Prof. scaffale" value={rilievo.profonditaScaffale != null ? `${rilievo.profonditaScaffale} cm` : undefined} />
      <MisuraChip label="Prof. mensola" value={rilievo.profonditaMensola != null ? `${rilievo.profonditaMensola} cm` : undefined} />
      <MisuraChip label="Larghezza" value={rilievo.larghezza != null ? `${rilievo.larghezza} cm` : undefined} />
      <MisuraChip label="Altezza" value={rilievo.altezza != null ? `${rilievo.altezza} cm` : undefined} />
      <MisuraChip label="N. scaffali" value={rilievo.numScaffali != null ? String(rilievo.numScaffali) : undefined} />
    </div>
  )
}

function MisuraChip({ label, value }: { label: string; value?: string }) {
  return (
    <div className="bg-brand-50 rounded-lg px-3 py-2.5 border border-brand-100">
      <p className="text-[10px] text-brand-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-brand-800">{value ?? '—'}</p>
    </div>
  )
}

function CheckItem({ checked, label }: { checked?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      {checked
        ? <CheckCircle2 size={16} className="text-status-done-500 shrink-0" />
        : <AlertTriangle size={16} className="text-status-waiting-500 shrink-0" />
      }
      <span className={`text-sm ${checked ? 'text-brand-700' : 'text-status-waiting-600'}`}>{label}</span>
    </div>
  )
}
