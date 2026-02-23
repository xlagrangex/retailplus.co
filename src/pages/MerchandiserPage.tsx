import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import {
  Farmacia, Rilievo, FaseNumero, getStatoFarmacia, getColoreStato,
  getLabelStato, getLabelFase, getDescrizioneFase, getFaseCorrente,
} from '../types'
import {
  ArrowLeft, Camera, Check, ChevronRight, Lock, MapPin, Phone,
  Ruler, X, AlertTriangle, CheckCircle2, Info, ImagePlus, Package, Wrench,
} from 'lucide-react'

// Colori corporate per stati
const statoConfig = {
  da_fare: { dot: '#d64545', bg: 'bg-danger-50', text: 'text-danger-600', border: 'border-danger-100' },
  in_corso: { dot: '#de911d', bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-100' },
  completata: { dot: '#3f9142', bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-100' },
}

export default function MerchandiserPage() {
  const { user } = useAuth()
  const { farmacie, assegnazioni, rilievi } = useData()
  const [selectedFarmacia, setSelectedFarmacia] = useState<Farmacia | null>(null)

  if (!user) return null

  const mieAssegnazioni = assegnazioni.filter(a => a.merchandiserId === user.id)
  const mieFarmacie = farmacie.filter(f => mieAssegnazioni.some(a => a.farmaciaId === f.id))

  const ordineStato = { da_fare: 0, in_corso: 1, completata: 2 }
  const farmacieSorted = [...mieFarmacie].sort((a, b) => {
    const sa = getStatoFarmacia(rilievi, a.id)
    const sb = getStatoFarmacia(rilievi, b.id)
    return ordineStato[sa] - ordineStato[sb]
  })

  if (selectedFarmacia) {
    return <FarmaciaDetail farmacia={selectedFarmacia} onBack={() => setSelectedFarmacia(null)} />
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="page-title">Ciao, {user.nome}</h1>
        <p className="page-subtitle">{mieFarmacie.length} farmacie assegnate</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(['da_fare', 'in_corso', 'completata'] as const).map(stato => {
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
// DETTAGLIO FARMACIA
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
        {(farmacia.telefono || farmacia.referente) && (
          <div className="flex gap-2 mt-3">
            {farmacia.telefono && (
              <a href={`tel:${farmacia.telefono}`} className="btn-secondary text-xs py-1.5">
                <Phone size={13} /> {farmacia.telefono}
              </a>
            )}
            {farmacia.referente && (
              <span className="badge bg-brand-50 text-brand-600 border border-brand-100">
                Ref: {farmacia.referente}
              </span>
            )}
          </div>
        )}
      </div>

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
                        <CheckItem checked={rilievo.pezziRicevuti} label="Pezzi ricevuti" />
                        <CheckItem checked={rilievo.montaggioCompleto} label="Montaggio completato" />
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
// FORM FASE
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
  const [showConfirm, setShowConfirm] = useState(false)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = () => setFoto(prev => [...prev, reader.result as string])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function removePhoto(index: number) {
    setFoto(prev => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (foto.length === 0) { alert('Carica almeno una foto.'); return }
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
    if (fase === 2) { rilievo.pezziRicevuti = pezziRicevuti; rilievo.montaggioCompleto = montaggioCompleto }
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
            {fase === 2 && <p><b>Montaggio:</b> {montaggioCompleto ? 'confermato' : 'da verificare'}</p>}
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

        {/* FASE 2: MONTAGGIO */}
        {fase === 2 && (
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
              {foto.length === 0 ? (
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
            <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhoto} />
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
        <button type="submit" className="btn-primary w-full py-3.5 text-base shadow-elevated">
          <Check size={18} /> Completa Fase {fase}
        </button>
      </form>
    </div>
  )
}
