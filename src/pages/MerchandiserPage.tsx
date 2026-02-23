import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import {
  Farmacia, Rilievo, FaseNumero, getStatoFarmacia, getColoreStato,
  getLabelStato, getLabelFase, getDescrizioneFase, getFaseCorrente,
} from '../types'
import {
  ArrowLeft, Camera, Check, ChevronRight, Lock, MapPin, Phone,
  Ruler, Upload, X, AlertTriangle, CheckCircle2, Info, ImagePlus, Package, Wrench,
} from 'lucide-react'

export default function MerchandiserPage() {
  const { user } = useAuth()
  const { farmacie, assegnazioni, rilievi } = useData()
  const [selectedFarmacia, setSelectedFarmacia] = useState<Farmacia | null>(null)

  if (!user) return null

  const mieAssegnazioni = assegnazioni.filter(a => a.merchandiserId === user.id)
  const mieFarmacie = farmacie.filter(f => mieAssegnazioni.some(a => a.farmaciaId === f.id))

  // Ordina: prima da fare, poi in corso, poi completate
  const ordineStato = { da_fare: 0, in_corso: 1, completata: 2 }
  const farmacieSorted = [...mieFarmacie].sort((a, b) => {
    const sa = getStatoFarmacia(rilievi, a.id)
    const sb = getStatoFarmacia(rilievi, b.id)
    return ordineStato[sa] - ordineStato[sb]
  })

  if (selectedFarmacia) {
    return (
      <FarmaciaDetail
        farmacia={selectedFarmacia}
        onBack={() => setSelectedFarmacia(null)}
      />
    )
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ciao, {user.nome}!</h1>
        <p className="text-gray-500">Hai {mieFarmacie.length} farmacie assegnate</p>
      </div>

      {/* Riepilogo veloce */}
      <div className="grid grid-cols-3 gap-3">
        {(['da_fare', 'in_corso', 'completata'] as const).map(stato => {
          const count = mieFarmacie.filter(f => getStatoFarmacia(rilievi, f.id) === stato).length
          return (
            <div key={stato} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <span className="inline-block w-3 h-3 rounded-full mb-1" style={{ backgroundColor: getColoreStato(stato) }} />
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs text-gray-500">{getLabelStato(stato)}</p>
            </div>
          )
        })}
      </div>

      {/* Lista farmacie */}
      <div className="space-y-3">
        {farmacieSorted.map(f => {
          const stato = getStatoFarmacia(rilievi, f.id)
          const fasiComplete = rilievi.filter(r => r.farmaciaId === f.id && r.completata).length
          const faseCorrente = getFaseCorrente(rilievi, f.id)
          const isCompletata = stato === 'completata'

          return (
            <button
              key={f.id}
              onClick={() => setSelectedFarmacia(f)}
              className={`w-full bg-white rounded-xl border p-4 text-left hover:shadow-sm transition ${
                isCompletata ? 'border-green-200 opacity-75' : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{f.nome}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={14} className="shrink-0" /> <span className="truncate">{f.indirizzo}, {f.citta}</span>
                  </p>
                  {!isCompletata && (
                    <p className="text-xs text-blue-600 font-medium mt-1.5">
                      Prossimo: Fase {faseCorrente} — {getLabelFase(faseCorrente)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <div className="text-right">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: getColoreStato(stato) + '20', color: getColoreStato(stato) }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getColoreStato(stato) }} />
                      {fasiComplete}/3
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </div>
              {/* Fasi progress bar */}
              <div className="flex gap-1.5 mt-3">
                {([1, 2, 3] as FaseNumero[]).map(fase => {
                  const done = rilievi.some(r => r.farmaciaId === f.id && r.fase === fase && r.completata)
                  return (
                    <div key={fase} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full h-2 rounded-full ${done ? 'bg-green-500' : 'bg-gray-200'}`} />
                      <span className={`text-[10px] ${done ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                        F{fase}
                      </span>
                    </div>
                  )
                })}
              </div>
            </button>
          )
        })}
      </div>

      {mieFarmacie.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-lg">Nessuna farmacia assegnata</p>
          <p className="text-sm">Contatta l'admin per ricevere le assegnazioni</p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// DETTAGLIO FARMACIA — mostra le 3 fasi con dettagli
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
    const prevDone = getRilievoFase((fase - 1) as FaseNumero)?.completata
    return !!prevDone
  }

  const stato = getStatoFarmacia(rilievi, farmacia.id)

  if (activeFase) {
    return (
      <FaseForm
        farmacia={farmacia}
        fase={activeFase}
        existing={getRilievoFase(activeFase)}
        onBack={() => setActiveFase(null)}
        onSave={(r) => {
          saveRilievo(r)
          setActiveFase(null)
        }}
        userId={user.id}
      />
    )
  }

  const faseIcons = { 1: Ruler, 2: Wrench, 3: Package }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
        <ArrowLeft size={16} /> Torna alla lista
      </button>

      {/* Header farmacia */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{farmacia.nome}</h2>
            <p className="text-gray-500 flex items-center gap-1 mt-1">
              <MapPin size={16} className="shrink-0" /> {farmacia.indirizzo}, {farmacia.citta} ({farmacia.provincia})
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
            style={{ backgroundColor: getColoreStato(stato) + '20', color: getColoreStato(stato) }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getColoreStato(stato) }} />
            {getLabelStato(stato)}
          </span>
        </div>
        <div className="flex gap-3 mt-3">
          {farmacia.telefono && (
            <a href={`tel:${farmacia.telefono}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
              <Phone size={14} /> Chiama
            </a>
          )}
          {farmacia.referente && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm">
              Ref: {farmacia.referente}
            </span>
          )}
        </div>
      </div>

      {/* Progress globale */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Avanzamento</p>
        <div className="flex gap-2">
          {([1, 2, 3] as FaseNumero[]).map((fase, i) => {
            const done = getRilievoFase(fase)?.completata
            const unlocked = isFaseUnlocked(fase)
            return (
              <div key={fase} className="flex-1 flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  done ? 'bg-green-500 text-white' :
                  unlocked ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {done ? <Check size={16} /> : fase}
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-0.5 mx-1 ${
                    getRilievoFase((fase + 1) as FaseNumero)?.completata || getRilievoFase(fase)?.completata ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 3 Fasi - cards dettagliate */}
      <div className="space-y-3">
        {([1, 2, 3] as FaseNumero[]).map(fase => {
          const rilievo = getRilievoFase(fase)
          const done = rilievo?.completata
          const unlocked = isFaseUnlocked(fase)
          const FaseIcon = faseIcons[fase]

          return (
            <div
              key={fase}
              className={`bg-white rounded-xl border-2 overflow-hidden transition ${
                done ? 'border-green-300' :
                unlocked ? 'border-blue-300' :
                'border-gray-200 opacity-50'
              }`}
            >
              {/* Header fase */}
              <div className={`px-4 py-3 ${
                done ? 'bg-green-50' : unlocked ? 'bg-blue-50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      done ? 'bg-green-500 text-white' :
                      unlocked ? 'bg-blue-500 text-white' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {done ? <CheckCircle2 size={22} /> : <FaseIcon size={20} />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Fase {fase} — {getLabelFase(fase)}</p>
                      <p className="text-xs text-gray-500">{getDescrizioneFase(fase)}</p>
                    </div>
                  </div>
                  {!unlocked && <Lock size={18} className="text-gray-300 shrink-0" />}
                </div>
              </div>

              {/* Corpo fase */}
              <div className="px-4 py-3">
                {/* Cosa fare - istruzioni */}
                {!done && unlocked && (
                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1 mb-2">
                        <Info size={12} /> Cosa devi fare
                      </p>
                      {fase === 1 && (
                        <ol className="text-sm text-amber-900 space-y-1.5 list-decimal list-inside">
                          <li>Individua l'espositore dedicato alla cosmetica</li>
                          <li>Misura la <b>profondita dello scaffale</b> (struttura esterna)</li>
                          <li>Misura la <b>profondita della mensola</b> (ripiano interno)</li>
                          <li>Misura <b>larghezza</b> e <b>altezza</b> complessive</li>
                          <li>Conta il <b>numero di scaffali/ripiani</b></li>
                          <li>Scatta <b>almeno una foto</b> dell'espositore attuale</li>
                        </ol>
                      )}
                      {fase === 2 && (
                        <ol className="text-sm text-amber-900 space-y-1.5 list-decimal list-inside">
                          <li>Verifica di aver ricevuto tutti i <b>pezzi di plexiglass</b></li>
                          <li>Ogni elle ha il <b>nome del prodotto</b> stampato</li>
                          <li>Applica il <b>biadesivo</b> sul retro di ogni elle</li>
                          <li><b>Attacca/appoggia</b> le elle sugli scaffali dell'espositore</li>
                          <li>Verifica che ogni pezzo sia <b>ben fissato e dritto</b></li>
                          <li>Scatta <b>almeno una foto</b> dell'espositore con plexiglass montato</li>
                        </ol>
                      )}
                      {fase === 3 && (
                        <ol className="text-sm text-amber-900 space-y-1.5 list-decimal list-inside">
                          <li>Verifica di aver ricevuto <b>tutti i prodotti</b></li>
                          <li>Posiziona ogni prodotto sullo <b>scaffale corrispondente</b> (segui le elle)</li>
                          <li>Verifica che l'espositore sia <b>completo e ordinato</b></li>
                          <li>Scatta <b>almeno una foto</b> del risultato finale</li>
                        </ol>
                      )}
                    </div>
                    <button
                      onClick={() => setActiveFase(fase)}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <Camera size={18} />
                      Inizia Fase {fase}
                    </button>
                  </div>
                )}

                {/* Fase bloccata */}
                {!done && !unlocked && (
                  <div className="flex items-center gap-2 text-gray-400 py-2">
                    <Lock size={14} />
                    <p className="text-sm">Completa la Fase {fase - 1} per sbloccare</p>
                  </div>
                )}

                {/* Fase completata - dettagli */}
                {done && rilievo && (
                  <div className="space-y-3">
                    {/* Timestamp */}
                    <div className="flex items-center gap-2 text-green-700 text-sm">
                      <CheckCircle2 size={14} />
                      <span>Completata il {rilievo.dataCompletamento}{rilievo.oraCompletamento ? ` alle ${rilievo.oraCompletamento}` : ''}</span>
                    </div>

                    {/* Misure fase 1 */}
                    {fase === 1 && (
                      <div className="grid grid-cols-2 gap-2">
                        <MisuraChip label="Prof. scaffale" value={rilievo.profonditaScaffale} unit="cm" />
                        <MisuraChip label="Prof. mensola" value={rilievo.profonditaMensola} unit="cm" />
                        <MisuraChip label="Larghezza" value={rilievo.larghezza} unit="cm" />
                        <MisuraChip label="Altezza" value={rilievo.altezza} unit="cm" />
                        <MisuraChip label="N. scaffali" value={rilievo.numScaffali} />
                      </div>
                    )}

                    {/* Checklist fase 2 */}
                    {fase === 2 && (
                      <div className="space-y-1">
                        <CheckItem checked={rilievo.pezziRicevuti} label="Pezzi plexiglass ricevuti" />
                        <CheckItem checked={rilievo.montaggioCompleto} label="Montaggio completato" />
                      </div>
                    )}

                    {/* Checklist fase 3 */}
                    {fase === 3 && (
                      <CheckItem checked={rilievo.prodottiPosizionati} label="Prodotti posizionati" />
                    )}

                    {/* Foto caricate */}
                    {rilievo.foto && rilievo.foto.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">{rilievo.foto.length} foto caricata/e</p>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {rilievo.foto.map((f, i) => (
                            <img key={i} src={f} alt={`Foto ${i + 1}`} className="w-20 h-20 object-cover rounded-lg shrink-0 border border-gray-200" />
                          ))}
                        </div>
                      </div>
                    )}
                    {(!rilievo.foto || rilievo.foto.length === 0) && (
                      <p className="text-xs text-gray-400 italic">Nessuna foto (demo)</p>
                    )}

                    {/* Note */}
                    {rilievo.note && (
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <p className="text-xs text-gray-500 mb-0.5">Note:</p>
                        <p className="text-sm text-gray-700">{rilievo.note}</p>
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
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-gray-900">
        {value ?? '—'}{unit && value ? ` ${unit}` : ''}
      </p>
    </div>
  )
}

function CheckItem({ checked, label }: { checked?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {checked ? (
        <CheckCircle2 size={16} className="text-green-500 shrink-0" />
      ) : (
        <AlertTriangle size={16} className="text-amber-500 shrink-0" />
      )}
      <span className={checked ? 'text-gray-700' : 'text-amber-700'}>{label}</span>
    </div>
  )
}

// ============================================================
// FORM FASE — compilazione effettiva di ogni fase
// ============================================================

function FaseForm({
  farmacia, fase, existing, onBack, onSave, userId
}: {
  farmacia: Farmacia
  fase: FaseNumero
  existing?: Rilievo
  onBack: () => void
  onSave: (r: Rilievo) => void
  userId: string
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

    // Validazione: almeno una foto richiesta
    if (foto.length === 0) {
      alert('Devi caricare almeno una foto prima di completare la fase.')
      return
    }

    // Validazione fase 2: checklist
    if (fase === 2 && (!pezziRicevuti || !montaggioCompleto)) {
      alert('Conferma di aver ricevuto i pezzi e completato il montaggio.')
      return
    }

    // Validazione fase 3: checklist
    if (fase === 3 && !prodottiPosizionati) {
      alert('Conferma di aver posizionato i prodotti.')
      return
    }

    setShowConfirm(true)
  }

  function confirmSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
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
    }

    if (fase === 3) {
      rilievo.prodottiPosizionati = prodottiPosizionati
    }

    onSave(rilievo)
  }

  const faseIcons = { 1: Ruler, 2: Wrench, 3: Package }
  const FaseIcon = faseIcons[fase]

  // Conferma finale overlay
  if (showConfirm) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-white rounded-xl border-2 border-green-300 p-6 text-center">
          <CheckCircle2 size={48} className="mx-auto text-green-500 mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-1">Conferma completamento</h2>
          <p className="text-gray-500 mb-4">
            Stai per completare la <b>Fase {fase}</b> per <b>{farmacia.nome}</b>.
            <br />Questa azione non puo essere annullata.
          </p>
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-left text-sm">
            <p className="text-gray-600"><b>Foto caricate:</b> {foto.length}</p>
            {fase === 1 && <p className="text-gray-600"><b>Misure:</b> compilate</p>}
            {fase === 2 && <p className="text-gray-600"><b>Montaggio:</b> {montaggioCompleto ? 'completato' : 'da verificare'}</p>}
            {fase === 3 && <p className="text-gray-600"><b>Prodotti:</b> {prodottiPosizionati ? 'posizionati' : 'da verificare'}</p>}
          </div>
          <form onSubmit={confirmSave} className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              Torna indietro
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <Check size={18} /> Conferma
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
        <ArrowLeft size={16} /> Torna alla scheda
      </button>

      {/* Header */}
      <div className={`rounded-xl p-4 ${
        fase === 1 ? 'bg-blue-50 border border-blue-200' :
        fase === 2 ? 'bg-purple-50 border border-purple-200' :
        'bg-orange-50 border border-orange-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            fase === 1 ? 'bg-blue-500' : fase === 2 ? 'bg-purple-500' : 'bg-orange-500'
          } text-white`}>
            <FaseIcon size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Fase {fase} — {getLabelFase(fase)}</h2>
            <p className="text-sm text-gray-600">{farmacia.nome} — {farmacia.citta}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form id="fase-form" onSubmit={handleSubmit} className="space-y-5">

        {/* ======================== FASE 1: MISURE ======================== */}
        {fase === 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
                <Ruler size={16} className="text-blue-500" /> Misure espositore
              </h3>
              <p className="text-xs text-gray-500">
                Rileva tutte le misure in centimetri dell'espositore dedicato alla cosmetica
              </p>
            </div>

            {/* Profondita scaffale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profondita scaffale (cm) *
              </label>
              <p className="text-xs text-gray-400 mb-1.5">La profondita della struttura esterna dell'espositore</p>
              <input
                name="profonditaScaffale"
                type="number"
                step="0.1"
                inputMode="decimal"
                required
                defaultValue={existing?.profonditaScaffale || ''}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="es. 35"
              />
            </div>

            {/* Profondita mensola */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profondita mensola (cm) *
              </label>
              <p className="text-xs text-gray-400 mb-1.5">La profondita del ripiano interno dove si appoggiano i prodotti</p>
              <input
                name="profonditaMensola"
                type="number"
                step="0.1"
                inputMode="decimal"
                required
                defaultValue={existing?.profonditaMensola || ''}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="es. 30"
              />
            </div>

            {/* Larghezza e Altezza */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Larghezza (cm) *
                </label>
                <input
                  name="larghezza"
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  required
                  defaultValue={existing?.larghezza || ''}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="es. 80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Altezza (cm) *
                </label>
                <input
                  name="altezza"
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  required
                  defaultValue={existing?.altezza || ''}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="es. 200"
                />
              </div>
            </div>

            {/* Numero scaffali */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numero scaffali/ripiani *
              </label>
              <p className="text-xs text-gray-400 mb-1.5">Quanti ripiani ha l'espositore dedicato</p>
              <input
                name="numScaffali"
                type="number"
                inputMode="numeric"
                required
                min="1"
                max="20"
                defaultValue={existing?.numScaffali || ''}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="es. 5"
              />
            </div>
          </div>
        )}

        {/* ======================== FASE 2: MONTAGGIO ======================== */}
        {fase === 2 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
                <Wrench size={16} className="text-purple-500" /> Checklist montaggio
              </h3>
              <p className="text-xs text-gray-500">
                Conferma ogni passaggio prima di completare la fase
              </p>
            </div>

            {/* Checklist items */}
            <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                checked={pezziRicevuti}
                onChange={e => setPezziRicevuti(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Ho ricevuto tutti i pezzi di plexiglass</p>
                <p className="text-xs text-gray-500">Verifica che il kit sia completo e che le elle corrispondano ai prodotti</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                checked={montaggioCompleto}
                onChange={e => setMontaggioCompleto(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Montaggio completato con biadesivo</p>
                <p className="text-xs text-gray-500">Tutte le elle sono state attaccate sull'espositore, ben dritte e fissate</p>
              </div>
            </label>

            {!pezziRicevuti && !montaggioCompleto && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">
                  Se non hai ricevuto i pezzi o c'e un problema col montaggio, segnalalo nelle note e contatta l'admin.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ======================== FASE 3: PRODOTTI ======================== */}
        {fase === 3 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
                <Package size={16} className="text-orange-500" /> Caricamento prodotti
              </h3>
              <p className="text-xs text-gray-500">
                Posiziona i prodotti sugli scaffali seguendo le indicazioni delle elle
              </p>
            </div>

            <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <input
                type="checkbox"
                checked={prodottiPosizionati}
                onChange={e => setProdottiPosizionati(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Tutti i prodotti sono stati posizionati</p>
                <p className="text-xs text-gray-500">Ogni prodotto e sullo scaffale corrispondente alla propria elle di plexiglass</p>
              </div>
            </label>

            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-800">
                Questa e l'ultima fase. La foto deve mostrare l'espositore completo con tutti i prodotti posizionati. Sara visibile al cliente.
              </p>
            </div>
          </div>
        )}

        {/* ======================== FOTO ======================== */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <Camera size={16} /> Documentazione fotografica
            </h3>
            <p className="text-xs text-gray-500">
              {fase === 1 && 'Foto dell\'espositore vuoto con misure visibili — minimo 1 foto'}
              {fase === 2 && 'Foto dell\'espositore con le elle di plexiglass montate — minimo 1 foto'}
              {fase === 3 && 'Foto dell\'espositore completo con prodotti posizionati (risultato finale) — minimo 1 foto'}
            </p>
          </div>

          {/* Griglia foto caricate */}
          {foto.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {foto.map((f, i) => (
                <div key={i} className="relative aspect-square">
                  <img src={f} alt={`Foto ${i + 1}`} className="w-full h-full object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                  >
                    <X size={12} />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Bottone aggiungi foto */}
          <label className="block cursor-pointer">
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
              foto.length === 0
                ? 'border-blue-300 bg-blue-50/50 hover:bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}>
              {foto.length === 0 ? (
                <>
                  <Camera size={36} className="mx-auto text-blue-400 mb-2" />
                  <p className="text-sm font-medium text-blue-700">Scatta o carica foto</p>
                  <p className="text-xs text-blue-500">Tocca per aprire la fotocamera</p>
                </>
              ) : (
                <>
                  <ImagePlus size={24} className="mx-auto text-gray-400 mb-1" />
                  <p className="text-sm text-gray-600">Aggiungi altra foto</p>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={handlePhoto}
            />
          </label>

          {foto.length > 0 && (
            <p className="text-xs text-gray-500 text-center">{foto.length} foto caricata/e</p>
          )}
        </div>

        {/* ======================== NOTE ======================== */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note e segnalazioni
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Segnala eventuali problemi, pezzi mancanti, danni all'espositore o altre anomalie
          </p>
          <textarea
            name="note"
            rows={3}
            defaultValue={existing?.note || ''}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder={
              fase === 1 ? 'Es: Espositore in buono stato, un ripiano leggermente storto...' :
              fase === 2 ? 'Es: Pezzo mancante per prodotto X, biadesivo debole su scaffale 3...' :
              'Es: Prodotto Y esaurito, posizionati tutti gli altri correttamente...'
            }
          />
        </div>

        {/* ======================== SUBMIT ======================== */}
        <button
          type="submit"
          className={`w-full py-4 rounded-xl font-medium text-lg transition flex items-center justify-center gap-2 shadow-lg ${
            fase === 1 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' :
            fase === 2 ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200' :
            'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200'
          }`}
        >
          <Check size={22} />
          Completa Fase {fase} — {getLabelFase(fase)}
        </button>
      </form>
    </div>
  )
}
