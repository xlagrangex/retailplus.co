import { useState, useRef, useEffect, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { Send, X, Store, ChevronDown, Check } from 'lucide-react'
import { Messaggio, UserRole, Farmacia } from '../types'

const roleColors: Record<UserRole, string> = {
  admin: '#2b7268',
  brand: '#4a6fa5',
  merchandiser: '#5d8a82',
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  brand: 'Cliente',
  merchandiser: 'Merchandiser',
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()

  const time = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return time
  if (isYesterday) return `Ieri ${time}`
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) + ' ' + time
}

export default function MessageThread({
  merchandiserId,
  maxHeight = '400px',
  compact = false,
  selectedFarmaciaId = null,
  onClearFarmaciaFilter,
  farmacie = [],
}: {
  merchandiserId: string
  maxHeight?: string
  compact?: boolean
  selectedFarmaciaId?: string | null
  onClearFarmaciaFilter?: () => void
  farmacie?: Farmacia[]
}) {
  const { user } = useAuth()
  const { messaggi, messaggiLettiIds, messaggiLettiByOthers, sendMessaggio, markAsRead } = useData()
  const [testo, setTesto] = useState('')
  const [sendFarmaciaId, setSendFarmaciaId] = useState<string | null>(null)
  const [showFarmaciaDropdown, setShowFarmaciaDropdown] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)

  const filtered = useMemo(() => {
    let msgs = messaggi.filter(m => m.merchandiserId === merchandiserId)
    if (selectedFarmaciaId) {
      msgs = msgs.filter(m => m.farmaciaId === selectedFarmaciaId)
    }
    return msgs
  }, [messaggi, merchandiserId, selectedFarmaciaId])

  const farmaciaMap = useMemo(() => {
    const map: Record<string, string> = {}
    farmacie.forEach(f => { map[f.id] = f.nome })
    return map
  }, [farmacie])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (filtered.length > prevCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    prevCountRef.current = filtered.length
  }, [filtered.length])

  // Initial scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  // Mark as read on mount and when new messages arrive
  useEffect(() => {
    if (!user) return
    const unreadIds = filtered
      .filter(m => !messaggiLettiIds.has(m.id) && m.autoreId !== user.id)
      .map(m => m.id)
    if (unreadIds.length > 0) markAsRead(unreadIds)
  }, [filtered, user, messaggiLettiIds, markAsRead])

  if (!user) return null

  function handleSend() {
    const trimmed = testo.trim()
    if (!trimmed) return
    sendMessaggio(trimmed, merchandiserId, sendFarmaciaId || undefined)
    setTesto('')
    setSendFarmaciaId(null)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col" style={{ height: maxHeight }}>
      {/* Farmacia filter bar */}
      {selectedFarmaciaId && onClearFarmaciaFilter && (
        <div className="flex items-center gap-2 px-3 py-2 bg-accent-50 border-b border-accent-100 text-xs">
          <Store size={12} className="text-accent-600 shrink-0" />
          <span className="text-accent-700 font-medium truncate">
            Messaggi per: {farmaciaMap[selectedFarmaciaId] || 'Farmacia'}
          </span>
          <button
            onClick={onClearFarmaciaFilter}
            className="ml-auto text-accent-500 hover:text-accent-700 transition-colors flex items-center gap-1 shrink-0"
          >
            <X size={12} /> Mostra tutti
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-xs text-brand-400 py-8">
            {selectedFarmaciaId ? 'Nessun messaggio per questa farmacia.' : 'Nessun messaggio. Inizia la conversazione!'}
          </p>
        )}
        {filtered.map((msg: Messaggio) => {
          const isMine = msg.autoreId === user.id
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${compact ? 'max-w-[85%]' : ''}`}>
                {/* Sender info */}
                {!isMine && (
                  <div className="flex items-center gap-1.5 mb-0.5 px-1">
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: roleColors[msg.autoreRuolo] }}
                    >
                      {msg.autoreNome}
                    </span>
                    <span
                      className="text-[9px] px-1 py-px rounded-sm font-medium"
                      style={{
                        backgroundColor: roleColors[msg.autoreRuolo] + '15',
                        color: roleColors[msg.autoreRuolo],
                      }}
                    >
                      {roleLabels[msg.autoreRuolo]}
                    </span>
                  </div>
                )}
                {/* Farmacia badge */}
                {msg.farmaciaId && farmaciaMap[msg.farmaciaId] && (
                  <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-0.5 px-1`}>
                    <span className="inline-flex items-center gap-1 text-[9px] bg-brand-50 text-brand-500 border border-brand-100 rounded-full px-1.5 py-px">
                      <Store size={8} />
                      {farmaciaMap[msg.farmaciaId]}
                    </span>
                  </div>
                )}
                {/* Bubble */}
                <div
                  className={`rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
                    isMine
                      ? 'bg-accent-600 text-white rounded-br-sm'
                      : 'bg-brand-50 text-brand-800 rounded-bl-sm border border-brand-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.testo}</p>
                </div>
                {/* Timestamp + read receipts */}
                <p className={`text-[10px] mt-0.5 px-1 flex items-center ${isMine ? 'justify-end text-brand-400' : 'text-brand-400'}`}>
                  {formatTime(msg.createdAt)}
                  {isMine && (
                    <span className="inline-flex items-center ml-1">
                      {messaggiLettiByOthers.has(msg.id) ? (
                        <>
                          <Check size={12} className="text-blue-500 -mr-1.5" />
                          <Check size={12} className="text-blue-500" />
                        </>
                      ) : (
                        <Check size={12} className="text-brand-400" />
                      )}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input */}
      <div className="border-t border-brand-100 p-2 bg-white">
        {/* Farmacia tag selector */}
        {farmacie.length > 0 && (
          <div className="flex items-center gap-1 mb-1.5 px-1">
            {sendFarmaciaId ? (
              <span className="inline-flex items-center gap-1 text-[10px] bg-accent-50 text-accent-700 border border-accent-200 rounded-full px-2 py-0.5">
                <Store size={9} />
                {farmaciaMap[sendFarmaciaId] || 'Farmacia'}
                <button onClick={() => setSendFarmaciaId(null)} className="ml-0.5 hover:text-accent-900">
                  <X size={9} />
                </button>
              </span>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowFarmaciaDropdown(!showFarmaciaDropdown)}
                  className="inline-flex items-center gap-1 text-[10px] text-brand-400 hover:text-brand-600 transition-colors"
                >
                  <Store size={9} /> Tagga farmacia <ChevronDown size={9} />
                </button>
                {showFarmaciaDropdown && (
                  <div className="absolute bottom-full left-0 mb-1 w-56 bg-white border border-brand-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                    {farmacie.map(f => (
                      <button
                        key={f.id}
                        onClick={() => { setSendFarmaciaId(f.id); setShowFarmaciaDropdown(false) }}
                        className="w-full text-left px-3 py-1.5 text-xs text-brand-700 hover:bg-brand-50 transition-colors truncate"
                      >
                        {f.nome} — {f.citta}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={testo}
            onChange={e => setTesto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi un messaggio..."
            rows={1}
            className="flex-1 resize-none rounded-md border border-brand-200 px-3 py-2 text-[13px] text-brand-800 placeholder:text-brand-300 focus:outline-none focus:ring-1 focus:ring-accent-300 focus:border-accent-300"
            style={{ minHeight: '36px', maxHeight: '80px' }}
          />
          <button
            onClick={handleSend}
            disabled={!testo.trim()}
            className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
