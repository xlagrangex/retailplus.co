import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { RegistrazionePending } from '../types'
import { ArrowLeft, CheckCircle, Upload } from 'lucide-react'

export default function RegisterPage() {
  const { submitRegistrazione } = useData()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setFotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)

    const reg: RegistrazionePending = {
      id: `reg-${Date.now()}`,
      email: (fd.get('email') as string).toLowerCase().trim(),
      nome: fd.get('nome') as string,
      cognome: fd.get('cognome') as string,
      telefono: fd.get('telefono') as string,
      codiceFiscale: (fd.get('codiceFiscale') as string).toUpperCase().trim(),
      indirizzo: fd.get('indirizzo') as string,
      citta: fd.get('citta') as string,
      provincia: fd.get('provincia') as string,
      partitaIva: (fd.get('partitaIva') as string) || undefined,
      iban: (fd.get('iban') as string) || undefined,
      fotoDocumento: fotoPreview || undefined,
      note: (fd.get('note') as string) || undefined,
      stato: 'pending',
      dataRichiesta: new Date().toISOString(),
    }

    submitRegistrazione(reg)
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f7f9fc' }}>
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-status-done-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-status-done-600" />
          </div>
          <h2 className="text-xl font-heading font-bold text-brand-900 mb-3">Richiesta inviata!</h2>
          <p className="text-sm text-brand-500 mb-6 leading-relaxed">
            La tua richiesta di registrazione è stata inviata con successo.<br />
            Riceverai una email quando l'amministratore avrà approvato il tuo account.
          </p>
          <Link to="/" className="btn-primary inline-flex">
            <ArrowLeft size={15} /> Torna al login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding (same as login) */}
      <div className="hidden lg:flex lg:w-[440px] flex-col justify-between p-12 relative overflow-hidden" style={{ backgroundColor: '#273E3A' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <img src="/Retaillogobianco.png" alt="Retail+" className="h-20" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-white leading-tight mb-4">
            Diventa Merchandiser
          </h1>
          <p className="text-base leading-relaxed max-w-sm" style={{ color: '#a0bfb9' }}>
            Registrati per entrare nel team di merchandiser Retail+.
            Compila il form e attendi l'approvazione dell'amministratore.
          </p>
        </div>
        <div className="relative">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#329083', color: 'white' }}>1</div>
              <p className="text-sm text-white/80">Compila il form di registrazione</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-white/10 text-white/60">2</div>
              <p className="text-sm text-white/50">Attendi l'approvazione dell'admin</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-white/10 text-white/60">3</div>
              <p className="text-sm text-white/50">Ricevi l'email di conferma e accedi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - registration form */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-12 bg-white">
        <div className="w-full max-w-[520px] mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src="/Retaillogo.png" alt="Retail+" className="h-10" />
          </div>

          <div className="mb-6">
            <Link to="/" className="text-sm text-accent-600 hover:text-accent-700 flex items-center gap-1 mb-4">
              <ArrowLeft size={14} /> Torna al login
            </Link>
            <h2 className="text-xl font-heading font-bold text-brand-900">Registrazione Merchandiser</h2>
            <p className="text-sm text-brand-500 mt-1">Compila tutti i campi obbligatori (*) per inviare la richiesta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Dati personali */}
            <div>
              <h3 className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-3">Dati personali</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nome *</label>
                  <input name="nome" required className="input" placeholder="Mario" />
                </div>
                <div>
                  <label className="label">Cognome *</label>
                  <input name="cognome" required className="input" placeholder="Rossi" />
                </div>
                <div className="col-span-2">
                  <label className="label">Email *</label>
                  <input name="email" type="email" required className="input" placeholder="mario.rossi@email.it" />
                </div>
                <div>
                  <label className="label">Telefono *</label>
                  <input name="telefono" type="tel" required className="input" placeholder="+39 333 1234567" />
                </div>
                <div>
                  <label className="label">Codice Fiscale *</label>
                  <input name="codiceFiscale" required className="input" placeholder="RSSMRA80A01H501Z" maxLength={16} style={{ textTransform: 'uppercase' }} />
                </div>
              </div>
            </div>

            {/* Indirizzo */}
            <div>
              <h3 className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-3">Indirizzo</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Indirizzo *</label>
                  <input name="indirizzo" required className="input" placeholder="Via Roma 1" />
                </div>
                <div>
                  <label className="label">Citta *</label>
                  <input name="citta" required className="input" placeholder="Roma" />
                </div>
                <div>
                  <label className="label">Provincia *</label>
                  <input name="provincia" required className="input" placeholder="RM" />
                </div>
              </div>
            </div>

            {/* Dati fiscali */}
            <div>
              <h3 className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-3">Dati fiscali (opzionali)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Partita IVA</label>
                  <input name="partitaIva" className="input" placeholder="01234567890" />
                </div>
                <div>
                  <label className="label">IBAN</label>
                  <input name="iban" className="input" placeholder="IT60X0542811101000000123456" />
                </div>
              </div>
            </div>

            {/* Documento */}
            <div>
              <h3 className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-3">Documento d'identita</h3>
              <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-brand-200 rounded-md cursor-pointer hover:border-accent-400 hover:bg-accent-50/30 transition-colors">
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Anteprima documento" className="max-h-32 rounded" />
                ) : (
                  <>
                    <Upload size={24} className="text-brand-400" />
                    <span className="text-sm text-brand-500">Carica foto del documento</span>
                    <span className="text-xs text-brand-400">JPG, PNG — max 5MB</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
              </label>
            </div>

            {/* Note */}
            <div>
              <label className="label">Note o messaggio (opzionale)</label>
              <textarea name="note" className="input" rows={3} placeholder="Inserisci eventuali note o un messaggio per l'amministratore..." />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Invio in corso...' : 'Invia richiesta di registrazione'}
            </button>

            <p className="text-xs text-brand-400 text-center">
              Inviando la richiesta acconsenti al trattamento dei tuoi dati personali.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
