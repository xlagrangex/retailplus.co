import { Farmacia, Rilievo, getStatoFarmacia } from '../types'
import { Store, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

interface Props {
  farmacie: Farmacia[]
  rilievi: Rilievo[]
}

export default function StatsCards({ farmacie, rilievi }: Props) {
  const totale = farmacie.length
  const completate = farmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'completata').length
  const inCorso = farmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'in_corso').length
  const daFare = farmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'da_fare').length
  const percentuale = totale > 0 ? Math.round((completate / totale) * 100) : 0

  const cards = [
    { label: 'Totale Farmacie', value: totale, icon: Store, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completate', value: completate, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'In Corso', value: inCorso, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Da Fare', value: daFare, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => {
          const Icon = c.icon
          return (
            <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${c.bg}`}>
                  <Icon size={20} className={c.color} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                  <p className="text-xs text-gray-500">{c.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Avanzamento complessivo</span>
          <span className="text-sm font-bold text-blue-600">{percentuale}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
            style={{ width: `${percentuale}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">{completate} su {totale} farmacie completate</p>
      </div>
    </div>
  )
}
