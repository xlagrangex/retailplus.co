import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Farmacia, Rilievo, FaseNumero, getStatoFarmacia, getColoreStato, getLabelStato, getLabelFase } from '../types'
import { ArrowLeft, Camera, Check, Lock, MapPin, Phone, Ruler, Upload } from 'lucide-react'

export default function MerchandiserPage() {
  const { user } = useAuth()
  const { farmacie, assegnazioni, rilievi } = useData()
  const [selectedFarmacia, setSelectedFarmacia] = useState<Farmacia | null>(null)

  if (!user) return null

  const mieAssegnazioni = assegnazioni.filter(a => a.merchandiserId === user.id)
  const mieFarmacie = farmacie.filter(f => mieAssegnazioni.some(a => a.farmaciaId === f.id))

  if (selectedFarmacia) {
    return (
      <FarmaciaDetail
        farmacia={selectedFarmacia}
        onBack={() => setSelectedFarmacia(null)}
      />
    )
  }

  return (
    <div className="space-y-4">
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
        {mieFarmacie.map(f => {
          const stato = getStatoFarmacia(rilievi, f.id)
          const fasiComplete = rilievi.filter(r => r.farmaciaId === f.id && r.completata).length
          return (
            <button
              key={f.id}
              onClick={() => setSelectedFarmacia(f)}
              className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-blue-300 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{f.nome}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={14} /> {f.indirizzo}, {f.citta}
                  </p>
                  {f.telefono && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone size={14} /> {f.telefono}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: getColoreStato(stato) + '20', color: getColoreStato(stato) }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getColoreStato(stato) }} />
                    {getLabelStato(stato)}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{fasiComplete}/3 fasi</p>
                </div>
              </div>
              {/* Fasi mini indicators */}
              <div className="flex gap-2 mt-3">
                {([1, 2, 3] as FaseNumero[]).map(fase => {
                  const done = rilievi.some(r => r.farmaciaId === f.id && r.fase === fase && r.completata)
                  return (
                    <div
                      key={fase}
                      className={`flex-1 h-1.5 rounded-full ${done ? 'bg-green-500' : 'bg-gray-200'}`}
                    />
                  )
                })}
              </div>
            </button>
          )
        })}
      </div>

      {mieFarmacie.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">Nessuna farmacia assegnata</p>
          <p className="text-sm">Contatta l'admin per ricevere le assegnazioni</p>
        </div>
      )}
    </div>
  )
}

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

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
        <ArrowLeft size={16} /> Torna alla lista
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-xl font-bold text-gray-900">{farmacia.nome}</h2>
        <p className="text-gray-500 flex items-center gap-1 mt-1">
          <MapPin size={16} /> {farmacia.indirizzo}, {farmacia.citta} ({farmacia.provincia})
        </p>
        {farmacia.telefono && (
          <a href={`tel:${farmacia.telefono}`} className="text-blue-600 text-sm flex items-center gap-1 mt-1">
            <Phone size={14} /> {farmacia.telefono}
          </a>
        )}
        {farmacia.referente && (
          <p className="text-sm text-gray-500 mt-1">Referente: {farmacia.referente}</p>
        )}
      </div>

      {/* 3 Fasi */}
      <div className="space-y-3">
        {([1, 2, 3] as FaseNumero[]).map(fase => {
          const rilievo = getRilievoFase(fase)
          const done = rilievo?.completata
          const unlocked = isFaseUnlocked(fase)

          return (
            <div
              key={fase}
              className={`bg-white rounded-xl border-2 p-4 transition ${
                done ? 'border-green-300 bg-green-50/50' :
                unlocked ? 'border-blue-300 bg-blue-50/30' :
                'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    done ? 'bg-green-500 text-white' :
                    unlocked ? 'bg-blue-500 text-white' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {done ? <Check size={20} /> : fase}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{getLabelFase(fase)}</p>
                    <p className="text-xs text-gray-500">
                      {done ? `Completata il ${rilievo?.dataCompletamento}` :
                       unlocked ? 'Pronta per essere completata' :
                       'Completa la fase precedente'}
                    </p>
                  </div>
                </div>
                {!done && unlocked && (
                  <button
                    onClick={() => setActiveFase(fase)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Inizia
                  </button>
                )}
                {!unlocked && <Lock size={18} className="text-gray-300" />}
              </div>

              {/* Dettagli se completata */}
              {done && rilievo && fase === 1 && (
                <div className="mt-3 pt-3 border-t border-green-200 grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Profondita:</span> <span className="font-medium">{rilievo.profondita} cm</span></div>
                  <div><span className="text-gray-500">Larghezza:</span> <span className="font-medium">{rilievo.larghezza} cm</span></div>
                  <div><span className="text-gray-500">Altezza:</span> <span className="font-medium">{rilievo.altezza} cm</span></div>
                  <div><span className="text-gray-500">Scaffali:</span> <span className="font-medium">{rilievo.numScaffali}</span></div>
                </div>
              )}
              {done && rilievo?.note && (
                <p className="mt-2 text-sm text-gray-600 italic">"{rilievo.note}"</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

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
  const [fotoPreview, setFotoPreview] = useState<string | null>(existing?.fotoUrl || null)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setFotoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const rilievo: Rilievo = {
      id: existing?.id || `ril-${Date.now()}`,
      farmaciaId: farmacia.id,
      merchandiserId: userId,
      fase,
      completata: true,
      dataCompletamento: new Date().toISOString().split('T')[0],
      fotoUrl: fotoPreview || '',
      note: fd.get('note') as string || '',
    }
    if (fase === 1) {
      rilievo.profondita = parseFloat(fd.get('profondita') as string) || 0
      rilievo.larghezza = parseFloat(fd.get('larghezza') as string) || 0
      rilievo.altezza = parseFloat(fd.get('altezza') as string) || 0
      rilievo.numScaffali = parseInt(fd.get('numScaffali') as string) || 0
    }
    onSave(rilievo)
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
        <ArrowLeft size={16} /> Torna alla scheda
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
            {fase}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Fase {fase} — {getLabelFase(fase)}</h2>
            <p className="text-sm text-gray-500">{farmacia.nome}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fase 1: Misure */}
          {fase === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Ruler size={16} /> Misure espositore
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Profondita (cm) *</label>
                  <input
                    name="profondita"
                    type="number"
                    required
                    defaultValue={existing?.profondita || ''}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="es. 35"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Larghezza (cm) *</label>
                  <input
                    name="larghezza"
                    type="number"
                    required
                    defaultValue={existing?.larghezza || ''}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="es. 80"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Altezza (cm) *</label>
                  <input
                    name="altezza"
                    type="number"
                    required
                    defaultValue={existing?.altezza || ''}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="es. 200"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">N. Scaffali *</label>
                  <input
                    name="numScaffali"
                    type="number"
                    required
                    defaultValue={existing?.numScaffali || ''}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="es. 5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Upload foto */}
          <div>
            <p className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
              <Camera size={16} />
              {fase === 1 ? 'Foto espositore vuoto' :
               fase === 2 ? 'Foto plexiglass montato' :
               'Foto prodotti posizionati'}
            </p>
            <label className="block">
              {fotoPreview ? (
                <div className="relative">
                  <img src={fotoPreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setFotoPreview(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs"
                  >
                    Rimuovi
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition">
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Tocca per scattare o caricare foto</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhoto}
              />
            </label>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Note (opzionale)</label>
            <textarea
              name="note"
              rows={3}
              defaultValue={existing?.note || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Eventuali problemi o segnalazioni..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium text-base hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
            <Check size={20} />
            Completa Fase {fase}
          </button>
        </form>
      </div>
    </div>
  )
}
