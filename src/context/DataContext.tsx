import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { Farmacia, Assegnazione, Rilievo, User, CampoConfigurazione, RegistrazionePending, Messaggio } from '../types'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  fetchUsers, fetchFarmacie, fetchAssegnazioni, fetchRilievi,
  insertFarmacia as sbInsertFarmacia, insertFarmacie as sbInsertFarmacie,
  deleteFarmaciaDb, updateFarmaciaDb,
  insertUser as sbInsertUser, deleteUserDb, updateUserDb,
  upsertAssegnazione, deleteAssegnazione,
  upsertRilievo,
  fetchCampiConfigurazione,
  upsertCampoConfigurazione as sbUpsertCampo,
  deleteCampoConfigurazione as sbDeleteCampo,
  fetchRegistrazioniPending,
  insertRegistrazione as sbInsertRegistrazione,
  updateRegistrazioneStato as sbUpdateRegistrazioneStato,
  fetchMessaggi,
  fetchMessaggiLetti,
  insertMessaggio as sbInsertMessaggio,
  markMessaggiAsRead as sbMarkAsRead,
} from '../data/supabase'
import {
  getFarmacie, saveFarmacie,
  getAssegnazioni, saveAssegnazioni,
  getRilievi, saveRilievi,
  getUsers, saveUsers,
  getCampiConfigurazione, saveCampiConfigurazione, defaultCampiConfigurazione,
  getRegistrazioni, saveRegistrazioni,
  getMessaggi, saveMessaggi,
  getMessaggiLetti, saveMessaggiLetti,
} from '../data/mock'

interface DataContextType {
  farmacie: Farmacia[]
  assegnazioni: Assegnazione[]
  rilievi: Rilievo[]
  users: User[]
  isLoading: boolean
  refresh: () => void
  addFarmacia: (f: Farmacia) => void
  removeFarmacia: (id: string) => void
  importFarmacie: (farmacie: Farmacia[]) => void
  updateFarmacia: (id: string, updates: Partial<Farmacia>) => void
  addUser: (u: User) => void
  removeUser: (id: string) => void
  updateUser: (id: string, updates: Partial<User>) => void
  assignFarmacia: (farmaciaId: string, merchandiserId: string) => void
  unassignFarmacia: (farmaciaId: string) => void
  saveRilievo: (r: Rilievo) => void
  campiConfigurazione: CampoConfigurazione[]
  addCampo: (c: CampoConfigurazione) => void
  updateCampo: (c: CampoConfigurazione) => void
  removeCampo: (id: string) => void
  registrazioniPending: RegistrazionePending[]
  submitRegistrazione: (r: RegistrazionePending) => void
  approveRegistrazione: (id: string) => void
  rejectRegistrazione: (id: string) => void
  messaggi: Messaggio[]
  messaggiLettiIds: Set<string>
  unreadCount: number
  sendMessaggio: (testo: string, merchandiserId: string, farmaciaId?: string) => void
  markAsRead: (ids: string[]) => void
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [farmacie, setFarmacie] = useState<Farmacia[]>(() => isSupabaseConfigured ? [] : getFarmacie())
  const [assegnazioni, setAssegnazioni] = useState<Assegnazione[]>(() => isSupabaseConfigured ? [] : getAssegnazioni())
  const [rilievi, setRilievi] = useState<Rilievo[]>(() => isSupabaseConfigured ? [] : getRilievi())
  const [users, setUsers] = useState<User[]>(() => isSupabaseConfigured ? [] : getUsers())
  const [campiConfigurazione, setCampiConfigurazione] = useState<CampoConfigurazione[]>(
    () => isSupabaseConfigured ? defaultCampiConfigurazione : getCampiConfigurazione()
  )
  const [registrazioniPending, setRegistrazioniPending] = useState<RegistrazionePending[]>(
    () => isSupabaseConfigured ? [] : getRegistrazioni().filter(r => r.stato === 'pending')
  )
  const [messaggi, setMessaggi] = useState<Messaggio[]>(() => isSupabaseConfigured ? [] : getMessaggi())
  const [messaggiLettiIds, setMessaggiLettiIds] = useState<Set<string>>(
    () => {
      if (isSupabaseConfigured) return new Set<string>()
      const saved = localStorage.getItem('logplus_current_user')
      const userId = saved ? JSON.parse(saved).id : null
      if (!userId) return new Set<string>()
      return new Set(getMessaggiLetti().filter(l => l.userId === userId).map(l => l.messaggioId))
    }
  )
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)

  const currentUserId = (() => {
    const saved = localStorage.getItem('logplus_current_user')
    return saved ? JSON.parse(saved).id : null
  })()

  // Initial fetch from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    async function load() {
      try {
        const [u, f, a, r] = await Promise.all([
          fetchUsers(), fetchFarmacie(), fetchAssegnazioni(), fetchRilievi()
        ])
        // Fetch campi — may fail if table doesn't exist yet
        let campi = defaultCampiConfigurazione
        try { campi = await fetchCampiConfigurazione(); if (campi.length === 0) campi = defaultCampiConfigurazione } catch { /* fallback */ }
        let regs: RegistrazionePending[] = []
        try { regs = await fetchRegistrazioniPending() } catch { /* table may not exist yet */ }
        let msgs: Messaggio[] = []
        let lettiIds = new Set<string>()
        try {
          msgs = await fetchMessaggi()
          const uid = localStorage.getItem('logplus_current_user')
          const userId = uid ? JSON.parse(uid).id : null
          if (userId) {
            const letti = await fetchMessaggiLetti(userId)
            lettiIds = new Set(letti.map(l => l.messaggioId))
          }
        } catch { /* table may not exist yet */ }
        if (!cancelled) {
          setUsers(u)
          setFarmacie(f)
          setAssegnazioni(a)
          setRilievi(r)
          setCampiConfigurazione(campi)
          setRegistrazioniPending(regs)
          setMessaggi(msgs)
          setMessaggiLettiIds(lettiIds)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Error loading data from Supabase:', err)
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const refresh = useCallback(() => {
    if (isSupabaseConfigured) {
      Promise.all([fetchUsers(), fetchFarmacie(), fetchAssegnazioni(), fetchRilievi()])
        .then(([u, f, a, r]) => { setUsers(u); setFarmacie(f); setAssegnazioni(a); setRilievi(r) })
        .catch(console.error)
    } else {
      setFarmacie(getFarmacie())
      setAssegnazioni(getAssegnazioni())
      setRilievi(getRilievi())
      setUsers(getUsers())
    }
  }, [])

  const addFarmacia = useCallback((f: Farmacia) => {
    if (isSupabaseConfigured) {
      sbInsertFarmacia(f).then(() => {
        fetchFarmacie().then(setFarmacie).catch(console.error)
      }).catch(console.error)
    } else {
      const updated = [...getFarmacie(), f]
      saveFarmacie(updated)
      setFarmacie(updated)
    }
  }, [])

  const removeFarmacia = useCallback((id: string) => {
    if (isSupabaseConfigured) {
      deleteFarmaciaDb(id).then(() => {
        fetchFarmacie().then(setFarmacie).catch(console.error)
        fetchAssegnazioni().then(setAssegnazioni).catch(console.error)
      }).catch(console.error)
    } else {
      const updated = getFarmacie().filter(f => f.id !== id)
      saveFarmacie(updated)
      setFarmacie(updated)
    }
  }, [])

  const importFarmacie = useCallback((newFarmacie: Farmacia[]) => {
    if (isSupabaseConfigured) {
      sbInsertFarmacie(newFarmacie).then(() => {
        fetchFarmacie().then(setFarmacie).catch(console.error)
      }).catch(console.error)
    } else {
      const existing = getFarmacie()
      const merged = [...existing, ...newFarmacie.filter(nf => !existing.some(ef => ef.id === nf.id))]
      saveFarmacie(merged)
      setFarmacie(merged)
    }
  }, [])

  const updateFarmacia = useCallback((id: string, updates: Partial<Farmacia>) => {
    if (isSupabaseConfigured) {
      updateFarmaciaDb(id, updates).then(() => {
        fetchFarmacie().then(setFarmacie).catch(console.error)
      }).catch(console.error)
    } else {
      const current = getFarmacie()
      const updated = current.map(f => f.id === id ? { ...f, ...updates } : f)
      saveFarmacie(updated)
      setFarmacie(updated)
    }
  }, [])

  const addUser = useCallback((u: User) => {
    if (isSupabaseConfigured) {
      sbInsertUser(u).then(() => {
        fetchUsers().then(setUsers).catch(console.error)
      }).catch(console.error)
    } else {
      const updated = [...getUsers(), u]
      saveUsers(updated)
      setUsers(updated)
    }
  }, [])

  const removeUser = useCallback((id: string) => {
    const user = users.find(u => u.id === id)

    if (isSupabaseConfigured) {
      deleteUserDb(id).then(() => {
        fetchUsers().then(setUsers).catch(console.error)
      }).catch(console.error)
    } else {
      const updated = getUsers().filter(u => u.id !== id)
      saveUsers(updated)
      setUsers(updated)
    }

    // Send account removal notification (async, non-blocking)
    if (user && user.ruolo === 'merchandiser') {
      import('../lib/brevo').then(({ sendAccountRemovedEmail }) => {
        sendAccountRemovedEmail({ email: user.email, nome: user.nome }).catch(console.error)
      }).catch(console.error)
    }
  }, [users])

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    if (isSupabaseConfigured) {
      updateUserDb(id, updates).then(() => {
        fetchUsers().then(setUsers).catch(console.error)
      }).catch(console.error)
    } else {
      const current = getUsers()
      const updated = current.map(u => u.id === id ? { ...u, ...updates } : u)
      saveUsers(updated)
      setUsers(updated)
    }
  }, [])

  const assignFarmacia = useCallback((farmaciaId: string, merchandiserId: string) => {
    if (isSupabaseConfigured) {
      upsertAssegnazione(farmaciaId, merchandiserId).then(() => {
        fetchAssegnazioni().then(setAssegnazioni).catch(console.error)
      }).catch(console.error)
    } else {
      const current = getAssegnazioni().filter(a => a.farmaciaId !== farmaciaId)
      const updated = [...current, { farmaciaId, merchandiserId }]
      saveAssegnazioni(updated)
      setAssegnazioni(updated)
    }
  }, [])

  const unassignFarmacia = useCallback((farmaciaId: string) => {
    if (isSupabaseConfigured) {
      deleteAssegnazione(farmaciaId).then(() => {
        fetchAssegnazioni().then(setAssegnazioni).catch(console.error)
      }).catch(console.error)
    } else {
      const updated = getAssegnazioni().filter(a => a.farmaciaId !== farmaciaId)
      saveAssegnazioni(updated)
      setAssegnazioni(updated)
    }
  }, [])

  const saveRilievoFn = useCallback((r: Rilievo) => {
    if (isSupabaseConfigured) {
      upsertRilievo(r).then(() => {
        fetchRilievi().then(setRilievi).catch(console.error)
      }).catch(console.error)
    } else {
      const current = getRilievi()
      const existing = current.findIndex(x => x.farmaciaId === r.farmaciaId && x.fase === r.fase)
      let updated: Rilievo[]
      if (existing >= 0) {
        updated = [...current]
        updated[existing] = r
      } else {
        updated = [...current, r]
      }
      saveRilievi(updated)
      setRilievi(updated)
    }
  }, [])

  const addCampo = useCallback((c: CampoConfigurazione) => {
    if (isSupabaseConfigured) {
      sbUpsertCampo(c).then(() => {
        fetchCampiConfigurazione().then(setCampiConfigurazione).catch(console.error)
      }).catch(console.error)
    } else {
      const updated = [...getCampiConfigurazione(), c]
      saveCampiConfigurazione(updated)
      setCampiConfigurazione(updated)
    }
  }, [])

  const updateCampo = useCallback((c: CampoConfigurazione) => {
    if (isSupabaseConfigured) {
      sbUpsertCampo(c).then(() => {
        fetchCampiConfigurazione().then(setCampiConfigurazione).catch(console.error)
      }).catch(console.error)
    } else {
      const current = getCampiConfigurazione()
      const updated = current.map(x => x.id === c.id ? c : x)
      saveCampiConfigurazione(updated)
      setCampiConfigurazione(updated)
    }
  }, [])

  const removeCampo = useCallback((id: string) => {
    if (isSupabaseConfigured) {
      sbDeleteCampo(id).then(() => {
        fetchCampiConfigurazione().then(setCampiConfigurazione).catch(console.error)
      }).catch(console.error)
    } else {
      const updated = getCampiConfigurazione().filter(c => c.id !== id)
      saveCampiConfigurazione(updated)
      setCampiConfigurazione(updated)
    }
  }, [])

  const submitRegistrazione = useCallback((r: RegistrazionePending) => {
    if (isSupabaseConfigured) {
      sbInsertRegistrazione(r).then(() => {
        fetchRegistrazioniPending().then(setRegistrazioniPending).catch(console.error)
      }).catch(console.error)
    } else {
      const all = getRegistrazioni()
      saveRegistrazioni([...all, r])
      setRegistrazioniPending(prev => [...prev, r])
    }

    // Notify admin (async, non-blocking)
    import('../lib/brevo').then(({ sendNewRegistrationNotification }) => {
      sendNewRegistrationNotification({
        nome: r.nome,
        cognome: r.cognome,
        email: r.email,
        telefono: r.telefono,
        citta: r.citta,
        provincia: r.provincia,
      }).catch(console.error)
    }).catch(console.error)
  }, [])

  const approveRegistrazione = useCallback((id: string) => {
    const reg = registrazioniPending.find(r => r.id === id)
    if (!reg) return

    const newUser: User = {
      id: `merch-${Date.now()}`,
      email: reg.email,
      nome: reg.nome,
      cognome: reg.cognome,
      ruolo: 'merchandiser',
      telefono: reg.telefono,
      codiceFiscale: reg.codiceFiscale,
      indirizzo: reg.indirizzo,
      citta: reg.citta,
      provincia: reg.provincia,
      partitaIva: reg.partitaIva,
      iban: reg.iban,
      fotoDocumento: reg.fotoDocumento,
    }

    if (isSupabaseConfigured) {
      sbInsertUser(newUser).then(() => {
        sbUpdateRegistrazioneStato(id, 'approved').then(() => {
          fetchUsers().then(setUsers).catch(console.error)
          fetchRegistrazioniPending().then(setRegistrazioniPending).catch(console.error)
        }).catch(console.error)
      }).catch(console.error)
    } else {
      const updatedUsers = [...getUsers(), newUser]
      saveUsers(updatedUsers)
      setUsers(updatedUsers)
      const allRegs = getRegistrazioni().map(r => r.id === id ? { ...r, stato: 'approved' as const } : r)
      saveRegistrazioni(allRegs)
      setRegistrazioniPending(prev => prev.filter(r => r.id !== id))
    }

    // Send welcome email (async, non-blocking)
    import('../lib/brevo').then(({ sendWelcomeEmail }) => {
      sendWelcomeEmail({ email: reg.email, nome: reg.nome }).catch(console.error)
    }).catch(console.error)
  }, [registrazioniPending])

  const currentUserRuolo = (() => {
    const saved = localStorage.getItem('logplus_current_user')
    return saved ? JSON.parse(saved).ruolo : null
  })()

  const unreadCount = (() => {
    if (currentUserRuolo === 'brand') return 0
    if (currentUserRuolo === 'merchandiser') {
      return messaggi.filter(m => m.merchandiserId === currentUserId && m.autoreId !== currentUserId && !messaggiLettiIds.has(m.id)).length
    }
    // admin: all unread messages not sent by me
    return messaggi.filter(m => m.autoreId !== currentUserId && !messaggiLettiIds.has(m.id)).length
  })()

  const sendMessaggio = useCallback((testo: string, merchandiserId: string, farmaciaId?: string) => {
    const saved = localStorage.getItem('logplus_current_user')
    const user = saved ? JSON.parse(saved) : null
    if (!user) return

    const msg: Messaggio = {
      id: crypto.randomUUID(),
      testo,
      autoreId: user.id,
      autoreNome: `${user.nome} ${user.cognome}`,
      autoreRuolo: user.ruolo,
      merchandiserId,
      farmaciaId,
      createdAt: new Date().toISOString(),
    }

    if (isSupabaseConfigured) {
      sbInsertMessaggio(msg).then(() => {
        fetchMessaggi().then(setMessaggi).catch(console.error)
      }).catch(console.error)
    } else {
      const updated = [...getMessaggi(), msg]
      saveMessaggi(updated)
      setMessaggi(updated)
    }
  }, [])

  const markAsRead = useCallback((ids: string[]) => {
    if (!currentUserId || ids.length === 0) return

    if (isSupabaseConfigured) {
      sbMarkAsRead(ids, currentUserId).then(() => {
        setMessaggiLettiIds(prev => {
          const next = new Set(prev)
          ids.forEach(id => next.add(id))
          return next
        })
      }).catch(console.error)
    } else {
      const existing = getMessaggiLetti()
      const newEntries = ids
        .filter(id => !existing.some(l => l.messaggioId === id && l.userId === currentUserId))
        .map(id => ({ messaggioId: id, userId: currentUserId, lettoAt: new Date().toISOString() }))
      saveMessaggiLetti([...existing, ...newEntries])
      setMessaggiLettiIds(prev => {
        const next = new Set(prev)
        ids.forEach(id => next.add(id))
        return next
      })
    }
  }, [currentUserId])

  const rejectRegistrazione = useCallback((id: string) => {
    const reg = registrazioniPending.find(r => r.id === id)

    if (isSupabaseConfigured) {
      sbUpdateRegistrazioneStato(id, 'rejected').then(() => {
        fetchRegistrazioniPending().then(setRegistrazioniPending).catch(console.error)
      }).catch(console.error)
    } else {
      const allRegs = getRegistrazioni().map(r => r.id === id ? { ...r, stato: 'rejected' as const } : r)
      saveRegistrazioni(allRegs)
      setRegistrazioniPending(prev => prev.filter(r => r.id !== id))
    }

    // Send rejection email (async, non-blocking)
    if (reg) {
      import('../lib/brevo').then(({ sendRejectionEmail }) => {
        sendRejectionEmail({ email: reg.email, nome: reg.nome }).catch(console.error)
      }).catch(console.error)
    }
  }, [registrazioniPending])

  return (
    <DataContext.Provider value={{
      farmacie, assegnazioni, rilievi, users, isLoading, refresh,
      addFarmacia, removeFarmacia, importFarmacie, updateFarmacia,
      addUser, removeUser, updateUser,
      assignFarmacia, unassignFarmacia,
      saveRilievo: saveRilievoFn,
      campiConfigurazione, addCampo, updateCampo, removeCampo,
      registrazioniPending, submitRegistrazione, approveRegistrazione, rejectRegistrazione,
      messaggi, messaggiLettiIds, unreadCount, sendMessaggio, markAsRead,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
