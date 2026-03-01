import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../components/Toast'
import { isSupabaseConfigured, uploadPhoto } from '../lib/supabase'
import { Save, Camera, X } from 'lucide-react'

export default function MerchandiserProfiloPage() {
  const { user, updateCurrentUser } = useAuth()
  const { updateUser } = useData()
  const { showToast } = useToast()

  const [nome, setNome] = useState(user?.nome || '')
  const [cognome, setCognome] = useState(user?.cognome || '')
  const [telefono, setTelefono] = useState(user?.telefono || '')
  const [codiceFiscale, setCodiceFiscale] = useState(user?.codiceFiscale || '')
  const [indirizzo, setIndirizzo] = useState(user?.indirizzo || '')
  const [citta, setCitta] = useState(user?.citta || '')
  const [provincia, setProvincia] = useState(user?.provincia || '')
  const [partitaIva, setPartitaIva] = useState(user?.partitaIva || '')
  const [iban, setIban] = useState(user?.iban || '')
  const [fotoDocumento, setFotoDocumento] = useState(user?.fotoDocumento || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  if (!user) return null

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    if (isSupabaseConfigured) {
      try {
        const url = await uploadPhoto(file, `doc-${user!.id}`)
        setFotoDocumento(url)
      } catch (err) {
        console.error('Upload failed:', err)
        showToast('Errore durante il caricamento')
      }
    } else {
      const reader = new FileReader()
      reader.onload = () => setFotoDocumento(reader.result as string)
      reader.readAsDataURL(file)
    }
    setUploading(false)
    e.target.value = ''
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !cognome.trim()) {
      showToast('Nome e cognome sono obbligatori')
      return
    }

    setSaving(true)
    const updates = {
      nome: nome.trim(),
      cognome: cognome.trim(),
      telefono: telefono.trim() || undefined,
      codiceFiscale: codiceFiscale.trim() || undefined,
      indirizzo: indirizzo.trim() || undefined,
      citta: citta.trim() || undefined,
      provincia: provincia.trim() || undefined,
      partitaIva: partitaIva.trim() || undefined,
      iban: iban.trim() || undefined,
      fotoDocumento: fotoDocumento || undefined,
    }

    updateUser(user!.id, updates)
    updateCurrentUser(updates)
    setSaving(false)
    showToast('Profilo aggiornato con successo')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="page-title">Il mio profilo</h1>
        <p className="page-subtitle">Modifica i tuoi dati personali</p>
      </div>

      <form onSubmit={handleSave} className="card p-5 space-y-5">
        {/* Personal info */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Dati personali</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-brand-500 font-medium mb-1 block">Nome *</label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
                className="input"
              />
            </div>
            <div>
              <label className="text-[11px] text-brand-500 font-medium mb-1 block">Cognome *</label>
              <input
                type="text"
                value={cognome}
                onChange={e => setCognome(e.target.value)}
                required
                className="input"
              />
            </div>
            <div>
              <label className="text-[11px] text-brand-500 font-medium mb-1 block">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="input bg-brand-50 text-brand-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-[11px] text-brand-500 font-medium mb-1 block">Telefono</label>
              <input
                type="text"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                placeholder="Numero di telefono"
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Fiscal info */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Dati fiscali e residenza</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-brand-500 font-medium mb-1 block">Codice Fiscale</label>
              <input
                type="text"
                value={codiceFiscale}
                onChange={e => setCodiceFiscale(e.target.value.toUpperCase())}
                placeholder="RSSMRA85T10A562S"
                className="input font-mono"
                maxLength={16}
              />
            </div>
            <div>
              <label className="text-[11px] text-brand-500 font-medium mb-1 block">Partita IVA</label>
              <input
                type="text"
                value={partitaIva}
                onChange={e => setPartitaIva(e.target.value)}
                placeholder="12345678901"
                className="input font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] text-brand-500 font-medium mb-1 block">Indirizzo</label>
              <input
                type="text"
                value={indirizzo}
                onChange={e => setIndirizzo(e.target.value)}
                placeholder="Via Roma, 1"
                className="input"
              />
            </div>
            <div>
              <label className="text-[11px] text-brand-500 font-medium mb-1 block">Citta</label>
              <input
                type="text"
                value={citta}
                onChange={e => setCitta(e.target.value)}
                placeholder="Roma"
                className="input"
              />
            </div>
            <div>
              <label className="text-[11px] text-brand-500 font-medium mb-1 block">Provincia</label>
              <input
                type="text"
                value={provincia}
                onChange={e => setProvincia(e.target.value.toUpperCase())}
                placeholder="RM"
                className="input"
                maxLength={2}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] text-brand-500 font-medium mb-1 block">IBAN</label>
              <input
                type="text"
                value={iban}
                onChange={e => setIban(e.target.value.toUpperCase())}
                placeholder="IT60X0542811101000000123456"
                className="input font-mono"
              />
            </div>
          </div>
        </div>

        {/* Document photo */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Documento d'identita</h3>
          {fotoDocumento ? (
            <div className="relative inline-block">
              <img src={fotoDocumento} alt="Documento" className="max-h-48 rounded-md border border-brand-200" />
              <button
                type="button"
                onClick={() => setFotoDocumento('')}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center text-brand-500 hover:text-brand-700 shadow-sm"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <label className="btn-secondary cursor-pointer inline-flex">
              {uploading ? (
                <div className="w-4 h-4 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={14} />
              )}
              Carica foto documento
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          )}
        </div>

        {/* Save */}
        <div className="pt-3 border-t border-brand-100">
          <button type="submit" disabled={saving} className="btn-primary">
            <Save size={14} />
            {saving ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </div>
      </form>
    </div>
  )
}
