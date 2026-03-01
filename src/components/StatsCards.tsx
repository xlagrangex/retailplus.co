import { Farmacia, Rilievo, Sopralluogo, getStatoFarmacia } from '../types'
import { Store, CheckCircle2, Clock, AlertCircle, TrendingUp, Play, Wrench, Package } from 'lucide-react'

interface Props {
  farmacie: Farmacia[]
  rilievi: Rilievo[]
  sopralluoghi?: Sopralluogo[]
}

export default function StatsCards({ farmacie, rilievi, sopralluoghi = [] }: Props) {
  const totale = farmacie.length
  const assegnati = farmacie.filter(f => getStatoFarmacia(rilievi, f.id, sopralluoghi) === 'assegnato').length
  const fase1 = farmacie.filter(f => getStatoFarmacia(rilievi, f.id, sopralluoghi) === 'fase_1').length
  const fase2 = farmacie.filter(f => getStatoFarmacia(rilievi, f.id, sopralluoghi) === 'fase_2').length
  const fase3 = farmacie.filter(f => getStatoFarmacia(rilievi, f.id, sopralluoghi) === 'fase_3').length
  const completati = farmacie.filter(f => getStatoFarmacia(rilievi, f.id, sopralluoghi) === 'completato').length
  const percentuale = totale > 0 ? Math.round((completati / totale) * 100) : 0

  const cards = [
    { label: 'Totale farmacie', value: totale, icon: Store, color: 'text-accent-700', bg: 'bg-accent-50', border: 'border-accent-100' },
    { label: 'Assegnato', value: assegnati, icon: AlertCircle, color: 'text-status-todo-600', bg: 'bg-status-todo-50', border: 'border-status-todo-100' },
    { label: 'Fase 1', value: fase1, icon: Play, color: 'text-status-waiting-500', bg: 'bg-status-waiting-50', border: 'border-status-waiting-100' },
    { label: 'Fase 2', value: fase2, icon: Wrench, color: 'text-status-progress-500', bg: 'bg-status-progress-50', border: 'border-status-progress-100' },
    { label: 'Fase 3', value: fase3, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Completato', value: completati, icon: CheckCircle2, color: 'text-status-done-500', bg: 'bg-status-done-50', border: 'border-status-done-100' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
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
          <p className="text-xs text-brand-400">{completati} di {totale} farmacie</p>
          <p className="text-xs text-brand-400">{assegnati + fase1 + fase2 + fase3} rimanenti</p>
        </div>
      </div>
    </div>
  )
}
