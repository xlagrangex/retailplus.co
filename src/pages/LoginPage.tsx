import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { ArrowRight, Eye, EyeOff, Shield, Users, BarChart3 } from 'lucide-react'

const demoAccounts = [
  { email: 'admin@logplus.it', label: 'Amministratore', desc: 'Gestione completa', icon: Shield },
  { email: 'brand@cosmetica.it', label: 'Cliente Brand', desc: 'Dashboard e reportistica', icon: BarChart3 },
  { email: 'anna@logplus.it', label: 'Merchandiser', desc: 'Operativita sul campo', icon: Users },
]

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const ok = await login(email, password)
    if (!ok) {
      setError('Credenziali non valide. Verifica email e password.')
    }
    setLoading(false)
  }

  async function quickLogin(demoEmail: string) {
    setLoading(true)
    const ok = await login(demoEmail, 'demo')
    if (!ok) {
      setError('Errore di accesso')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[480px] bg-brand-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/10 backdrop-blur rounded flex items-center justify-center border border-white/20">
              <span className="font-bold text-lg">LF</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">LogPlus Farma</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-4">
            Piattaforma di gestione<br />allestimenti cosmetici
          </h1>
          <p className="text-brand-300 text-base leading-relaxed max-w-sm">
            Coordina il rollout di espositori cosmetici su centinaia di farmacie.
            Traccia ogni fase, dalla rilevazione al completamento.
          </p>
        </div>
        <div className="relative space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-accent-200 font-semibold text-sm">500</span>
            </div>
            <div>
              <p className="text-sm font-medium">Farmacie</p>
              <p className="text-xs text-brand-400">Copertura nazionale</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-accent-200 font-semibold text-sm">3</span>
            </div>
            <div>
              <p className="text-sm font-medium">Fasi operative</p>
              <p className="text-xs text-brand-400">Rilievo, montaggio, completamento</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-success-400 font-semibold text-sm">RT</span>
            </div>
            <div>
              <p className="text-sm font-medium">Monitoraggio in tempo reale</p>
              <p className="text-xs text-brand-400">Dashboard e mappa interattiva</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 bg-brand-900 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">LF</span>
            </div>
            <span className="font-semibold text-brand-900 tracking-tight">LogPlus Farma</span>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-brand-900">Accedi alla piattaforma</h2>
            <p className="text-sm text-brand-500 mt-1">Inserisci le tue credenziali per continuare</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="nome@azienda.it"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="Inserisci password"
                  required
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600 transition">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-100 rounded-sm">
                <p className="text-danger-600 text-sm">{error}</p>
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Accesso in corso...' : 'Accedi'} {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Demo access */}
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-brand-100" />
              <span className="text-xs text-brand-400 font-medium uppercase tracking-wider">Accesso demo</span>
              <div className="h-px flex-1 bg-brand-100" />
            </div>
            <div className="space-y-2">
              {demoAccounts.map(acc => {
                const Icon = acc.icon
                return (
                  <button
                    type="button"
                    key={acc.email}
                    onClick={() => quickLogin(acc.email)}
                    disabled={loading}
                    className="w-full text-left px-4 py-3 rounded-sm border border-brand-100 hover:border-accent-200 hover:bg-accent-50/50 transition-all duration-150 flex items-center gap-3 group disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded bg-brand-50 group-hover:bg-accent-50 flex items-center justify-center transition-colors">
                      <Icon size={15} className="text-brand-500 group-hover:text-accent-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-800">{acc.label}</p>
                      <p className="text-xs text-brand-400">{acc.desc}</p>
                    </div>
                    <ArrowRight size={14} className="text-brand-300 group-hover:text-accent-500 transition-colors" />
                  </button>
                )
              })}
            </div>
          </div>

          <p className="text-center text-xs text-brand-400 mt-8">
            LogPlus Farma v1.0 — Ambiente demo
          </p>
        </div>
      </div>
    </div>
  )
}
