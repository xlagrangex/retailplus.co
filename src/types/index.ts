export type UserRole = 'admin' | 'brand' | 'merchandiser'

export interface User {
  id: string
  email: string
  nome: string
  cognome: string
  ruolo: UserRole
  telefono?: string
}

export type RegistrazioneStato = 'pending' | 'approved' | 'rejected'

export interface RegistrazionePending {
  id: string
  email: string
  nome: string
  cognome: string
  telefono: string
  codiceFiscale: string
  indirizzo: string
  citta: string
  provincia: string
  partitaIva?: string
  iban?: string
  fotoDocumento?: string
  note?: string
  stato: RegistrazioneStato
  dataRichiesta: string
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
  email?: string
  note?: string
  planogrammaUrl?: string
  codiceCliente?: string
  regione?: string
  rippianiCategory?: number
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
  // Fase 1 - misure espositore
  profonditaScaffale?: number
  profonditaMensola?: number
  larghezza?: number
  altezza?: number
  numScaffali?: number
  // Fase 2 - montaggio plexiglass
  pezziRicevuti?: boolean
  scaricamentoCompleto?: boolean   // sottopunto 1: scaricamento/svuotamento scaffale
  montaggioCompleto?: boolean      // sottopunto 2: montaggio materiale
  kitRicevuto?: boolean
  problemaKit?: boolean
  descrizioneProblema?: string
  fotoProblema?: string[]
  // Fase 3 - prodotti
  prodottiPosizionati?: boolean
  // Tutte le fasi
  foto: string[] // array di foto (base64 o URL)
  note?: string
  completata: boolean
  dataCompletamento?: string
  oraCompletamento?: string
  inAttesaMateriale?: boolean
  valoriDinamici?: Record<string, string | number | boolean>
}

export type CampoTipo = 'number' | 'text' | 'checkbox' | 'select'

export interface CampoConfigurazione {
  id: string
  fase: FaseNumero
  nome: string
  label: string
  descrizione?: string
  tipo: CampoTipo
  unita?: string
  obbligatorio: boolean
  opzioni?: string[]
  ordine: number
  attivo: boolean
}

export type StatoFarmacia = 'da_fare' | 'in_corso' | 'completata' | 'in_attesa'

export function getStatoFarmacia(rilievi: Rilievo[], farmaciaId: string): StatoFarmacia {
  const rilieviFarmacia = rilievi.filter(r => r.farmaciaId === farmaciaId)
  // Check if any rilievo has inAttesaMateriale flag
  if (rilieviFarmacia.some(r => r.inAttesaMateriale)) return 'in_attesa'
  const fasiComplete = rilieviFarmacia.filter(r => r.completata).length
  if (fasiComplete === 0) return 'da_fare'
  if (fasiComplete >= 3) return 'completata'
  return 'in_corso'
}

export function getFaseCorrente(rilievi: Rilievo[], farmaciaId: string): FaseNumero {
  const fasi = rilievi.filter(r => r.farmaciaId === farmaciaId && r.completata).map(r => r.fase)
  if (!fasi.includes(1)) return 1
  if (!fasi.includes(2)) return 2
  return 3
}

export function getColoreStato(stato: StatoFarmacia): string {
  switch (stato) {
    case 'da_fare': return '#8da4b8'
    case 'in_corso': return '#5d8a82'
    case 'completata': return '#2b7268'
    case 'in_attesa': return '#4a6fa5'
  }
}

export function getLabelStato(stato: StatoFarmacia): string {
  switch (stato) {
    case 'da_fare': return 'Da fare'
    case 'in_corso': return 'In corso'
    case 'completata': return 'Completata'
    case 'in_attesa': return 'In attesa materiale'
  }
}

export function getLabelFase(fase: FaseNumero): string {
  switch (fase) {
    case 1: return 'Rilievo Misure'
    case 2: return 'Montaggio Plexiglass'
    case 3: return 'Caricamento Prodotti'
  }
}

export function getDescrizioneFase(fase: FaseNumero): string {
  switch (fase) {
    case 1: return 'Rileva le misure dell\'espositore dedicato e fotografa lo stato attuale'
    case 2: return 'Scarica il materiale dallo scaffale e monta il plexiglass'
    case 3: return 'Posiziona i prodotti sugli scaffali e fotografa il risultato finale'
  }
}
