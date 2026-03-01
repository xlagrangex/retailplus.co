import { RilievoEvento, Rilievo, EventoTipo, getLabelEvento } from '../types'
import {
  Play, CheckCircle2, Camera, AlertTriangle, Ruler, Pause, XCircle, Check,
} from 'lucide-react'

// ── Icon + color mapping per tipo evento ──

function getEventoStyle(tipo: EventoTipo): { icon: typeof Play; color: string; bg: string } {
  switch (tipo) {
    case 'fase_iniziata':
      return { icon: Play, color: 'text-accent-600', bg: 'bg-accent-100' }
    case 'fase_completata':
      return { icon: CheckCircle2, color: 'text-status-done-600', bg: 'bg-status-done-100' }
    case 'substep_completato':
      return { icon: Check, color: 'text-status-done-500', bg: 'bg-status-done-50' }
    case 'substep_annullato':
      return { icon: XCircle, color: 'text-brand-400', bg: 'bg-brand-100' }
    case 'foto_caricata':
      return { icon: Camera, color: 'text-accent-500', bg: 'bg-accent-50' }
    case 'problema_segnalato':
      return { icon: AlertTriangle, color: 'text-status-waiting-600', bg: 'bg-status-waiting-50' }
    case 'problema_rimosso':
      return { icon: AlertTriangle, color: 'text-brand-400', bg: 'bg-brand-50' }
    case 'misure_salvate':
      return { icon: Ruler, color: 'text-accent-600', bg: 'bg-accent-50' }
    case 'in_attesa_attivata':
      return { icon: Pause, color: 'text-status-waiting-600', bg: 'bg-status-waiting-50' }
    case 'in_attesa_rimossa':
      return { icon: Play, color: 'text-status-done-500', bg: 'bg-status-done-50' }
  }
}

// ── Timestamp formatting ──

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const time = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

  if (diffDays === 0) return `Oggi ${time}`
  if (diffDays === 1) return `Ieri ${time}`
  if (diffDays < 7) return `${date.toLocaleDateString('it-IT', { weekday: 'short' })} ${time}`
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) + ` ${time}`
}

function getDateGroup(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Oggi'
  if (diffDays === 1) return 'Ieri'
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Synthetic events from existing rilievi ──

export function generateSyntheticEvents(rilievi: Rilievo[], farmaciaId: string): RilievoEvento[] {
  const synthetic: RilievoEvento[] = []
  const rilieviFarmacia = rilievi.filter(r => r.farmaciaId === farmaciaId && r.completata)

  rilieviFarmacia.forEach(r => {
    const ts = r.dataCompletamento
      ? `${r.dataCompletamento}T${r.oraCompletamento || '12:00'}:00`
      : new Date().toISOString()

    synthetic.push({
      id: `syn-completata-${r.fase}-${r.farmaciaId}`,
      farmaciaId: r.farmaciaId,
      merchandiserId: r.merchandiserId,
      fase: r.fase,
      tipo: 'fase_completata',
      createdAt: ts,
    })
  })

  return synthetic
}

// ── Timeline component ──

export default function Timeline({
  eventi,
  rilievi,
  farmaciaId,
}: {
  eventi: RilievoEvento[]
  rilievi?: Rilievo[]
  farmaciaId?: string
}) {
  // Merge real events with synthetic ones for retrocompatibility
  const syntheticEvents = rilievi && farmaciaId
    ? generateSyntheticEvents(rilievi, farmaciaId)
    : []

  // Deduplicate: prefer real events over synthetic
  const realKeys = new Set(eventi.map(e => `${e.tipo}-${e.fase}`))
  const filteredSynthetic = syntheticEvents.filter(
    se => !realKeys.has(`${se.tipo}-${se.fase}`)
  )

  const allEvents = [...eventi, ...filteredSynthetic]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (allEvents.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-brand-400 italic">Nessuna attivita registrata</p>
      </div>
    )
  }

  // Group by date
  const groups: { label: string; events: RilievoEvento[] }[] = []
  let currentGroup = ''
  allEvents.forEach(e => {
    const group = getDateGroup(e.createdAt)
    if (group !== currentGroup) {
      groups.push({ label: group, events: [e] })
      currentGroup = group
    } else {
      groups[groups.length - 1].events.push(e)
    }
  })

  return (
    <div className="space-y-4">
      {groups.map((group, gi) => (
        <div key={gi}>
          <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider mb-2">
            {group.label}
          </p>
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-[9px] top-2 bottom-2 w-px bg-brand-200" />

            <div className="space-y-3">
              {group.events.map(evento => {
                const style = getEventoStyle(evento.tipo)
                const Icon = style.icon
                return (
                  <div key={evento.id} className="relative flex items-start gap-3">
                    {/* Dot */}
                    <div className={`absolute -left-6 w-[18px] h-[18px] rounded-full flex items-center justify-center ${style.bg} ring-2 ring-white`}>
                      <Icon size={10} className={style.color} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-brand-800 leading-snug">
                        {getLabelEvento(evento.tipo, evento.dettaglio)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-brand-400">
                          {formatTimestamp(evento.createdAt)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-500 font-medium">
                          Fase {evento.fase}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
