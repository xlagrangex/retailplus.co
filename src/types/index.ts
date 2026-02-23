export type UserRole = 'admin' | 'brand' | 'merchandiser'

export interface User {
  id: string
  email: string
  nome: string
  cognome: string
  ruolo: UserRole
  telefono?: string
}

export interface Farmacia {
  id: string
  nome: string
  indirizzo: string
  citta: string
  provincia: string
  cap: string
  lat: number
  lng: number
  telefono?: string
  referente?: string
  note?: string
}

export interface Assegnazione {
  farmaciaId: string
  merchandiserId: string
}

export type FaseNumero = 1 | 2 | 3

export interface Rilievo {
  id: string
  farmaciaId: string
  merchandiserId: string
  fase: FaseNumero
  // Fase 1 - misure
  profondita?: number
  larghezza?: number
  altezza?: number
  numScaffali?: number
  // Tutte le fasi
  fotoUrl?: string
  note?: string
  completata: boolean
  dataCompletamento?: string
}

export type StatoFarmacia = 'da_fare' | 'in_corso' | 'completata'

export function getStatoFarmacia(rilievi: Rilievo[], farmaciaId: string): StatoFarmacia {
  const rilieviFarmacia = rilievi.filter(r => r.farmaciaId === farmaciaId && r.completata)
  const fasiComplete = rilieviFarmacia.length
  if (fasiComplete === 0) return 'da_fare'
  if (fasiComplete >= 3) return 'completata'
  return 'in_corso'
}

export function getColoreStato(stato: StatoFarmacia): string {
  switch (stato) {
    case 'da_fare': return '#ef4444'      // rosso
    case 'in_corso': return '#eab308'     // giallo
    case 'completata': return '#22c55e'   // verde
  }
}

export function getLabelStato(stato: StatoFarmacia): string {
  switch (stato) {
    case 'da_fare': return 'Da fare'
    case 'in_corso': return 'In corso'
    case 'completata': return 'Completata'
  }
}

export function getLabelFase(fase: FaseNumero): string {
  switch (fase) {
    case 1: return 'Rilievo Misure'
    case 2: return 'Montaggio Plexiglass'
    case 3: return 'Caricamento Prodotti'
  }
}
