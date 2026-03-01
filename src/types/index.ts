export type UserRole = 'admin' | 'brand' | 'merchandiser'

export interface User {
  id: string
  email: string
  nome: string
  cognome: string
  ruolo: UserRole
  telefono?: string
  codiceFiscale?: string
  indirizzo?: string
  citta?: string
  provincia?: string
  partitaIva?: string
  iban?: string
  fotoDocumento?: string
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
  valoriDinamici?: Record<string, string | number | boolean>
}

export interface Messaggio {
  id: string
  testo: string
  autoreId: string
  autoreNome: string
  autoreRuolo: UserRole
  merchandiserId: string
  farmaciaId?: string
  createdAt: string
}

export interface MessaggioLetto {
  messaggioId: string
  userId: string
  lettoAt: string
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

export type EsitoSopralluogo = 'riuscito' | 'non_riuscito'

export interface Sopralluogo {
  id: string
  farmaciaId: string
  merchandiserId: string
  fase: FaseNumero
  data: string        // YYYY-MM-DD
  ora: string         // HH:MM
  durata: number      // minuti
  esito: EsitoSopralluogo
  nota?: string
  createdAt: string
}

export type StatoFarmacia = 'assegnato' | 'fase_1' | 'fase_2' | 'fase_3' | 'completato'

export function getStatoFarmacia(rilievi: Rilievo[], farmaciaId: string, sopralluoghi?: Sopralluogo[]): StatoFarmacia {
  const rilieviFarmacia = rilievi.filter(r => r.farmaciaId === farmaciaId)
  const fasiComplete = rilieviFarmacia.filter(r => r.completata).length
  if (fasiComplete >= 3) return 'completato'
  if (fasiComplete >= 2) return 'fase_3'
  if (fasiComplete >= 1) return 'fase_2'
  // Check if there are partial rilievi or sopralluoghi
  const hasParziali = rilieviFarmacia.length > 0
  const hasSopralluoghi = sopralluoghi?.some(s => s.farmaciaId === farmaciaId)
  if (hasParziali || hasSopralluoghi) return 'fase_1'
  return 'assegnato'
}

export function getFaseCorrente(rilievi: Rilievo[], farmaciaId: string): FaseNumero {
  const fasi = rilievi.filter(r => r.farmaciaId === farmaciaId && r.completata).map(r => r.fase)
  if (!fasi.includes(1)) return 1
  if (!fasi.includes(2)) return 2
  return 3
}

export function getColoreStato(stato: StatoFarmacia): string {
  switch (stato) {
    case 'assegnato': return '#8da4b8'
    case 'fase_1': return '#4a6fa5'
    case 'fase_2': return '#3d8b8b'
    case 'fase_3': return '#c08c3e'
    case 'completato': return '#2b7268'
  }
}

export function getLabelStato(stato: StatoFarmacia): string {
  switch (stato) {
    case 'assegnato': return 'Assegnato'
    case 'fase_1': return 'Fase 1'
    case 'fase_2': return 'Fase 2'
    case 'fase_3': return 'Fase 3'
    case 'completato': return 'Completato'
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

// ── Eventi / Timeline ──

export type EventoTipo =
  | 'fase_iniziata' | 'substep_completato' | 'substep_annullato'
  | 'problema_segnalato' | 'problema_rimosso' | 'foto_caricata'
  | 'fase_completata' | 'sopralluogo_registrato'
  | 'misure_salvate'

export interface RilievoEvento {
  id: string
  farmaciaId: string
  merchandiserId: string
  fase: FaseNumero
  tipo: EventoTipo
  dettaglio?: string
  createdAt: string
}

const substepLabels: Record<string, string> = {
  kitRicevuto: 'Kit materiale ricevuto',
  pezziRicevuti: 'Pezzi di plexiglass ricevuti',
  scaricamentoCompleto: 'Scaricamento/svuotamento scaffale completato',
  montaggioCompleto: 'Montaggio materiale completato',
  prodottiPosizionati: 'Prodotti posizionati sugli scaffali',
}

export function getLabelEvento(tipo: EventoTipo, dettaglio?: string): string {
  switch (tipo) {
    case 'fase_iniziata': return 'Fase iniziata'
    case 'substep_completato': return substepLabels[dettaglio || ''] || dettaglio || 'Sottostep completato'
    case 'substep_annullato': return (substepLabels[dettaglio || ''] || dettaglio || 'Sottostep') + ' (annullato)'
    case 'problema_segnalato': return 'Problema segnalato' + (dettaglio ? `: ${dettaglio}` : '')
    case 'problema_rimosso': return 'Problema rimosso'
    case 'foto_caricata': return 'Foto caricata'
    case 'fase_completata': return 'Fase completata'
    case 'sopralluogo_registrato': return 'Sopralluogo registrato' + (dettaglio ? ` — ${dettaglio}` : '')
    case 'misure_salvate': return 'Misure salvate'
  }
}
