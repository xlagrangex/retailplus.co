import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Farmacia, Assegnazione, Rilievo, User } from '../types'
import {
  getFarmacie, saveFarmacie,
  getAssegnazioni, saveAssegnazioni,
  getRilievi, saveRilievi,
  getUsers, saveUsers,
} from '../data/mock'

interface DataContextType {
  farmacie: Farmacia[]
  assegnazioni: Assegnazione[]
  rilievi: Rilievo[]
  users: User[]
  refresh: () => void
  addFarmacia: (f: Farmacia) => void
  removeFarmacia: (id: string) => void
  importFarmacie: (farmacie: Farmacia[]) => void
  addUser: (u: User) => void
  removeUser: (id: string) => void
  assignFarmacia: (farmaciaId: string, merchandiserId: string) => void
  unassignFarmacia: (farmaciaId: string) => void
  saveRilievo: (r: Rilievo) => void
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [farmacie, setFarmacie] = useState<Farmacia[]>(getFarmacie)
  const [assegnazioni, setAssegnazioni] = useState<Assegnazione[]>(getAssegnazioni)
  const [rilievi, setRilievi] = useState<Rilievo[]>(getRilievi)
  const [users, setUsers] = useState<User[]>(getUsers)

  const refresh = useCallback(() => {
    setFarmacie(getFarmacie())
    setAssegnazioni(getAssegnazioni())
    setRilievi(getRilievi())
    setUsers(getUsers())
  }, [])

  const addFarmacia = useCallback((f: Farmacia) => {
    const updated = [...getFarmacie(), f]
    saveFarmacie(updated)
    setFarmacie(updated)
  }, [])

  const removeFarmacia = useCallback((id: string) => {
    const updated = getFarmacie().filter(f => f.id !== id)
    saveFarmacie(updated)
    setFarmacie(updated)
  }, [])

  const importFarmacie = useCallback((newFarmacie: Farmacia[]) => {
    const existing = getFarmacie()
    const merged = [...existing, ...newFarmacie.filter(nf => !existing.some(ef => ef.id === nf.id))]
    saveFarmacie(merged)
    setFarmacie(merged)
  }, [])

  const addUser = useCallback((u: User) => {
    const updated = [...getUsers(), u]
    saveUsers(updated)
    setUsers(updated)
  }, [])

  const removeUser = useCallback((id: string) => {
    const updated = getUsers().filter(u => u.id !== id)
    saveUsers(updated)
    setUsers(updated)
  }, [])

  const assignFarmacia = useCallback((farmaciaId: string, merchandiserId: string) => {
    const current = getAssegnazioni().filter(a => a.farmaciaId !== farmaciaId)
    const updated = [...current, { farmaciaId, merchandiserId }]
    saveAssegnazioni(updated)
    setAssegnazioni(updated)
  }, [])

  const unassignFarmacia = useCallback((farmaciaId: string) => {
    const updated = getAssegnazioni().filter(a => a.farmaciaId !== farmaciaId)
    saveAssegnazioni(updated)
    setAssegnazioni(updated)
  }, [])

  const saveRilievoFn = useCallback((r: Rilievo) => {
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
  }, [])

  return (
    <DataContext.Provider value={{
      farmacie, assegnazioni, rilievi, users, refresh,
      addFarmacia, removeFarmacia, importFarmacie,
      addUser, removeUser,
      assignFarmacia, unassignFarmacia,
      saveRilievo: saveRilievoFn,
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
