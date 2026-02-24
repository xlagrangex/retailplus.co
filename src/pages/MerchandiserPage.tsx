import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { uploadPhoto } from '../lib/supabase'
import {
  Farmacia, Rilievo, FaseNumero, StatoFarmacia, getStatoFarmacia, getColoreStato,
  getLabelStato, getLabelFase, getDescrizioneFase, getFaseCorrente,
} from '../types'
import {
  ArrowLeft, Camera, Check, ChevronRight, Lock, MapPin, Phone, Mail,
  Ruler, X, AlertTriangle, CheckCircle2, Info, ImagePlus, Package, Wrench,
  Pause, Play, FileText, Send, Download,
} from 'lucide-react'

// Colori corporate per stati
const statoConfig: Record<StatoFarmacia, { dot: string; bg: string; text: string; border: string }> = {
  da_fare: { dot: '#d64545', bg: 'bg-danger-50', text: 'text-danger-600', border: 'border-danger-100' },
  in_corso: { dot: '#de911d', bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-100' },
  completata: { dot: '#3f9142', bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-100' },
  in_attesa: { dot: '#6366f1', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
}

export default function MerchandiserPage() {
  const { user } = useAuth()
  const { farmacie, assegnazioni, rilievi } = useData()
  const [selectedFarmacia, setSelectedFarmacia] = useState<Farmacia | null>(null)
  const [showReport, setShowReport] = useState(false)

  if (!user) return null

  const mieAssegnazioni = assegnazioni.filter(a => a.merchandiserId === user.id)
  const mieFarmacie = farmacie.filter(f => mieAssegnazioni.some(a => a.farmaciaId === f.id))

  const ordineStato: Record<StatoFarmacia, number> = { da_fare: 0, in_attesa: 1, in_corso: 2, completata: 3 }
  const farmacieSorted = [...mieFarmacie].sort((a, b) => {
    const sa = getStatoFarmacia(rilievi, a.id)
    const sb = getStatoFarmacia(rilievi, b.id)
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
    return <FarmaciaDetail farmacia={selectedFarmacia} onBack={() => setSelectedFarmacia(null)} />
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Ciao, {user.nome}</h1>
          <p className="page-subtitle">{mieFarmacie.length} farmacie assegnate</p>
        </div>
        <button onClick={() => setShowReport(true)} className="btn-secondary text-xs">
          <FileText size={14} /> Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(['da_fare', 'in_corso', 'completata'] as StatoFarmacia[]).map(stato => {
          const count = mieFarmacie.filter(f => getStatoFarmacia(rilievi, f.id) === stato).length
          const cfg = statoConfig[stato]
          return (
            <div key={stato} className="card p-3 text-center">
              <span className="inline-block w-2.5 h-2.5 rounded-full mb-1.5" style={{ backgroundColor: cfg.dot }} />
              <p className="text-xl font-semibold text-brand-900">{count}</p>
              <p className="text-[11px] text-brand-500">{getLabelStato(stato)}</p>
            </div>
          )
        })}
      </div>

      {/* In attesa count */}
      {mieFarmacie.some(f => getStatoFarmacia(rilievi, f.id) === 'in_attesa') && (
        <div className="card p-3 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
          <span className="text-sm text-brand-700">
            <b>{mieFarmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'in_attesa').length}</b> in attesa di materiale
          </span>
        </div>
      )}

      {/* Lista farmacie */}
      <div className="space-y-2">
        {farmacieSorted.map(f => {
          const stato = getStatoFarmacia(rilievi, f.id)
          const fasiComplete = rilievi.filter(r => r.farmaciaId === f.id && r.completata).length
          const faseCorrente = getFaseCorrente(rilievi, f.id)
          const isCompletata = stato === 'completata'
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
                  {!isCompletata && stato !== 'in_attesa' && (
                    <p className="text-[11px] text-accent-600 font-medium mt-1.5">
                      Prossimo: Fase {faseCorrente} — {getLabelFase(faseCorrente)}
                    </p>
                  )}
                  {stato === 'in_attesa' && (
                    <p className="text-[11px] text-indigo-600 font-medium mt-1.5 flex items-center gap-1">
                      <Pause size={10} /> In attesa di materiale
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
                      <div className={`h-1.5 rounded-full ${done ? 'bg-success-500' : 'bg-brand-100'}`} />
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
  )
}

// ============================================================
// DETTAGLIO FARMACIA (Task 5: contatti, Task 10: in_attesa, Task 11: email)
// ============================================================

function FarmaciaDetail({ farmacia, onBack }: { farmacia: Farmacia; onBack: () => void }) {
  const { user } = useAuth()
  const { rilievi, saveRilievo } = useData()
  const [activeFase, setActiveFase] = useState<FaseNumero | null>(null)

  if (!user) return null

  const getRilievoFase = (fase: FaseNumero) =>
    rilievi.find(r => r.farmaciaId === farmacia.id && r.fase === fase)

  const isFaseUnlocked = (fase: FaseNumero): boolean => {
    if (fase === 1) return true
    return !!getRilievoFase((fase - 1) as FaseNumero)?.completata
  }

  const stato = getStatoFarmacia(rilievi, farmacia.id)
  const cfg = statoConfig[stato]

  // Toggle in_attesa (Task 10)
  function toggleInAttesa() {
    const isCurrentlyInAttesa = stato === 'in_attesa'
    // Find the latest rilievo or create a marker
    const existingRilievi = rilievi.filter(r => r.farmaciaId === farmacia.id)
    if (existingRilievi.length > 0) {
      // Update the last rilievo
      const lastRilievo = existingRilievi[existingRilievi.length - 1]
      saveRilievo({ ...lastRilievo, inAttesaMateriale: !isCurrentlyInAttesa })
    } else {
      // Create a placeholder rilievo for phase 1
      saveRilievo({
        id: `wait-${Date.now()}`,
        farmaciaId: farmacia.id,
        merchandiserId: user.id,
        fase: 1,
        foto: [],
        completata: false,
        inAttesaMateriale: true,
      })
    }
  }

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
          body += `Pezzi ricevuti: ${r.pezziRicevuti ? 'Si' : 'No'}, Montaggio: ${r.montaggioCompleto ? 'Completo' : 'Incompleto'}\n`
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

  if (activeFase) {
    return (
      <FaseForm
        farmacia={farmacia}
        fase={activeFase}
        existing={getRilievoFase(activeFase)}
        onBack={() => setActiveFase(null)}
        onSave={(r) => { saveRilievo(r); setActiveFase(null) }}
        userId={user.id}
      />
    )
  }

  const faseIcons = { 1: Ruler, 2: Wrench, 3: Package }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <button onClick={onBack} className="btn-ghost -ml-3 text-brand-500">
        <ArrowLeft size={15} /> Torna alla lista
      </button>

      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-900">{farmacia.nome}</h2>
            <p className="text-sm text-brand-400 flex items-center gap-1 mt-1">
              <MapPin size={14} className="shrink-0" /> {farmacia.indirizzo}, {farmacia.citta} ({farmacia.provincia})
            </p>
          </div>
          <span className={`badge ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
            {getLabelStato(stato)}
          </span>
        </div>

        {/* Contatti completi (Task 5) */}
        <div className="flex flex-wrap gap-2 mt-3">
          {farmacia.referente && (
            <span className="badge bg-brand-50 text-brand-600 border border-brand-100">
              Ref: {farmacia.referente}
            </span>
          )}
          {farmacia.telefono && (
            <a href={`tel:${farmacia.telefono}`} className="btn-secondary text-xs py-1.5">
              <Phone size={13} /> {farmacia.telefono}
            </a>
          )}
          {farmacia.email && (
            <a href={`mailto:${farmacia.email}`} className="btn-secondary text-xs py-1.5">
              <Mail size={13} /> {farmacia.email}
            </a>
          )}
        </div>

        {/* Toggle in attesa materiale (Task 10) */}
        {stato !== 'completata' && (
          <div className="mt-3 pt-3 border-t border-brand-50">
            <button
              onClick={toggleInAttesa}
              className={`text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-colors ${
                stato === 'in_attesa'
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                  : 'bg-brand-50 text-brand-500 border-brand-100 hover:bg-brand-100'
              }`}
            >
              {stato === 'in_attesa' ? <Play size={12} /> : <Pause size={12} />}
              {stato === 'in_attesa' ? 'Rimuovi attesa materiale' : 'Segna in attesa materiale'}
            </button>
          </div>
        )}
      </div>

      {/* Email results (Task 11) */}
      {stato === 'completata' && (
        <div className="card p-4">
          <h3 className="text-[13px] font-semibold text-brand-800 flex items-center gap-2 mb-3">
            <Send size={14} className="text-success-500" /> Invia risultati
          </h3>
          <a href={buildMailtoLink()} className="btn-primary w-full py-2.5 text-center inline-flex items-center justify-center gap-2">
            <Mail size={15} /> Invia riepilogo via email
          </a>
        </div>
      )}

      {/* Progress stepper */}
      <div className="card p-4">
        <p className="section-title text-[11px] mb-3">Avanzamento</p>
        <div className="flex items-center gap-0">
          {([1, 2, 3] as FaseNumero[]).map((fase, i) => {
            const done = getRilievoFase(fase)?.completata
            const unlocked = isFaseUnlocked(fase)
            return (
              <div key={fase} className="flex-1 flex items-center">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-semibold transition-colors ${
                  done ? 'bg-success-500 text-white' :
                  unlocked ? 'bg-accent-100 text-accent-700 ring-1 ring-accent-300' :
                  'bg-brand-50 text-brand-400'
                }`}>
                  {done ? <Check size={14} /> : fase}
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-px mx-2 ${
                    getRilievoFase(fase)?.completata ? 'bg-success-300' : 'bg-brand-100'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 3 Fasi */}
      <div className="space-y-2">
        {([1, 2, 3] as FaseNumero[]).map(fase => {
          const rilievo = getRilievoFase(fase)
          const done = rilievo?.completata
          const unlocked = isFaseUnlocked(fase)
          const FaseIcon = faseIcons[fase]

          return (
            <div
              key={fase}
              className={`card overflow-hidden transition-all ${
                done ? 'border-success-100' :
                unlocked ? 'border-accent-200' :
                'opacity-50'
              }`}
            >
              {/* Header */}
              <div className={`px-4 py-3 border-b ${
                done ? 'bg-success-50/50 border-success-100' :
                unlocked ? 'bg-accent-50/30 border-accent-100' :
                'bg-brand-50/50 border-brand-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-md flex items-center justify-center ${
                      done ? 'bg-success-500 text-white' :
                      unlocked ? 'bg-accent-600 text-white' :
                      'bg-brand-200 text-brand-400'
                    }`}>
                      {done ? <CheckCircle2 size={18} /> : <FaseIcon size={16} />}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-brand-900">Fase {fase} — {getLabelFase(fase)}</p>
                      <p className="text-[11px] text-brand-400">{getDescrizioneFase(fase)}</p>
                    </div>
                  </div>
                  {!unlocked && <Lock size={15} className="text-brand-300 shrink-0" />}
                </div>
              </div>

              {/* Body */}
              <div className="px-4 py-3">
                {/* Sbloccata ma non fatta */}
                {!done && unlocked && (
                  <div className="space-y-3">
                    <div className="bg-warning-50 border border-warning-100 rounded-md p-3">
                      <p className="text-[11px] font-semibold text-warning-600 uppercase tracking-wider flex items-center gap-1 mb-2">
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
                    <button onClick={() => setActiveFase(fase)} className="btn-primary w-full py-3">
                      <Camera size={16} /> Inizia Fase {fase}
                    </button>
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
                    <div className="flex items-center gap-2 text-success-600 text-xs">
                      <CheckCircle2 size={13} />
                      <span>Completata il {rilievo.dataCompletamento}{rilievo.oraCompletamento ? ` alle ${rilievo.oraCompletamento}` : ''}</span>
                    </div>
                    {fase === 1 && (
                      <div className="grid grid-cols-3 gap-2">
                        <MisuraChip label="Prof. scaffale" value={rilievo.profonditaScaffale} unit="cm" />
                        <MisuraChip label="Prof. mensola" value={rilievo.profonditaMensola} unit="cm" />
                        <MisuraChip label="Larghezza" value={rilievo.larghezza} unit="cm" />
                        <MisuraChip label="Altezza" value={rilievo.altezza} unit="cm" />
                        <MisuraChip label="Scaffali" value={rilievo.numScaffali} />
                      </div>
                    )}
                    {fase === 2 && (
                      <div className="space-y-1">
                        {rilievo.kitRicevuto !== undefined && <CheckItem checked={rilievo.kitRicevuto} label="Kit materiale ricevuto" />}
                        <CheckItem checked={rilievo.pezziRicevuti} label="Pezzi ricevuti" />
                        <CheckItem checked={rilievo.montaggioCompleto} label="Montaggio completato" />
                        {rilievo.problemaKit && (
                          <div className="bg-danger-50 border border-danger-100 rounded-md p-2 mt-1">
                            <p className="text-[11px] font-medium text-danger-600 flex items-center gap-1">
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
                          <img key={i} src={f} alt="" className="w-16 h-16 object-cover rounded border border-brand-100 shrink-0" />
                        ))}
                      </div>
                    )}
                    {rilievo.note && (
                      <div className="bg-brand-50 rounded-md p-2.5">
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
    </div>
  )
}

function MisuraChip({ label, value, unit }: { label: string; value?: number; unit?: string }) {
  return (
    <div className="bg-brand-50 rounded-md px-2.5 py-2 border border-brand-100">
      <p className="text-[10px] text-brand-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-brand-800">{value ?? '—'}{unit && value ? ` ${unit}` : ''}</p>
    </div>
  )
}

function CheckItem({ checked, label }: { checked?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {checked
        ? <CheckCircle2 size={14} className="text-success-500 shrink-0" />
        : <AlertTriangle size={14} className="text-warning-500 shrink-0" />
      }
      <span className={checked ? 'text-brand-700' : 'text-warning-600'}>{label}</span>
    </div>
  )
}

// ============================================================
// FORM FASE (Task 6: layout verticale + esempio, Task 7: kit flags, Task 8: planogramma)
// ============================================================

function FaseForm({
  farmacia, fase, existing, onBack, onSave, userId
}: {
  farmacia: Farmacia; fase: FaseNumero; existing?: Rilievo
  onBack: () => void; onSave: (r: Rilievo) => void; userId: string
}) {
  const [foto, setFoto] = useState<string[]>(existing?.foto || [])
  const [pezziRicevuti, setPezziRicevuti] = useState(existing?.pezziRicevuti || false)
  const [montaggioCompleto, setMontaggioCompleto] = useState(existing?.montaggioCompleto || false)
  const [prodottiPosizionati, setProdottiPosizionati] = useState(existing?.prodottiPosizionati || false)
  // Task 7: Kit flags
  const [kitRicevuto, setKitRicevuto] = useState(existing?.kitRicevuto || false)
  const [problemaKit, setProblemaKit] = useState(existing?.problemaKit || false)
  const [descrizioneProblema, setDescrizioneProblema] = useState(existing?.descrizioneProblema || '')
  const [fotoProblema, setFotoProblema] = useState<string[]>(existing?.fotoProblema || [])
  const [showConfirm, setShowConfirm] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    if (isSupabaseConfigured) {
      setUploading(true)
      for (const file of Array.from(files)) {
        try {
          const path = `rilievi/${farmacia.id}/${fase}/${Date.now()}-${file.name}`
          const url = await uploadPhoto(file, path)
          setFoto(prev => [...prev, url])
        } catch (err) {
          console.error('Upload failed:', err)
        }
      }
      setUploading(false)
    } else {
      Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onload = () => setFoto(prev => [...prev, reader.result as string])
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
    if (fase === 2 && (!pezziRicevuti || !montaggioCompleto)) { alert('Completa la checklist.'); return }
    if (fase === 3 && !prodottiPosizionati) { alert('Conferma il posizionamento prodotti.'); return }
    setShowConfirm(true)
  }

  function confirmSave() {
    const fd = new FormData(document.getElementById('fase-form') as HTMLFormElement)
    const now = new Date()
    const rilievo: Rilievo = {
      id: existing?.id || `ril-${Date.now()}`,
      farmaciaId: farmacia.id,
      merchandiserId: userId,
      fase,
      completata: true,
      dataCompletamento: now.toISOString().split('T')[0],
      oraCompletamento: now.toTimeString().slice(0, 5),
      foto,
      note: fd.get('note') as string || '',
    }
    if (fase === 1) {
      rilievo.profonditaScaffale = parseFloat(fd.get('profonditaScaffale') as string) || 0
      rilievo.profonditaMensola = parseFloat(fd.get('profonditaMensola') as string) || 0
      rilievo.larghezza = parseFloat(fd.get('larghezza') as string) || 0
      rilievo.altezza = parseFloat(fd.get('altezza') as string) || 0
      rilievo.numScaffali = parseInt(fd.get('numScaffali') as string) || 0
    }
    if (fase === 2) {
      rilievo.pezziRicevuti = pezziRicevuti
      rilievo.montaggioCompleto = montaggioCompleto
      rilievo.kitRicevuto = kitRicevuto
      rilievo.problemaKit = problemaKit
      rilievo.descrizioneProblema = problemaKit ? descrizioneProblema : undefined
      rilievo.fotoProblema = problemaKit ? fotoProblema : undefined
    }
    if (fase === 3) { rilievo.prodottiPosizionati = prodottiPosizionati }
    onSave(rilievo)
  }

  const faseIcons = { 1: Ruler, 2: Wrench, 3: Package }
  const FaseIcon = faseIcons[fase]
  const faseColors = {
    1: { bg: 'bg-accent-600', light: 'bg-accent-50 border-accent-100', ring: 'ring-accent-200' },
    2: { bg: 'bg-brand-700', light: 'bg-brand-50 border-brand-100', ring: 'ring-brand-200' },
    3: { bg: 'bg-warning-500', light: 'bg-warning-50 border-warning-100', ring: 'ring-warning-200' },
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
      <div className="max-w-lg mx-auto space-y-4">
        <div className="card p-6 text-center">
          <div className="w-14 h-14 rounded-xl bg-success-50 border border-success-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-success-500" />
          </div>
          <h2 className="text-lg font-semibold text-brand-900 mb-1">Conferma completamento</h2>
          <p className="text-sm text-brand-500 mb-5">
            Fase {fase} per <b>{farmacia.nome}</b>
          </p>
          <div className="bg-brand-50 rounded-md p-3 mb-5 text-left text-xs text-brand-600 space-y-1 border border-brand-100">
            <p><b>Foto:</b> {foto.length} caricate</p>
            {fase === 1 && <p><b>Misure:</b> compilate</p>}
            {fase === 2 && (
              <>
                <p><b>Kit ricevuto:</b> {kitRicevuto ? 'Si' : 'No'}</p>
                <p><b>Montaggio:</b> {montaggioCompleto ? 'confermato' : 'da verificare'}</p>
                {problemaKit && <p className="text-danger-600"><b>Problema segnalato:</b> {descrizioneProblema || 'Si'}</p>}
              </>
            )}
            {fase === 3 && <p><b>Prodotti:</b> {prodottiPosizionati ? 'posizionati' : 'da verificare'}</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1 py-3">Torna indietro</button>
            <button onClick={confirmSave} className="btn-primary flex-1 py-3 bg-success-600 hover:bg-success-700">
              <Check size={16} /> Conferma
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <button onClick={onBack} className="btn-ghost -ml-3 text-brand-500">
        <ArrowLeft size={15} /> Torna alla scheda
      </button>

      {/* Header */}
      <div className={`card p-4 ${faseColors.light} border`}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${faseColors.bg} text-white`}>
            <FaseIcon size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-brand-900">Fase {fase} — {getLabelFase(fase)}</h2>
            <p className="text-xs text-brand-500">{farmacia.nome} — {farmacia.citta}</p>
          </div>
        </div>
      </div>

      <form id="fase-form" onSubmit={handleSubmit} className="space-y-4">

        {/* VERTICAL LAYOUT: Form left, Example right (Task 6) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left column: form fields */}
          <div className="md:order-1 space-y-4">
            {/* FASE 1: MISURE */}
            {fase === 1 && (
              <div className="card p-4 space-y-4">
                <div>
                  <h3 className="text-[13px] font-semibold text-brand-800 flex items-center gap-2">
                    <Ruler size={14} className="text-accent-500" /> Misure espositore
                  </h3>
                  <p className="text-[11px] text-brand-400 mt-0.5">Rileva tutte le misure in centimetri</p>
                </div>
                <div>
                  <label className="label">Profondita scaffale (cm) *</label>
                  <p className="text-[11px] text-brand-400 mb-1.5">Struttura esterna dell'espositore</p>
                  <input name="profonditaScaffale" type="number" step="0.1" inputMode="decimal" required defaultValue={existing?.profonditaScaffale || ''} className="input" placeholder="35" />
                </div>
                <div>
                  <label className="label">Profondita mensola (cm) *</label>
                  <p className="text-[11px] text-brand-400 mb-1.5">Ripiano interno, dove si appoggiano i prodotti</p>
                  <input name="profonditaMensola" type="number" step="0.1" inputMode="decimal" required defaultValue={existing?.profonditaMensola || ''} className="input" placeholder="30" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Larghezza (cm) *</label>
                    <input name="larghezza" type="number" step="0.1" inputMode="decimal" required defaultValue={existing?.larghezza || ''} className="input" placeholder="80" />
                  </div>
                  <div>
                    <label className="label">Altezza (cm) *</label>
                    <input name="altezza" type="number" step="0.1" inputMode="decimal" required defaultValue={existing?.altezza || ''} className="input" placeholder="200" />
                  </div>
                </div>
                <div>
                  <label className="label">Numero scaffali *</label>
                  <input name="numScaffali" type="number" inputMode="numeric" required min="1" max="20" defaultValue={existing?.numScaffali || ''} className="input" placeholder="5" />
                </div>
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
                  <label className="flex items-start gap-3 p-3 rounded-md border border-brand-100 cursor-pointer hover:bg-brand-50 transition-colors">
                    <input type="checkbox" checked={kitRicevuto} onChange={e => setKitRicevuto(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-brand-300 text-accent-600 focus:ring-accent-200" />
                    <div>
                      <p className="text-xs font-medium text-brand-800">Kit materiale ricevuto *</p>
                      <p className="text-[11px] text-brand-400">Conferma di aver ricevuto il kit con le elle di plexiglass</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-md border border-brand-100 cursor-pointer hover:bg-brand-50 transition-colors">
                    <input type="checkbox" checked={problemaKit} onChange={e => setProblemaKit(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-brand-300 text-danger-500 focus:ring-danger-200" />
                    <div>
                      <p className="text-xs font-medium text-brand-800">Segnala un problema</p>
                      <p className="text-[11px] text-brand-400">Pezzi mancanti, danneggiati o errati</p>
                    </div>
                  </label>
                  {problemaKit && (
                    <div className="space-y-3 pl-2 border-l-2 border-danger-200 ml-2">
                      <div>
                        <label className="label text-danger-600">Descrizione problema</label>
                        <textarea
                          value={descrizioneProblema}
                          onChange={e => setDescrizioneProblema(e.target.value)}
                          rows={2}
                          className="input resize-none"
                          placeholder="Es: Mancano 2 elle per prodotto X..."
                        />
                      </div>
                      <div>
                        <label className="label text-danger-600">Foto problema</label>
                        {fotoProblema.length > 0 && (
                          <div className="flex gap-1.5 mb-2">
                            {fotoProblema.map((f, i) => (
                              <img key={i} src={f} alt="" className="w-12 h-12 object-cover rounded border border-danger-100" />
                            ))}
                          </div>
                        )}
                        <label className="block cursor-pointer">
                          <div className="border border-dashed border-danger-200 rounded-md p-3 text-center hover:bg-danger-50 transition-colors">
                            <Camera size={16} className="mx-auto text-danger-400 mb-1" />
                            <p className="text-[11px] text-danger-500">Scatta foto del problema</p>
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
                  <label className="flex items-start gap-3 p-3 rounded-md border border-brand-100 cursor-pointer hover:bg-brand-50 transition-colors">
                    <input type="checkbox" checked={pezziRicevuti} onChange={e => setPezziRicevuti(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-brand-300 text-accent-600 focus:ring-accent-200" />
                    <div>
                      <p className="text-xs font-medium text-brand-800">Pezzi di plexiglass ricevuti</p>
                      <p className="text-[11px] text-brand-400">Kit completo, elle corrispondenti ai prodotti</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-md border border-brand-100 cursor-pointer hover:bg-brand-50 transition-colors">
                    <input type="checkbox" checked={montaggioCompleto} onChange={e => setMontaggioCompleto(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-brand-300 text-accent-600 focus:ring-accent-200" />
                    <div>
                      <p className="text-xs font-medium text-brand-800">Montaggio con biadesivo completato</p>
                      <p className="text-[11px] text-brand-400">Tutte le elle fissate, dritte e stabili</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* FASE 3: PRODOTTI */}
            {fase === 3 && (
              <div className="card p-4 space-y-3">
                <h3 className="text-[13px] font-semibold text-brand-800 flex items-center gap-2">
                  <Package size={14} className="text-warning-500" /> Caricamento prodotti
                </h3>
                <label className="flex items-start gap-3 p-3 rounded-md border border-brand-100 cursor-pointer hover:bg-brand-50 transition-colors">
                  <input type="checkbox" checked={prodottiPosizionati} onChange={e => setProdottiPosizionati(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-brand-300 text-accent-600 focus:ring-accent-200" />
                  <div>
                    <p className="text-xs font-medium text-brand-800">Tutti i prodotti posizionati</p>
                    <p className="text-[11px] text-brand-400">Ogni prodotto sullo scaffale corrispondente alla propria elle</p>
                  </div>
                </label>
                <div className="flex items-start gap-2 p-3 bg-accent-50 border border-accent-100 rounded-md">
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
                  className="w-full rounded-md border border-brand-100"
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
                className="w-full rounded-md border border-brand-100"
                style={fase === 3 && farmacia.planogrammaUrl ? { display: 'none' } : undefined}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                  const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
              {/* Fallback if image fails to load */}
              <div className="hidden flex-col items-center justify-center py-8 text-center bg-brand-50 rounded-md border border-brand-100">
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
                  <img src={f} alt="" className="w-full h-full object-cover rounded-md border border-brand-100" />
                  <button type="button" onClick={() => removePhoto(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-danger-500 text-white rounded-full flex items-center justify-center shadow-sm">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="block cursor-pointer">
            <div className={`border-2 border-dashed rounded-md p-5 text-center transition-colors ${
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
    <div className="space-y-4 max-w-lg mx-auto">
      <button onClick={onBack} className="btn-ghost -ml-3 text-brand-500">
        <ArrowLeft size={15} /> Torna alla lista
      </button>

      <div className="card p-5">
        <h2 className="text-lg font-semibold text-brand-900 flex items-center gap-2 mb-1">
          <FileText size={18} className="text-accent-600" /> Report giornaliero
        </h2>
        <p className="text-sm text-brand-400">{oggi} — {user.nome} {user.cognome}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-3 text-center">
          <p className="text-xl font-semibold text-success-600">{completate}</p>
          <p className="text-[11px] text-brand-500">Completate</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-semibold text-warning-500">{inCorso}</p>
          <p className="text-[11px] text-brand-500">In corso</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-semibold text-danger-500">{daFare}</p>
          <p className="text-[11px] text-brand-500">Da fare</p>
        </div>
        {inAttesa > 0 && (
          <div className="card p-3 text-center">
            <p className="text-xl font-semibold text-indigo-600">{inAttesa}</p>
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
                  <CheckCircle2 size={13} className="text-success-500 shrink-0" />
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
