import { useState, useRef, useEffect, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { Send } from 'lucide-react'
import { Messaggio, UserRole } from '../types'

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
}: {
  merchandiserId: string
  maxHeight?: string
  compact?: boolean
}) {
  const { user } = useAuth()
  const { messaggi, messaggiLettiIds, sendMessaggio, markAsRead } = useData()
  const [testo, setTesto] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)

  const filtered = useMemo(() => {
    return messaggi.filter(m => m.merchandiserId === merchandiserId)
  }, [messaggi, merchandiserId])

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
    sendMessaggio(trimmed, merchandiserId)
    setTesto('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col" style={{ height: maxHeight }}>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-xs text-brand-400 py-8">
            Nessun messaggio. Inizia la conversazione!
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
                {/* Timestamp */}
                <p className={`text-[10px] mt-0.5 px-1 ${isMine ? 'text-right text-brand-400' : 'text-brand-400'}`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input */}
      <div className="border-t border-brand-100 p-2 flex gap-2 items-end bg-white">
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
  )
}
