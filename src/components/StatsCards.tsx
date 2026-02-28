import { Farmacia, Rilievo, getStatoFarmacia } from '../types'
import { Store, CheckCircle2, Clock, AlertCircle, TrendingUp, Pause } from 'lucide-react'

interface Props {
  farmacie: Farmacia[]
  rilievi: Rilievo[]
}

export default function StatsCards({ farmacie, rilievi }: Props) {
  const totale = farmacie.length
  const completate = farmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'completata').length
  const inCorso = farmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'in_corso').length
  const daFare = farmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'da_fare').length
  const inAttesa = farmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'in_attesa').length
  const percentuale = totale > 0 ? Math.round((completate / totale) * 100) : 0

  const cards = [
    { label: 'Totale farmacie', value: totale, icon: Store, color: 'text-accent-700', bg: 'bg-accent-50', border: 'border-accent-100' },
    { label: 'Completate', value: completate, icon: CheckCircle2, color: 'text-status-done-500', bg: 'bg-status-done-50', border: 'border-status-done-100' },
    { label: 'In corso', value: inCorso, icon: Clock, color: 'text-status-progress-500', bg: 'bg-status-progress-50', border: 'border-status-progress-100' },
    { label: 'Da fare', value: daFare, icon: AlertCircle, color: 'text-status-todo-600', bg: 'bg-status-todo-50', border: 'border-status-todo-100' },
    ...(inAttesa > 0 ? [{ label: 'In attesa materiale', value: inAttesa, icon: Pause, color: 'text-status-waiting-500', bg: 'bg-status-waiting-50', border: 'border-status-waiting-100' }] : []),
  ]

  return (
    <div className="space-y-4">
      <div className={`grid grid-cols-2 ${cards.length > 4 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3`}>
        {cards.map(c => {
          const Icon = c.icon
          return (
            <div key={c.label} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-sm ${c.bg} border ${c.border}`}>
                  <Icon size={16} className={c.color} />
                </div>
              </div>
              <p className="text-2xl font-heading font-bold text-brand-900 tracking-tight">{c.value}</p>
              <p className="text-xs text-brand-500 mt-0.5">{c.label}</p>
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-brand-500" />
            <span className="text-sm font-heading font-bold text-brand-700">Avanzamento complessivo</span>
          </div>
          <span className="text-sm font-heading font-bold text-brand-900">{percentuale}%</span>
        </div>
        <div className="w-full bg-brand-100 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-accent-500 transition-all duration-700 ease-out"
            style={{ width: `${percentuale}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-brand-400">{completate} di {totale} farmacie</p>
          <p className="text-xs text-brand-400">{daFare + inAttesa} rimanenti</p>
        </div>
      </div>
    </div>
  )
}
