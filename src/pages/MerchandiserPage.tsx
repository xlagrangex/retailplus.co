import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../components/Toast'
import OnboardingModal, { useOnboardingTrigger } from '../components/OnboardingModal'
import { isSupabaseConfigured } from '../lib/supabase'
import { uploadPhoto } from '../lib/supabase'
import {
  Farmacia, Rilievo, FaseNumero, StatoFarmacia, RilievoEvento, Sopralluogo, EsitoSopralluogo,
  getStatoFarmacia, getColoreStato,
  getLabelStato, getLabelFase, getDescrizioneFase, getFaseCorrente,
} from '../types'
import {
  ArrowLeft, Camera, Check, ChevronRight, Lock, MapPin, Phone, Mail,
  Ruler, X, AlertTriangle, CheckCircle2, Info, ImagePlus, Package, Wrench,
  FileText, Send, Download, LayoutList, Columns, Navigation,
  Clock, ChevronDown, ChevronUp, MessageSquare,
} from 'lucide-react'
import KanbanBoard from '../components/KanbanBoard'
import MessageThread from '../components/MessageThread'
import Timeline from '../components/Timeline'

// Colori corporate per stati
const statoConfig: Record<StatoFarmacia, { dot: string; bg: string; text: string; border: string }> = {
  assegnato: { dot: '#8da4b8', bg: 'bg-status-todo-50', text: 'text-status-todo-600', border: 'border-status-todo-100' },
  fase_1: { dot: '#4a6fa5', bg: 'bg-status-waiting-50', text: 'text-status-waiting-600', border: 'border-status-waiting-100' },
  fase_2: { dot: '#3d8b8b', bg: 'bg-status-progress-50', text: 'text-status-progress-600', border: 'border-status-progress-100' },
  fase_3: { dot: '#c08c3e', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
  completato: { dot: '#2b7268', bg: 'bg-status-done-50', text: 'text-status-done-600', border: 'border-status-done-100' },
}

export default function MerchandiserPage() {
  const { user } = useAuth()
  const { farmacie, assegnazioni, rilievi, users, sopralluoghi } = useData()
  const [selectedFarmacia, setSelectedFarmacia] = useState<Farmacia | null>(null)
  const [showReport, setShowReport] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban')
  const [showOnboarding, setShowOnboarding] = useOnboardingTrigger(user?.id)
  const [selectedFarmaciaForChat, setSelectedFarmaciaForChat] = useState<string | null>(null)

  if (!user) return null

  const mieAssegnazioni = assegnazioni.filter(a => a.merchandiserId === user.id)
  const mieFarmacie = farmacie.filter(f => mieAssegnazioni.some(a => a.farmaciaId === f.id))

  const ordineStato: Record<StatoFarmacia, number> = { assegnato: 0, fase_1: 1, fase_2: 2, fase_3: 3, completato: 4 }
  const farmacieSorted = [...mieFarmacie].sort((a, b) => {
    const sa = getStatoFarmacia(rilievi, a.id, sopralluoghi)
    const sb = getStatoFarmacia(rilievi, b.id, sopralluoghi)
    return ordineStato[sa] - ordineStato[sb]
  })

  // Report generation (Task 12)
  if (showReport) {
    return (
      <ReportView
        user={user}
        farmacie={mieFarmacie}
        rilievi={rilievi}
        onBack={() => setShowReport(false)}
      />
    )
  }

  if (selectedFarmacia) {
    return <FarmaciaDetail farmacia={selectedFarmacia} onBack={() => setSelectedFarmacia(null)} assignedFarmacie={mieFarmacie} />
  }

  return (
    <div className="space-y-5 mx-auto max-w-7xl">
      {showOnboarding && (
        <OnboardingModal userId={user.id} ruolo="merchandiser" onClose={() => setShowOnboarding(false)} />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Ciao, {user.nome}</h1>
          <p className="page-subtitle">{mieFarmacie.length} farmacie assegnate</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-brand-50 rounded-md p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-800' : 'text-brand-400 hover:text-brand-600'}`}
              title="Vista lista"
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-brand-800' : 'text-brand-400 hover:text-brand-600'}`}
              title="Vista kanban"
            >
              <Columns size={16} />
            </button>
          </div>
          <button onClick={() => setShowReport(true)} className="btn-secondary text-xs">
            <FileText size={14} /> Report
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left: Kanban */}
          <div className="lg:col-span-3">
            <KanbanBoard
              farmacie={mieFarmacie}
              rilievi={rilievi}
              assegnazioni={assegnazioni}
              users={users}
              sopralluoghi={sopralluoghi}
              onFarmaciaClick={f => {
                setSelectedFarmacia(f)
              }}
            />
          </div>

          {/* Right: Chat */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-heading font-bold text-brand-700 mb-2">Chat con Admin</h2>
            <div className="card overflow-hidden">
              <MessageThread
                merchandiserId={user.id}
                maxHeight="calc(100vh - 280px)"
                selectedFarmaciaId={selectedFarmaciaForChat}
                onClearFarmaciaFilter={() => setSelectedFarmaciaForChat(null)}
                farmacie={mieFarmacie}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 space-y-4">
              <div className="grid grid-cols-5 gap-3">
                {(['assegnato', 'fase_1', 'fase_2', 'fase_3', 'completato'] as StatoFarmacia[]).map(stato => {
                  const count = mieFarmacie.filter(f => getStatoFarmacia(rilievi, f.id, sopralluoghi) === stato).length
                  const cfg = statoConfig[stato]
                  return (
                    <div key={stato} className="card p-3 text-center">
                      <span className="inline-block w-2.5 h-2.5 rounded-full mb-1.5" style={{ backgroundColor: cfg.dot }} />
                      <p className="text-xl font-heading font-bold text-brand-900">{count}</p>
                      <p className="text-[11px] text-brand-500">{getLabelStato(stato)}</p>
                    </div>
                  )
                })}
              </div>

              {/* Lista farmacie */}
              <div className="space-y-2">
                {farmacieSorted.map(f => {
                  const stato = getStatoFarmacia(rilievi, f.id, sopralluoghi)
                  const fasiComplete = rilievi.filter(r => r.farmaciaId === f.id && r.completata).length
                  const faseCorrente = getFaseCorrente(rilievi, f.id)
                  const isCompletata = stato === 'completato'
                  const cfg = statoConfig[stato]

                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFarmacia(f)}
                      className={`w-full card-hover p-4 text-left ${isCompletata ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-brand-900 text-[13px] truncate">{f.nome}</p>
                          <p className="text-xs text-brand-400 flex items-center gap-1 mt-0.5">
                            <MapPin size={12} className="shrink-0" />
                            <span className="truncate">{f.indirizzo}, {f.citta}</span>
                          </p>
                          {!isCompletata && (
                            <p className="text-[11px] text-accent-600 font-medium mt-1.5">
                              Prossimo: Fase {faseCorrente} — {getLabelFase(faseCorrente)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className={`badge ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                            {fasiComplete}/3
                          </span>
                          <ChevronRight size={14} className="text-brand-300" />
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="flex gap-1 mt-3">
                        {([1, 2, 3] as FaseNumero[]).map(fase => {
                          const done = rilievi.some(r => r.farmaciaId === f.id && r.fase === fase && r.completata)
                          return (
                            <div key={fase} className="flex-1">
                              <div className={`h-1.5 rounded-full ${done ? 'bg-status-done-500' : 'bg-brand-100'}`} />
                            </div>
                          )
                        })}
                      </div>
                    </button>
                  )
                })}
              </div>

              {mieFarmacie.length === 0 && (
                <div className="text-center py-16">
                  <Package size={40} className="mx-auto mb-3 text-brand-300" />
                  <p className="text-brand-600 font-medium">Nessuna farmacia assegnata</p>
                  <p className="text-sm text-brand-400 mt-1">Contatta l'amministratore per ricevere le assegnazioni</p>
                </div>
              )}
            </div>

            {/* Right: Chat in list mode too */}
            <div className="lg:col-span-2">
              <h2 className="text-sm font-heading font-bold text-brand-700 mb-2">Chat con Admin</h2>
              <div className="card overflow-hidden">
                <MessageThread
                  merchandiserId={user.id}
                  maxHeight="calc(100vh - 280px)"
                  selectedFarmaciaId={selectedFarmaciaForChat}
                  onClearFarmaciaFilter={() => setSelectedFarmaciaForChat(null)}
                  farmacie={mieFarmacie}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================
// DETTAGLIO FARMACIA (Task 5: contatti, Task 10: in_attesa, Task 11: email)
// ============================================================

function FarmaciaDetail({ farmacia, onBack, assignedFarmacie }: { farmacia: Farmacia; onBack: () => void; assignedFarmacie: Farmacia[] }) {
  const { user } = useAuth()
  const { rilievi, saveRilievo, addEvento, fetchEventiForFarmacia, eventi, sopralluoghi, addSopralluogo, sendMessaggio } = useData()
  const [activeFase, setActiveFase] = useState<FaseNumero | null>(null)
  const [showSopralluogoForm, setShowSopralluogoForm] = useState<FaseNumero | null>(null)
  const [farmaciaEventi, setFarmaciaEventi] = useState<RilievoEvento[]>([])
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    fetchEventiForFarmacia(farmacia.id).then(setFarmaciaEventi).catch(console.error)
  }, [farmacia.id, fetchEventiForFarmacia])

  // Keep local events in sync
  useEffect(() => {
    setFarmaciaEventi(eventi.filter(e => e.farmaciaId === farmacia.id))
  }, [eventi, farmacia.id])

  if (!user) return null

  const getRilievoFase = (fase: FaseNumero) =>
    rilievi.find(r => r.farmaciaId === farmacia.id && r.fase === fase)

  const isFaseUnlocked = (fase: FaseNumero): boolean => {
    if (fase === 1) return true
    return !!getRilievoFase((fase - 1) as FaseNumero)?.completata
  }

  const stato = getStatoFarmacia(rilievi, farmacia.id, sopralluoghi)
  const cfg = statoConfig[stato]

  // Email results (Task 11)
  function buildMailtoLink(): string {
    const fasi = [1, 2, 3] as FaseNumero[]
    let body = `Riepilogo allestimento - ${farmacia.nome}\n`
    body += `Indirizzo: ${farmacia.indirizzo}, ${farmacia.citta} (${farmacia.provincia})\n\n`

    fasi.forEach(fase => {
      const r = getRilievoFase(fase)
      body += `--- Fase ${fase}: ${getLabelFase(fase)} ---\n`
      if (r?.completata) {
        body += `Completata il ${r.dataCompletamento} alle ${r.oraCompletamento}\n`
        if (fase === 1) {
          body += `Misure: ${r.profonditaScaffale}x${r.profonditaMensola}x${r.larghezza}x${r.altezza} cm, ${r.numScaffali} scaffali\n`
        }
        if (fase === 2) {
          body += `Pezzi ricevuti: ${r.pezziRicevuti ? 'Si' : 'No'}, Scaricamento: ${r.scaricamentoCompleto ? 'Completo' : 'Incompleto'}, Montaggio: ${r.montaggioCompleto ? 'Completo' : 'Incompleto'}\n`
          if (r.kitRicevuto !== undefined) body += `Kit ricevuto: ${r.kitRicevuto ? 'Si' : 'No'}\n`
        }
        if (fase === 3) {
          body += `Prodotti posizionati: ${r.prodottiPosizionati ? 'Si' : 'No'}\n`
        }
        if (r.note) body += `Note: ${r.note}\n`
        body += `Foto: ${r.foto.length}\n`
      } else {
        body += `Non completata\n`
      }
      body += '\n'
    })

    const subject = encodeURIComponent(`Riepilogo allestimento - ${farmacia.nome}`)
    const encodedBody = encodeURIComponent(body)
    const to = farmacia.email || ''
    return `mailto:${to}?subject=${subject}&body=${encodedBody}`
  }

  if (showSopralluogoForm) {
    return (
      <SopralluogoForm
        farmacia={farmacia}
        fase={showSopralluogoForm}
        userId={user.id}
        sopralluoghi={sopralluoghi.filter(s => s.farmaciaId === farmacia.id && s.fase === showSopralluogoForm)}
        onSuccess={() => {
          setShowSopralluogoForm(null)
          setActiveFase(showSopralluogoForm)
        }}
        onFailed={() => setShowSopralluogoForm(null)}
        onBack={() => setShowSopralluogoForm(null)}
        addSopralluogo={addSopralluogo}
        addEvento={addEvento}
      />
    )
  }

  if (activeFase) {
    return (
      <FaseForm
        farmacia={farmacia}
        fase={activeFase}
        existing={getRilievoFase(activeFase)}
        onBack={() => setActiveFase(null)}
        onSave={async (r) => { await saveRilievo(r); setActiveFase(null) }}
        userId={user.id}
        saveRilievo={saveRilievo}
        addEvento={addEvento}
      />
    )
  }

  const faseIcons = { 1: Ruler, 2: Wrench, 3: Package }

  return (
    <div className="space-y-5">
      {/* ── Header with back button ── */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-brand-100 transition-colors">
          <ArrowLeft size={20} className="text-brand-500" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-heading font-bold text-brand-900 truncate">{farmacia.nome}</h1>
          <div className="flex items-center gap-3 mt-0.5 text-sm text-brand-400">
            <span className="flex items-center gap-1"><MapPin size={13} /> {farmacia.indirizzo}, {farmacia.citta} ({farmacia.provincia})</span>
            {farmacia.codiceCliente && <span className="font-mono text-xs">#{farmacia.codiceCliente}</span>}
          </div>
        </div>
        <span className={`badge ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
          {getLabelStato(stato)}
        </span>
      </div>

      {/* ── Quick info row ── */}
      <div className="flex flex-wrap gap-2">
        {farmacia.referente && (
          <span className="badge bg-brand-50 text-brand-600 border border-brand-100 py-1.5 text-xs">
            Ref: {farmacia.referente}
          </span>
        )}
        {farmacia.telefono && (
          <a href={`tel:${farmacia.telefono}`} className="btn-secondary text-xs py-2">
            <Phone size={13} /> {farmacia.telefono}
          </a>
        )}
        {farmacia.email && (
          <a href={`mailto:${farmacia.email}`} className="btn-secondary text-xs py-2">
            <Mail size={13} /> {farmacia.email}
          </a>
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

      {/* ── Email results (only when completato) ── */}
      {stato === 'completato' && (
        <div className="card p-4">
          <h3 className="text-[13px] font-semibold text-brand-800 flex items-center gap-2 mb-3">
            <Send size={14} className="text-status-done-500" /> Invia risultati
          </h3>
          <a href={buildMailtoLink()} className="btn-primary w-full py-2.5 text-center inline-flex items-center justify-center gap-2">
            <Mail size={15} /> Invia riepilogo via email
          </a>
        </div>
      )}

      {/* ── Progress stepper ── */}
      <div className="card p-4">
        <div className="flex items-center gap-0">
          {([1, 2, 3] as FaseNumero[]).map((fase, i) => {
            const rilievo = getRilievoFase(fase)
            const done = rilievo?.completata
            const partial = rilievo && !done
            return (
              <div key={fase} className="flex-1 flex items-center">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                  done ? 'bg-status-done-500 text-white' :
                  partial ? 'bg-accent-100 text-accent-700 ring-2 ring-accent-300' :
                  isFaseUnlocked(fase) ? 'bg-brand-100 text-brand-600' :
                  'bg-brand-100 text-brand-400'
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

      {/* ── Two-column layout: Fasi left, Timeline+Chat right ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* LEFT: 3 Fasi (3/5 width) */}
        <div className="lg:col-span-3 space-y-3">
          {([1, 2, 3] as FaseNumero[]).map(fase => {
            const rilievo = getRilievoFase(fase)
            const done = rilievo?.completata
            const hasPartialData = rilievo && !done
            const unlocked = isFaseUnlocked(fase)
            const FaseIcon = faseIcons[fase]

            return (
              <div
                key={fase}
                className={`card overflow-hidden transition-all ${
                  done ? 'border-status-done-100' :
                  unlocked ? 'border-accent-200' :
                  'opacity-50'
                }`}
              >
                {/* Fase header */}
                <div className={`px-5 py-3.5 border-b ${
                  done ? 'bg-status-done-50/50 border-status-done-100' :
                  unlocked ? 'bg-accent-50/30 border-accent-100' :
                  'bg-brand-50/50 border-brand-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        done ? 'bg-status-done-500 text-white' :
                        unlocked ? 'bg-accent-600 text-white' :
                        'bg-brand-200 text-brand-400'
                      }`}>
                        {done ? <CheckCircle2 size={18} /> : <FaseIcon size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-brand-900">Fase {fase} — {getLabelFase(fase)}</p>
                        <p className="text-[11px] text-brand-400">{getDescrizioneFase(fase)}</p>
                      </div>
                    </div>
                    {hasPartialData && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-accent-50 text-accent-600 font-medium border border-accent-100">
                        In compilazione
                      </span>
                    )}
                    {!unlocked && <Lock size={15} className="text-brand-300 shrink-0" />}
                  </div>
                </div>

                {/* Fase body */}
                <div className="px-5 py-4">
                  {/* Sbloccata ma non fatta */}
                  {!done && unlocked && (
                    <div className="space-y-3">
                      {/* Show partial data if exists */}
                      {hasPartialData && fase === 2 && (
                        <div className="space-y-1 mb-2 pb-2 border-b border-brand-50">
                          <p className="text-[10px] font-semibold text-accent-600 uppercase tracking-wider mb-1">Dati salvati</p>
                          {rilievo.kitRicevuto && <CheckItem checked={rilievo.kitRicevuto} label="Kit materiale ricevuto" />}
                          {rilievo.pezziRicevuti && <CheckItem checked={rilievo.pezziRicevuti} label="Pezzi ricevuti" />}
                          {rilievo.scaricamentoCompleto && <CheckItem checked={rilievo.scaricamentoCompleto} label="Scaricamento completato" />}
                          {rilievo.montaggioCompleto && <CheckItem checked={rilievo.montaggioCompleto} label="Montaggio completato" />}
                        </div>
                      )}
                      {hasPartialData && fase === 3 && rilievo.prodottiPosizionati && (
                        <div className="space-y-1 mb-2 pb-2 border-b border-brand-50">
                          <p className="text-[10px] font-semibold text-accent-600 uppercase tracking-wider mb-1">Dati salvati</p>
                          <CheckItem checked={rilievo.prodottiPosizionati} label="Prodotti posizionati" />
                        </div>
                      )}
                      <div className="bg-status-waiting-50 border border-status-waiting-100 rounded-lg p-3">
                        <p className="text-[11px] font-semibold text-status-waiting-600 uppercase tracking-wider flex items-center gap-1 mb-2">
                          <Info size={11} /> Istruzioni
                        </p>
                        {fase === 1 && (
                          <ol className="text-xs text-brand-700 space-y-1 list-decimal list-inside">
                            <li>Individua l'espositore dedicato alla cosmetica</li>
                            <li>Misura la <b>profondita dello scaffale</b> (struttura esterna)</li>
                            <li>Misura la <b>profondita della mensola</b> (ripiano interno)</li>
                            <li>Misura <b>larghezza</b> e <b>altezza</b> complessive</li>
                            <li>Conta il <b>numero di scaffali</b></li>
                            <li>Scatta <b>almeno 1 foto</b> dell'espositore</li>
                          </ol>
                        )}
                        {fase === 2 && (
                          <ol className="text-xs text-brand-700 space-y-1 list-decimal list-inside">
                            <li>Verifica di aver ricevuto tutti i <b>pezzi di plexiglass</b></li>
                            <li>Ogni elle ha il <b>nome del prodotto</b> stampato</li>
                            <li>Applica il <b>biadesivo</b> sul retro di ogni elle</li>
                            <li><b>Attacca</b> le elle sugli scaffali dell'espositore</li>
                            <li>Verifica che ogni pezzo sia <b>ben fissato e dritto</b></li>
                            <li>Scatta <b>almeno 1 foto</b> del risultato</li>
                          </ol>
                        )}
                        {fase === 3 && (
                          <ol className="text-xs text-brand-700 space-y-1 list-decimal list-inside">
                            <li>Verifica di aver ricevuto <b>tutti i prodotti</b></li>
                            <li>Posiziona ogni prodotto sullo <b>scaffale corrispondente</b></li>
                            <li>Verifica che l'espositore sia <b>completo e ordinato</b></li>
                            <li>Scatta <b>almeno 1 foto</b> del risultato finale</li>
                          </ol>
                        )}
                      </div>
                      <button onClick={() => setShowSopralluogoForm(fase)} className="btn-primary w-full py-3">
                        <MapPin size={16} /> {hasPartialData ? 'Continua' : 'Inizia'} Fase {fase}
                      </button>
                      {/* Sopralluoghi history for this fase */}
                      {(() => {
                        const faseSopralluoghi = sopralluoghi.filter(s => s.farmaciaId === farmacia.id && s.fase === fase)
                        if (faseSopralluoghi.length === 0) return null
                        return (
                          <div className="mt-2 space-y-1">
                            <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider">Sopralluoghi precedenti</p>
                            {faseSopralluoghi.map(s => (
                              <div key={s.id} className={`text-xs flex items-center gap-2 px-2 py-1.5 rounded border ${s.esito === 'riuscito' ? 'bg-status-done-50 border-status-done-100 text-status-done-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
                                <span>{s.data} {s.ora}</span>
                                <span>{s.durata} min</span>
                                <span className="font-medium">{s.esito === 'riuscito' ? 'Riuscito' : 'Non riuscito'}</span>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* Bloccata */}
                  {!done && !unlocked && (
                    <div className="flex items-center gap-2 text-brand-400 py-1">
                      <Lock size={13} />
                      <p className="text-xs">Completa la Fase {fase - 1} per sbloccare</p>
                    </div>
                  )}

                  {/* Completata */}
                  {done && rilievo && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-status-done-600 text-xs">
                        <CheckCircle2 size={13} />
                        <span>Completata il {rilievo.dataCompletamento}{rilievo.oraCompletamento ? ` alle ${rilievo.oraCompletamento}` : ''}</span>
                      </div>
                      {fase === 1 && (
                        <DynamicMisureDisplay rilievo={rilievo} />
                      )}
                      {fase === 2 && (
                        <div className="space-y-1">
                          {rilievo.kitRicevuto !== undefined && <CheckItem checked={rilievo.kitRicevuto} label="Kit materiale ricevuto" />}
                          <CheckItem checked={rilievo.pezziRicevuti} label="Pezzi ricevuti" />
                          <CheckItem checked={rilievo.scaricamentoCompleto} label="Scaricamento materiale (svuotamento scaffale)" />
                          <CheckItem checked={rilievo.montaggioCompleto} label="Montaggio materiale completato" />
                          {rilievo.problemaKit && (
                            <div className="bg-brand-50 border border-brand-200 rounded-lg p-2 mt-1">
                              <p className="text-[11px] font-medium text-brand-700 flex items-center gap-1">
                                <AlertTriangle size={11} /> Problema segnalato
                              </p>
                              {rilievo.descrizioneProblema && (
                                <p className="text-xs text-brand-700 mt-1">{rilievo.descrizioneProblema}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {fase === 3 && <CheckItem checked={rilievo.prodottiPosizionati} label="Prodotti posizionati" />}
                      {rilievo.foto?.length > 0 && (
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                          {rilievo.foto.map((f, i) => (
                            <img key={i} src={f} alt="" className="w-20 h-20 object-cover rounded-lg border border-brand-100 shrink-0" />
                          ))}
                        </div>
                      )}
                      {rilievo.note && (
                        <div className="bg-brand-50 rounded-lg p-2.5">
                          <p className="text-[11px] text-brand-400 mb-0.5">Note</p>
                          <p className="text-xs text-brand-700">{rilievo.note}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* RIGHT: Timeline + Chat (2/5 width) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Timeline */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={15} className="text-accent-600" />
              <h3 className="text-sm font-heading font-bold text-brand-800">Storico attivita</h3>
              {farmaciaEventi.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-500 font-medium">
                  {farmaciaEventi.length}
                </span>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              <Timeline eventi={farmaciaEventi} rilievi={rilievi} farmaciaId={farmacia.id} />
            </div>
          </div>

          {/* Chat */}
          <div className="card overflow-hidden">
            <button
              onClick={() => setShowChat(!showChat)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-brand-50/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-accent-600" />
                <h3 className="text-sm font-heading font-bold text-brand-800">Chat con Admin</h3>
              </div>
              {showChat ? <ChevronUp size={14} className="text-brand-400" /> : <ChevronDown size={14} className="text-brand-400" />}
            </button>
            {showChat && (
              <div className="border-t border-brand-100">
                <MessageThread
                  merchandiserId={user.id}
                  maxHeight="350px"
                  selectedFarmaciaId={farmacia.id}
                  onClearFarmaciaFilter={() => {}}
                  farmacie={assignedFarmacie}
                />
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

function DynamicMisureDisplay({ rilievo }: { rilievo: Rilievo }) {
  const { campiConfigurazione } = useData()
  const campiFase1 = campiConfigurazione.filter(c => c.fase === 1 && c.attivo).sort((a, b) => a.ordine - b.ordine)

  if (campiFase1.length === 0) {
    // Fallback to hardcoded display
    return (
      <div className="grid grid-cols-3 gap-2">
        <MisuraChip label="Prof. scaffale" value={rilievo.profonditaScaffale} unit="cm" />
        <MisuraChip label="Prof. mensola" value={rilievo.profonditaMensola} unit="cm" />
        <MisuraChip label="Larghezza" value={rilievo.larghezza} unit="cm" />
        <MisuraChip label="Altezza" value={rilievo.altezza} unit="cm" />
        <MisuraChip label="Scaffali" value={rilievo.numScaffali} />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {campiFase1.map(campo => {
        const val = rilievo.valoriDinamici?.[campo.nome] ?? (rilievo as any)?.[campo.nome]
        if (campo.tipo === 'checkbox') {
          return <MisuraChip key={campo.id} label={campo.label} value={val ? 1 : 0} unit={val ? 'Si' : 'No'} />
        }
        return <MisuraChip key={campo.id} label={campo.label} value={typeof val === 'number' ? val : undefined} unit={campo.unita} />
      })}
    </div>
  )
}

function MisuraChip({ label, value, unit }: { label: string; value?: number; unit?: string }) {
  return (
    <div className="bg-brand-50 rounded-sm px-2.5 py-2 border border-brand-100">
      <p className="text-[10px] text-brand-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-brand-800">{value ?? '—'}{unit && value ? ` ${unit}` : ''}</p>
    </div>
  )
}

function CheckItem({ checked, label }: { checked?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {checked
        ? <CheckCircle2 size={14} className="text-status-done-500 shrink-0" />
        : <AlertTriangle size={14} className="text-status-waiting-500 shrink-0" />
      }
      <span className={checked ? 'text-brand-700' : 'text-status-waiting-600'}>{label}</span>
    </div>
  )
}

// ============================================================
// SOPRALLUOGO FORM
// ============================================================

function SopralluogoForm({
  farmacia, fase, userId, sopralluoghi, onSuccess, onFailed, onBack, addSopralluogo, addEvento,
}: {
  farmacia: Farmacia; fase: FaseNumero; userId: string
  sopralluoghi: Sopralluogo[]
  onSuccess: () => void; onFailed: () => void; onBack: () => void
  addSopralluogo: (s: Sopralluogo) => Promise<void>
  addEvento: (e: RilievoEvento) => void
}) {
  const now = new Date()
  const [data, setData] = useState(now.toISOString().split('T')[0])
  const [ora, setOra] = useState(now.toTimeString().slice(0, 5))
  const [durata, setDurata] = useState(30)
  const [esito, setEsito] = useState<EsitoSopralluogo>('riuscito')
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const sopralluogo: Sopralluogo = {
      id: crypto.randomUUID(),
      farmaciaId: farmacia.id,
      merchandiserId: userId,
      fase,
      data,
      ora,
      durata,
      esito,
      nota: nota.trim() || undefined,
      createdAt: new Date().toISOString(),
    }

    try {
      await addSopralluogo(sopralluogo)
      addEvento({
        id: crypto.randomUUID(),
        farmaciaId: farmacia.id,
        merchandiserId: userId,
        fase,
        tipo: 'sopralluogo_registrato',
        dettaglio: esito === 'riuscito' ? 'Riuscito' : 'Non riuscito',
        createdAt: new Date().toISOString(),
      })

      if (esito === 'riuscito') {
        showToast('Sopralluogo registrato. Procedi con la fase.', 'success')
        onSuccess()
      } else {
        showToast('Sopralluogo non riuscito registrato.', 'info')
        onFailed()
      }
    } catch (err) {
      console.error('Errore salvataggio sopralluogo:', err)
      showToast('Errore durante il salvataggio. Riprova.', 'error')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <button onClick={onBack} className="btn-ghost -ml-3 text-brand-500">
        <ArrowLeft size={15} /> Torna alla scheda
      </button>

      <div className="card p-4 bg-status-waiting-50 border border-status-waiting-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded flex items-center justify-center bg-status-waiting-500 text-white">
            <MapPin size={20} />
          </div>
          <div>
            <h2 className="text-base font-heading font-bold text-brand-900">Sopralluogo — Fase {fase}</h2>
            <p className="text-xs text-brand-500">{farmacia.nome} — {farmacia.citta}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data *</label>
              <input type="date" value={data} onChange={e => setData(e.target.value)} required className="input" />
            </div>
            <div>
              <label className="label">Ora *</label>
              <input type="time" value={ora} onChange={e => setOra(e.target.value)} required className="input" />
            </div>
          </div>

          <div>
            <label className="label">Durata (minuti) *</label>
            <input type="number" value={durata} onChange={e => setDurata(parseInt(e.target.value) || 0)} required min={1} className="input" />
          </div>

          <div>
            <label className="label">Esito *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEsito('riuscito')}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  esito === 'riuscito'
                    ? 'border-status-done-500 bg-status-done-50 text-status-done-700'
                    : 'border-brand-200 text-brand-500 hover:border-brand-300'
                }`}
              >
                <CheckCircle2 size={18} className="mx-auto mb-1" />
                Riuscito
              </button>
              <button
                type="button"
                onClick={() => setEsito('non_riuscito')}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  esito === 'non_riuscito'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-brand-200 text-brand-500 hover:border-brand-300'
                }`}
              >
                <X size={18} className="mx-auto mb-1" />
                Non riuscito
              </button>
            </div>
          </div>

          <div>
            <label className="label">Note (opzionale)</label>
            <textarea
              value={nota}
              onChange={e => setNota(e.target.value)}
              rows={3}
              className="input"
              placeholder="Eventuali note sul sopralluogo..."
            />
            {nota.trim() && (
              <p className="text-[10px] text-accent-500 mt-1">La nota verra inviata automaticamente in chat.</p>
            )}
          </div>
        </div>

        <button type="submit" disabled={saving} className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
          esito === 'riuscito' ? 'bg-status-done-500 hover:bg-status-done-600' : 'bg-red-500 hover:bg-red-600'
        }`}>
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Salvataggio...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Check size={16} />
              {esito === 'riuscito' ? 'Registra e procedi alla fase' : 'Registra tentativo non riuscito'}
            </span>
          )}
        </button>
      </form>

      {/* Previous attempts */}
      {sopralluoghi.length > 0 && (
        <div className="card p-4">
          <h3 className="text-[13px] font-semibold text-brand-800 mb-3">Tentativi precedenti ({sopralluoghi.length})</h3>
          <div className="space-y-2">
            {sopralluoghi.map(s => (
              <div key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                s.esito === 'riuscito' ? 'bg-status-done-50 border-status-done-100' : 'bg-red-50 border-red-100'
              }`}>
                {s.esito === 'riuscito'
                  ? <CheckCircle2 size={14} className="text-status-done-500 shrink-0" />
                  : <X size={14} className="text-red-500 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-brand-800">{s.data} alle {s.ora} — {s.durata} min</p>
                  {s.nota && <p className="text-[11px] text-brand-500 mt-0.5 truncate">{s.nota}</p>}
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                  s.esito === 'riuscito' ? 'bg-status-done-100 text-status-done-700' : 'bg-red-100 text-red-700'
                }`}>
                  {s.esito === 'riuscito' ? 'Riuscito' : 'Non riuscito'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// FORM FASE (Task 6: layout verticale + esempio, Task 7: kit flags, Task 8: planogramma)
// ============================================================

function FaseForm({
  farmacia, fase, existing, onBack, onSave, userId, saveRilievo: saveRilievoFn, addEvento,
}: {
  farmacia: Farmacia; fase: FaseNumero; existing?: Rilievo
  onBack: () => void; onSave: (r: Rilievo) => Promise<void>; userId: string
  saveRilievo: (r: Rilievo) => Promise<void>
  addEvento: (e: RilievoEvento) => void
}) {
  const { campiConfigurazione } = useData()
  const campiFase = campiConfigurazione.filter(c => c.fase === fase && c.attivo).sort((a, b) => a.ordine - b.ordine)
  const [foto, setFoto] = useState<string[]>(existing?.foto || [])
  const [pezziRicevuti, setPezziRicevuti] = useState(existing?.pezziRicevuti || false)
  const [scaricamentoCompleto, setScaricamentoCompleto] = useState(existing?.scaricamentoCompleto || false)
  const [montaggioCompleto, setMontaggioCompleto] = useState(existing?.montaggioCompleto || false)
  const [prodottiPosizionati, setProdottiPosizionati] = useState(existing?.prodottiPosizionati || false)
  // Task 7: Kit flags
  const [kitRicevuto, setKitRicevuto] = useState(existing?.kitRicevuto || false)
  const [problemaKit, setProblemaKit] = useState(existing?.problemaKit || false)
  const [descrizioneProblema, setDescrizioneProblema] = useState(existing?.descrizioneProblema || '')
  const [fotoProblema, setFotoProblema] = useState<string[]>(existing?.fotoProblema || [])
  const [showConfirm, setShowConfirm] = useState(false)
  const [savedFormData, setSavedFormData] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  // Stable rilievo ID for incremental saves
  const rilievoIdRef = useRef(existing?.id || `ril-${Date.now()}`)
  const faseStartedRef = useRef(!!existing)

  // Fire fase_iniziata event on first entry (only if no existing rilievo)
  useEffect(() => {
    if (!faseStartedRef.current) {
      faseStartedRef.current = true
      addEvento({
        id: crypto.randomUUID(),
        farmaciaId: farmacia.id,
        merchandiserId: userId,
        fase,
        tipo: 'fase_iniziata',
        createdAt: new Date().toISOString(),
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Build partial rilievo for incremental saves
  const buildPartialRilievo = useCallback((): Rilievo => ({
    id: rilievoIdRef.current,
    farmaciaId: farmacia.id,
    merchandiserId: userId,
    fase,
    foto,
    completata: false,
    pezziRicevuti: fase === 2 ? pezziRicevuti : undefined,
    scaricamentoCompleto: fase === 2 ? scaricamentoCompleto : undefined,
    montaggioCompleto: fase === 2 ? montaggioCompleto : undefined,
    kitRicevuto: fase === 2 ? kitRicevuto : undefined,
    problemaKit: fase === 2 ? problemaKit : undefined,
    descrizioneProblema: fase === 2 && problemaKit ? descrizioneProblema : undefined,
    fotoProblema: fase === 2 && problemaKit ? fotoProblema : undefined,
    prodottiPosizionati: fase === 3 ? prodottiPosizionati : undefined,
  }), [farmacia.id, userId, fase, foto, pezziRicevuti, scaricamentoCompleto, montaggioCompleto, kitRicevuto, problemaKit, descrizioneProblema, fotoProblema, prodottiPosizionati])

  // Incremental save on checkbox toggle (Fase 2 & 3)
  function saveSubstep(fieldName: string, value: boolean) {
    const partial = buildPartialRilievo()
    // Update the specific field
    ;(partial as any)[fieldName] = value
    saveRilievoFn(partial).catch(console.error)
    addEvento({
      id: crypto.randomUUID(),
      farmaciaId: farmacia.id,
      merchandiserId: userId,
      fase,
      tipo: value ? 'substep_completato' : 'substep_annullato',
      dettaglio: fieldName,
      createdAt: new Date().toISOString(),
    })
  }

  // Debounced save for Fase 1 (misure)
  const misureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  function debouncedSaveMisure() {
    if (misureTimerRef.current) clearTimeout(misureTimerRef.current)
    misureTimerRef.current = setTimeout(() => {
      const form = document.getElementById('fase-form') as HTMLFormElement | null
      if (!form) return
      const fd = new FormData(form)
      const valoriDinamici: Record<string, string | number | boolean> = {}
      campiFase.forEach(campo => {
        if (campo.tipo === 'number') {
          valoriDinamici[campo.nome] = parseFloat(fd.get(campo.nome) as string || '0') || 0
        } else if (campo.tipo === 'checkbox') {
          valoriDinamici[campo.nome] = fd.get(campo.nome) === 'on'
        } else {
          valoriDinamici[campo.nome] = (fd.get(campo.nome) as string) || ''
        }
      })
      const partial: Rilievo = {
        id: rilievoIdRef.current,
        farmaciaId: farmacia.id,
        merchandiserId: userId,
        fase,
        foto,
        completata: false,
        valoriDinamici,
        profonditaScaffale: valoriDinamici.profonditaScaffale as number ?? undefined,
        profonditaMensola: valoriDinamici.profonditaMensola as number ?? undefined,
        larghezza: valoriDinamici.larghezza as number ?? undefined,
        altezza: valoriDinamici.altezza as number ?? undefined,
        numScaffali: valoriDinamici.numScaffali as number ?? undefined,
      }
      saveRilievoFn(partial).catch(console.error)
      addEvento({
        id: crypto.randomUUID(),
        farmaciaId: farmacia.id,
        merchandiserId: userId,
        fase,
        tipo: 'misure_salvate',
        createdAt: new Date().toISOString(),
      })
    }, 2000)
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    if (isSupabaseConfigured) {
      setUploading(true)
      for (const file of Array.from(files)) {
        try {
          const path = `rilievi/${farmacia.id}/${fase}/${Date.now()}-${file.name}`
          const url = await uploadPhoto(file, path)
          setFoto(prev => {
            const updated = [...prev, url]
            // Save incrementally with new photo
            const partial = buildPartialRilievo()
            partial.foto = updated
            saveRilievoFn(partial).catch(console.error)
            return updated
          })
          addEvento({
            id: crypto.randomUUID(),
            farmaciaId: farmacia.id,
            merchandiserId: userId,
            fase,
            tipo: 'foto_caricata',
            createdAt: new Date().toISOString(),
          })
        } catch (err) {
          console.error('Upload failed:', err)
        }
      }
      setUploading(false)
    } else {
      Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onload = () => {
          setFoto(prev => {
            const updated = [...prev, reader.result as string]
            const partial = buildPartialRilievo()
            partial.foto = updated
            saveRilievoFn(partial).catch(console.error)
            return updated
          })
          addEvento({
            id: crypto.randomUUID(),
            farmaciaId: farmacia.id,
            merchandiserId: userId,
            fase,
            tipo: 'foto_caricata',
            createdAt: new Date().toISOString(),
          })
        }
        reader.readAsDataURL(file)
      })
    }
    e.target.value = ''
  }

  function removePhoto(index: number) {
    setFoto(prev => prev.filter((_, i) => i !== index))
  }

  // Task 7: Problem photo upload
  async function handleProblemaPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    if (isSupabaseConfigured) {
      for (const file of Array.from(files)) {
        try {
          const path = `rilievi/${farmacia.id}/problemi/${Date.now()}-${file.name}`
          const url = await uploadPhoto(file, path)
          setFotoProblema(prev => [...prev, url])
        } catch (err) {
          console.error('Upload failed:', err)
        }
      }
    } else {
      Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onload = () => setFotoProblema(prev => [...prev, reader.result as string])
        reader.readAsDataURL(file)
      })
    }
    e.target.value = ''
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (foto.length === 0) { alert('Carica almeno una foto.'); return }
    if (fase === 2 && !kitRicevuto) { alert('Conferma la ricezione del kit materiale.'); return }
    if (fase === 2 && (!pezziRicevuti || !scaricamentoCompleto || !montaggioCompleto)) { alert('Completa la checklist (scaricamento e montaggio).'); return }
    if (fase === 3 && !prodottiPosizionati) { alert('Conferma il posizionamento prodotti.'); return }
    // Capture form data now while the form is still in the DOM
    const fd = new FormData(e.currentTarget)
    const captured: Record<string, string> = {}
    fd.forEach((value, key) => { captured[key] = value as string })
    setSavedFormData(captured)
    setShowConfirm(true)
  }

  async function confirmSave() {
    setSaving(true)
    const now = new Date()
    const rilievo: Rilievo = {
      id: rilievoIdRef.current,
      farmaciaId: farmacia.id,
      merchandiserId: userId,
      fase,
      completata: true,
      dataCompletamento: now.toISOString().split('T')[0],
      oraCompletamento: now.toTimeString().slice(0, 5),
      foto,
      note: savedFormData['note'] || '',
    }
    if (fase === 1) {
      // Dynamic fields
      const valoriDinamici: Record<string, string | number | boolean> = {}
      campiFase.forEach(campo => {
        if (campo.tipo === 'number') {
          valoriDinamici[campo.nome] = parseFloat(savedFormData[campo.nome] || '0') || 0
        } else if (campo.tipo === 'checkbox') {
          valoriDinamici[campo.nome] = savedFormData[campo.nome] === 'on'
        } else {
          valoriDinamici[campo.nome] = savedFormData[campo.nome] || ''
        }
      })
      rilievo.valoriDinamici = valoriDinamici
      // Legacy fields for backward compatibility
      rilievo.profonditaScaffale = valoriDinamici.profonditaScaffale as number ?? undefined
      rilievo.profonditaMensola = valoriDinamici.profonditaMensola as number ?? undefined
      rilievo.larghezza = valoriDinamici.larghezza as number ?? undefined
      rilievo.altezza = valoriDinamici.altezza as number ?? undefined
      rilievo.numScaffali = valoriDinamici.numScaffali as number ?? undefined
    }
    if (fase === 2) {
      rilievo.pezziRicevuti = pezziRicevuti
      rilievo.scaricamentoCompleto = scaricamentoCompleto
      rilievo.montaggioCompleto = montaggioCompleto
      rilievo.kitRicevuto = kitRicevuto
      rilievo.problemaKit = problemaKit
      rilievo.descrizioneProblema = problemaKit ? descrizioneProblema : undefined
      rilievo.fotoProblema = problemaKit ? fotoProblema : undefined
    }
    if (fase === 3) { rilievo.prodottiPosizionati = prodottiPosizionati }
    try {
      await onSave(rilievo)
      addEvento({
        id: crypto.randomUUID(),
        farmaciaId: farmacia.id,
        merchandiserId: userId,
        fase,
        tipo: 'fase_completata',
        createdAt: new Date().toISOString(),
      })
      showToast('Fase ' + fase + ' completata con successo!', 'success')
    } catch (err) {
      console.error('Errore salvataggio:', err)
      showToast('Errore durante il salvataggio. Riprova.', 'error')
      setSaving(false)
    }
  }

  const faseIcons = { 1: Ruler, 2: Wrench, 3: Package }
  const FaseIcon = faseIcons[fase]
  const faseColors = {
    1: { bg: 'bg-accent-600', light: 'bg-accent-50 border-accent-100', ring: 'ring-accent-200' },
    2: { bg: 'bg-brand-700', light: 'bg-brand-50 border-brand-100', ring: 'ring-brand-200' },
    3: { bg: 'bg-status-waiting-500', light: 'bg-status-waiting-50 border-status-waiting-100', ring: 'ring-brand-200' },
  }[fase]

  // Example images for vertical layout (Task 6)
  const esempioImages = {
    1: '/esempio-fase1.svg',
    2: '/esempio-fase2.svg',
    3: '/esempio-fase3.svg',
  }
  const esempioDescriptions = {
    1: 'Esempio: misurare profondita, larghezza, altezza e contare gli scaffali',
    2: 'Esempio: elle di plexiglass montate con biadesivo sugli scaffali',
    3: 'Esempio: prodotti posizionati sugli scaffali corrispondenti',
  }

  if (showConfirm) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="card p-6 text-center">
          <div className="w-14 h-14 rounded-sm bg-status-done-50 border border-status-done-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-status-done-500" />
          </div>
          <h2 className="text-lg font-heading font-bold text-brand-900 mb-1">Conferma completamento</h2>
          <p className="text-sm text-brand-500 mb-5">
            Fase {fase} per <b>{farmacia.nome}</b>
          </p>
          <div className="bg-brand-50 rounded-sm p-3 mb-5 text-left text-xs text-brand-600 space-y-1 border border-brand-100">
            <p><b>Foto:</b> {foto.length} caricate</p>
            {fase === 1 && <p><b>Misure:</b> compilate</p>}
            {fase === 2 && (
              <>
                <p><b>Kit ricevuto:</b> {kitRicevuto ? 'Si' : 'No'}</p>
                <p><b>Scaricamento materiale:</b> {scaricamentoCompleto ? 'completato' : 'da verificare'}</p>
                <p><b>Montaggio materiale:</b> {montaggioCompleto ? 'completato' : 'da verificare'}</p>
                {problemaKit && <p className="text-brand-700"><b>Problema segnalato:</b> {descrizioneProblema || 'Si'}</p>}
              </>
            )}
            {fase === 3 && <p><b>Prodotti:</b> {prodottiPosizionati ? 'posizionati' : 'da verificare'}</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowConfirm(false)} disabled={saving} className="btn-secondary flex-1 py-3">Torna indietro</button>
            <button onClick={confirmSave} disabled={saving} className="btn-primary flex-1 py-3 bg-status-done-500 hover:bg-status-done-700">
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Salvataggio...</>
              ) : (
                <><Check size={16} /> Conferma</>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <button onClick={onBack} className="btn-ghost -ml-3 text-brand-500">
        <ArrowLeft size={15} /> Torna alla scheda
      </button>

      {/* Header */}
      <div className={`card p-4 ${faseColors.light} border`}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded flex items-center justify-center ${faseColors.bg} text-white`}>
            <FaseIcon size={20} />
          </div>
          <div>
            <h2 className="text-base font-heading font-bold text-brand-900">Fase {fase} — {getLabelFase(fase)}</h2>
            <p className="text-xs text-brand-500">{farmacia.nome} — {farmacia.citta}</p>
          </div>
        </div>
      </div>

      <form id="fase-form" onSubmit={handleSubmit} className="space-y-4">

        {/* VERTICAL LAYOUT: Form left, Example right (Task 6) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left column: form fields */}
          <div className="md:order-1 space-y-4">
            {/* FASE 1: MISURE (dynamic fields) */}
            {fase === 1 && campiFase.length > 0 && (
              <div className="card p-4 space-y-4">
                <div>
                  <h3 className="text-[13px] font-semibold text-brand-800 flex items-center gap-2">
                    <Ruler size={14} className="text-accent-500" /> Misure espositore
                  </h3>
                  <p className="text-[11px] text-brand-400 mt-0.5">Rileva tutte le misure</p>
                </div>
                {campiFase.map(campo => {
                  const existingVal = existing?.valoriDinamici?.[campo.nome]
                    ?? (existing as any)?.[campo.nome]
                  return (
                    <div key={campo.id}>
                      <label className="label">
                        {campo.label}{campo.unita ? ` (${campo.unita})` : ''}{campo.obbligatorio ? ' *' : ''}
                      </label>
                      {campo.descrizione && (
                        <p className="text-[11px] text-brand-400 mb-1.5">{campo.descrizione}</p>
                      )}
                      {campo.tipo === 'number' && (
                        <input
                          name={campo.nome}
                          type="number"
                          step="0.1"
                          inputMode="decimal"
                          required={campo.obbligatorio}
                          defaultValue={existingVal ?? ''}
                          className="input"
                          onInput={debouncedSaveMisure}
                        />
                      )}
                      {campo.tipo === 'text' && (
                        <input
                          name={campo.nome}
                          type="text"
                          required={campo.obbligatorio}
                          defaultValue={existingVal ?? ''}
                          className="input"
                          onInput={debouncedSaveMisure}
                        />
                      )}
                      {campo.tipo === 'select' && (
                        <select
                          name={campo.nome}
                          required={campo.obbligatorio}
                          defaultValue={existingVal ?? ''}
                          className="input"
                          onChange={debouncedSaveMisure}
                        >
                          <option value="">Seleziona...</option>
                          {campo.opzioni?.map(o => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      )}
                      {campo.tipo === 'checkbox' && (
                        <label className="flex items-center gap-2 p-2 rounded-sm border border-brand-100 cursor-pointer hover:bg-brand-50 transition-colors">
                          <input type="checkbox" name={campo.nome} defaultChecked={!!existingVal}
                            className="w-4 h-4 rounded border-brand-300 text-accent-600 focus:ring-accent-200" />
                          <span className="text-xs text-brand-700">{campo.label}</span>
                        </label>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* FASE 2: MONTAGGIO with Kit flags (Task 7) */}
            {fase === 2 && (
              <div className="space-y-4">
                {/* Kit reception section (Task 7) */}
                <div className="card p-4 space-y-3">
                  <h3 className="text-[13px] font-semibold text-brand-800 flex items-center gap-2">
                    <Package size={14} className="text-accent-500" /> Ricezione kit
                  </h3>
                  <label className="flex items-start gap-3 p-3 rounded-sm border border-brand-100 cursor-pointer hover:bg-brand-50 transition-colors">
                    <input type="checkbox" checked={kitRicevuto} onChange={e => { setKitRicevuto(e.target.checked); saveSubstep('kitRicevuto', e.target.checked) }}
                      className="mt-0.5 w-4 h-4 rounded border-brand-300 text-accent-600 focus:ring-accent-200" />
                    <div>
                      <p className="text-xs font-medium text-brand-800">Kit materiale ricevuto *</p>
                      <p className="text-[11px] text-brand-400">Conferma di aver ricevuto il kit con le elle di plexiglass</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-sm border border-brand-100 cursor-pointer hover:bg-brand-50 transition-colors">
                    <input type="checkbox" checked={problemaKit} onChange={e => {
                      setProblemaKit(e.target.checked)
                      const partial = buildPartialRilievo()
                      partial.problemaKit = e.target.checked
                      saveRilievoFn(partial).catch(console.error)
                      addEvento({
                        id: crypto.randomUUID(),
                        farmaciaId: farmacia.id,
                        merchandiserId: userId,
                        fase,
                        tipo: e.target.checked ? 'problema_segnalato' : 'problema_rimosso',
                        dettaglio: descrizioneProblema || undefined,
                        createdAt: new Date().toISOString(),
                      })
                    }}
                      className="mt-0.5 w-4 h-4 rounded border-brand-300 text-brand-600 focus:ring-brand-200" />
                    <div>
                      <p className="text-xs font-medium text-brand-800">Segnala un problema</p>
                      <p className="text-[11px] text-brand-400">Pezzi mancanti, danneggiati o errati</p>
                    </div>
                  </label>
                  {problemaKit && (
                    <div className="space-y-3 pl-2 border-l-2 border-brand-200 ml-2">
                      <div>
                        <label className="label text-brand-700">Descrizione problema</label>
                        <textarea
                          value={descrizioneProblema}
                          onChange={e => setDescrizioneProblema(e.target.value)}
                          rows={2}
                          className="input resize-none"
                          placeholder="Es: Mancano 2 elle per prodotto X..."
                        />
                      </div>
                      <div>
                        <label className="label text-brand-700">Foto problema</label>
                        {fotoProblema.length > 0 && (
                          <div className="flex gap-1.5 mb-2">
                            {fotoProblema.map((f, i) => (
                              <img key={i} src={f} alt="" className="w-12 h-12 object-cover rounded border border-brand-200" />
                            ))}
                          </div>
                        )}
                        <label className="block cursor-pointer">
                          <div className="border border-dashed border-brand-200 rounded-sm p-3 text-center hover:bg-brand-50 transition-colors">
                            <Camera size={16} className="mx-auto text-brand-500 mb-1" />
                            <p className="text-[11px] text-brand-600">Scatta foto del problema</p>
                          </div>
                          <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handleProblemaPhoto} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Assembly checklist */}
                <div className="card p-4 space-y-3">
                  <h3 className="text-[13px] font-semibold text-brand-800 flex items-center gap-2">
                    <Wrench size={14} className="text-brand-500" /> Checklist montaggio
                  </h3>
                  <label className="flex items-start gap-3 p-3 rounded-sm border border-brand-100 cursor-pointer hover:bg-brand-50 transition-colors">
                    <input type="checkbox" checked={pezziRicevuti} onChange={e => { setPezziRicevuti(e.target.checked); saveSubstep('pezziRicevuti', e.target.checked) }}
                      className="mt-0.5 w-4 h-4 rounded border-brand-300 text-accent-600 focus:ring-accent-200" />
                    <div>
                      <p className="text-xs font-medium text-brand-800">Pezzi di plexiglass ricevuti</p>
                      <p className="text-[11px] text-brand-400">Kit completo, elle corrispondenti ai prodotti</p>
                    </div>
                  </label>

                  {/* Sottopunto 1: Scaricamento materiale */}
                  <label className="flex items-start gap-3 p-3 rounded-sm border border-brand-100 cursor-pointer hover:bg-brand-50 transition-colors">
                    <input type="checkbox" checked={scaricamentoCompleto} onChange={e => { setScaricamentoCompleto(e.target.checked); saveSubstep('scaricamentoCompleto', e.target.checked) }}
                      className="mt-0.5 w-4 h-4 rounded border-brand-300 text-accent-600 focus:ring-accent-200" />
                    <div>
                      <p className="text-xs font-medium text-brand-800">Scaricamento materiale (svuotamento scaffale)</p>
                      <p className="text-[11px] text-brand-400">Scaffale svuotato e pronto per il montaggio</p>
                    </div>
                  </label>

                  {/* Sottopunto 2: Montaggio materiale */}
                  <label className="flex items-start gap-3 p-3 rounded-sm border border-brand-100 cursor-pointer hover:bg-brand-50 transition-colors">
                    <input type="checkbox" checked={montaggioCompleto} onChange={e => { setMontaggioCompleto(e.target.checked); saveSubstep('montaggioCompleto', e.target.checked) }}
                      className="mt-0.5 w-4 h-4 rounded border-brand-300 text-accent-600 focus:ring-accent-200" />
                    <div>
                      <p className="text-xs font-medium text-brand-800">Montaggio materiale completato</p>
                      <p className="text-[11px] text-brand-400">Tutte le elle fissate con biadesivo, dritte e stabili</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* FASE 3: PRODOTTI */}
            {fase === 3 && (
              <div className="card p-4 space-y-3">
                <h3 className="text-[13px] font-semibold text-brand-800 flex items-center gap-2">
                  <Package size={14} className="text-status-waiting-500" /> Caricamento prodotti
                </h3>
                <label className="flex items-start gap-3 p-3 rounded-sm border border-brand-100 cursor-pointer hover:bg-brand-50 transition-colors">
                  <input type="checkbox" checked={prodottiPosizionati} onChange={e => { setProdottiPosizionati(e.target.checked); saveSubstep('prodottiPosizionati', e.target.checked) }}
                    className="mt-0.5 w-4 h-4 rounded border-brand-300 text-accent-600 focus:ring-accent-200" />
                  <div>
                    <p className="text-xs font-medium text-brand-800">Tutti i prodotti posizionati</p>
                    <p className="text-[11px] text-brand-400">Ogni prodotto sullo scaffale corrispondente alla propria elle</p>
                  </div>
                </label>
                <div className="flex items-start gap-2 p-3 bg-accent-50 border border-accent-100 rounded-sm">
                  <Info size={14} className="text-accent-600 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-accent-700">
                    Ultima fase. La foto deve mostrare l'espositore completo con tutti i prodotti. Sara visibile al cliente.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right column: example image (Task 6) + planogramma (Task 8) */}
          <div className="md:order-2">
            <div className="card p-4">
              <p className="text-[11px] font-semibold text-brand-500 uppercase tracking-wider mb-2">
                {fase === 3 && farmacia.planogrammaUrl ? 'Planogramma di riferimento' : 'Esempio di riferimento'}
              </p>
              {fase === 3 && farmacia.planogrammaUrl ? (
                <img
                  src={farmacia.planogrammaUrl}
                  alt="Planogramma"
                  className="w-full rounded-sm border border-brand-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                    const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
              ) : null}
              <img
                src={esempioImages[fase]}
                alt={`Esempio fase ${fase}`}
                className="w-full rounded-sm border border-brand-100"
                style={fase === 3 && farmacia.planogrammaUrl ? { display: 'none' } : undefined}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                  const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
              {/* Fallback if image fails to load */}
              <div className="hidden flex-col items-center justify-center py-8 text-center bg-brand-50 rounded-sm border border-brand-100">
                <FaseIcon size={32} className="text-brand-300 mb-2" />
                <p className="text-xs text-brand-500">{esempioDescriptions[fase]}</p>
              </div>
            </div>
          </div>
        </div>

        {/* FOTO */}
        <div className="card p-4 space-y-3">
          <div>
            <h3 className="text-[13px] font-semibold text-brand-800 flex items-center gap-2">
              <Camera size={14} /> Documentazione fotografica
            </h3>
            <p className="text-[11px] text-brand-400 mt-0.5">Minimo 1 foto richiesta</p>
          </div>
          {foto.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {foto.map((f, i) => (
                <div key={i} className="relative aspect-square">
                  <img src={f} alt="" className="w-full h-full object-cover rounded-sm border border-brand-100" />
                  <button type="button" onClick={() => removePhoto(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-500 text-white rounded-full flex items-center justify-center shadow-sm">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="block cursor-pointer">
            <div className={`border-2 border-dashed rounded-sm p-5 text-center transition-colors ${
              foto.length === 0 ? 'border-accent-200 bg-accent-50/30 hover:bg-accent-50' : 'border-brand-200 hover:border-brand-300'
            }`}>
              {uploading ? (
                <>
                  <div className="w-6 h-6 border-2 border-accent-400 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                  <p className="text-xs text-accent-700">Caricamento in corso...</p>
                </>
              ) : foto.length === 0 ? (
                <>
                  <Camera size={28} className="mx-auto text-accent-400 mb-1.5" />
                  <p className="text-xs font-medium text-accent-700">Scatta o carica foto</p>
                </>
              ) : (
                <>
                  <ImagePlus size={20} className="mx-auto text-brand-400 mb-1" />
                  <p className="text-xs text-brand-500">Aggiungi foto</p>
                </>
              )}
            </div>
            <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhoto} disabled={uploading} />
          </label>
        </div>

        {/* NOTE */}
        <div className="card p-4">
          <label className="label">Note e segnalazioni</label>
          <p className="text-[11px] text-brand-400 mb-2">Segnala eventuali problemi o anomalie</p>
          <textarea name="note" rows={3} defaultValue={existing?.note || ''}
            className="input resize-none"
            placeholder={
              fase === 1 ? 'Es: Espositore in buono stato...' :
              fase === 2 ? 'Es: Pezzo mancante per prodotto X...' :
              'Es: Prodotto Y esaurito...'
            }
          />
        </div>

        {/* SUBMIT */}
        <button type="submit" className="btn-primary w-full py-3.5 text-base shadow-elevated" disabled={uploading}>
          <Check size={18} /> Completa Fase {fase}
        </button>
      </form>
    </div>
  )
}

// ============================================================
// REPORT GIORNALIERO (Task 12)
// ============================================================

function ReportView({
  user, farmacie, rilievi, onBack
}: {
  user: { nome: string; cognome: string }
  farmacie: Farmacia[]
  rilievi: Rilievo[]
  onBack: () => void
}) {
  const oggi = new Date().toISOString().split('T')[0]

  const completate = farmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'completata').length
  const inCorso = farmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'in_corso').length
  const daFare = farmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'da_fare').length
  const inAttesa = farmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'in_attesa').length

  // Fasi completate oggi
  const fasiOggi = rilievi.filter(r =>
    r.dataCompletamento === oggi &&
    farmacie.some(f => f.id === r.farmaciaId)
  )

  function downloadReport() {
    let text = `REPORT GIORNALIERO — ${oggi}\n`
    text += `Merchandiser: ${user.nome} ${user.cognome}\n`
    text += `${'='.repeat(50)}\n\n`

    text += `RIEPILOGO\n`
    text += `---------\n`
    text += `Totale farmacie assegnate: ${farmacie.length}\n`
    text += `Completate: ${completate}\n`
    text += `In corso: ${inCorso}\n`
    text += `Da fare: ${daFare}\n`
    if (inAttesa > 0) text += `In attesa materiale: ${inAttesa}\n`
    text += `\n`

    if (fasiOggi.length > 0) {
      text += `FASI COMPLETATE OGGI (${fasiOggi.length})\n`
      text += `${'─'.repeat(30)}\n`
      fasiOggi.forEach(r => {
        const farm = farmacie.find(f => f.id === r.farmaciaId)
        text += `- ${farm?.nome || '?'}: Fase ${r.fase} (${getLabelFase(r.fase)}) alle ${r.oraCompletamento}\n`
      })
      text += '\n'
    }

    text += `DETTAGLIO FARMACIE\n`
    text += `${'─'.repeat(30)}\n`
    farmacie.forEach(f => {
      const stato = getStatoFarmacia(rilievi, f.id)
      const fasiDone = rilievi.filter(r => r.farmaciaId === f.id && r.completata).length
      text += `${f.nome} (${f.citta}) — ${getLabelStato(stato)} [${fasiDone}/3]\n`
    })

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${oggi}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <button onClick={onBack} className="btn-ghost -ml-3 text-brand-500">
        <ArrowLeft size={15} /> Torna alla lista
      </button>

      <div className="card p-5">
        <h2 className="text-lg font-heading font-bold text-brand-900 flex items-center gap-2 mb-1">
          <FileText size={18} className="text-accent-600" /> Report giornaliero
        </h2>
        <p className="text-sm text-brand-400">{oggi} — {user.nome} {user.cognome}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-3 text-center">
          <p className="text-xl font-heading font-bold text-status-done-600">{completate}</p>
          <p className="text-[11px] text-brand-500">Completate</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-heading font-bold text-status-waiting-500">{inCorso}</p>
          <p className="text-[11px] text-brand-500">In corso</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-heading font-bold text-brand-600">{daFare}</p>
          <p className="text-[11px] text-brand-500">Da fare</p>
        </div>
        {inAttesa > 0 && (
          <div className="card p-3 text-center">
            <p className="text-xl font-heading font-bold text-status-waiting-600">{inAttesa}</p>
            <p className="text-[11px] text-brand-500">In attesa</p>
          </div>
        )}
      </div>

      {fasiOggi.length > 0 && (
        <div className="card p-4">
          <h3 className="text-[13px] font-semibold text-brand-800 mb-2">Fasi completate oggi</h3>
          <div className="space-y-1.5">
            {fasiOggi.map(r => {
              const farm = farmacie.find(f => f.id === r.farmaciaId)
              return (
                <div key={r.id} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={13} className="text-status-done-500 shrink-0" />
                  <span className="text-brand-700">{farm?.nome}</span>
                  <span className="text-brand-400">Fase {r.fase} — {r.oraCompletamento}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button onClick={downloadReport} className="btn-primary w-full py-3">
        <Download size={16} /> Scarica report
      </button>
    </div>
  )
}
