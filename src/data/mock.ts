import { User, Farmacia, Assegnazione, Rilievo, CampoConfigurazione } from '../types'
import importedFarmacie from './farmacie-import.json'

export const mockUsers: User[] = [
  { id: 'admin-1', email: 'admin@logplus.it', nome: 'Giuseppe', cognome: 'Mandurino', ruolo: 'admin' },
  { id: 'brand-1', email: 'brand@cosmetica.it', nome: 'Marco', cognome: 'Rossi', ruolo: 'brand' },
  { id: 'merch-1', email: 'anna@logplus.it', nome: 'Anna', cognome: 'Bianchi', ruolo: 'merchandiser', telefono: '333-1234567' },
  { id: 'merch-2', email: 'lucia@logplus.it', nome: 'Lucia', cognome: 'Verdi', ruolo: 'merchandiser', telefono: '339-7654321' },
  { id: 'merch-3', email: 'sara@logplus.it', nome: 'Sara', cognome: 'Neri', ruolo: 'merchandiser', telefono: '347-1112233' },
]

// 486 farmacie importate da Excel (lista provvisoria)
export const mockFarmacie: Farmacia[] = importedFarmacie as Farmacia[]

export const mockAssegnazioni: Assegnazione[] = []

export const mockRilievi: Rilievo[] = []

// Helper per inizializzare localStorage
const STORAGE_KEYS = {
  users: 'logplus_users',
  farmacie: 'logplus_farmacie',
  assegnazioni: 'logplus_assegnazioni',
  rilievi: 'logplus_rilievi',
}

// Bump this version when mock data changes to force localStorage reset
const MOCK_DATA_VERSION = '2'
const VERSION_KEY = 'logplus_mock_version'

export function initMockData() {
  const storedVersion = localStorage.getItem(VERSION_KEY)
  if (storedVersion !== MOCK_DATA_VERSION) {
    // Data changed — force reset
    localStorage.setItem(VERSION_KEY, MOCK_DATA_VERSION)
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(mockUsers))
    localStorage.setItem(STORAGE_KEYS.farmacie, JSON.stringify(mockFarmacie))
    localStorage.setItem(STORAGE_KEYS.assegnazioni, JSON.stringify(mockAssegnazioni))
    localStorage.setItem(STORAGE_KEYS.rilievi, JSON.stringify(mockRilievi))
    return
  }
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(mockUsers))
  }
  if (!localStorage.getItem(STORAGE_KEYS.farmacie)) {
    localStorage.setItem(STORAGE_KEYS.farmacie, JSON.stringify(mockFarmacie))
  }
  if (!localStorage.getItem(STORAGE_KEYS.assegnazioni)) {
    localStorage.setItem(STORAGE_KEYS.assegnazioni, JSON.stringify(mockAssegnazioni))
  }
  if (!localStorage.getItem(STORAGE_KEYS.rilievi)) {
    localStorage.setItem(STORAGE_KEYS.rilievi, JSON.stringify(mockRilievi))
  }
}

export function resetMockData() {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(mockUsers))
  localStorage.setItem(STORAGE_KEYS.farmacie, JSON.stringify(mockFarmacie))
  localStorage.setItem(STORAGE_KEYS.assegnazioni, JSON.stringify(mockAssegnazioni))
  localStorage.setItem(STORAGE_KEYS.rilievi, JSON.stringify(mockRilievi))
}

// CRUD helpers
export function getUsers(): User[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]')
}
export function saveUsers(users: User[]) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users))
}

export function getFarmacie(): Farmacia[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.farmacie) || '[]')
}
export function saveFarmacie(farmacie: Farmacia[]) {
  localStorage.setItem(STORAGE_KEYS.farmacie, JSON.stringify(farmacie))
}

export function getAssegnazioni(): Assegnazione[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.assegnazioni) || '[]')
}
export function saveAssegnazioni(assegnazioni: Assegnazione[]) {
  localStorage.setItem(STORAGE_KEYS.assegnazioni, JSON.stringify(assegnazioni))
}

export function getRilievi(): Rilievo[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.rilievi) || '[]')
}
export function saveRilievi(rilievi: Rilievo[]) {
  localStorage.setItem(STORAGE_KEYS.rilievi, JSON.stringify(rilievi))
}

// Default campo configurazione (Fase 1 measurement fields)
export const defaultCampiConfigurazione: CampoConfigurazione[] = [
  { id: 'campo-1', fase: 1, nome: 'profonditaScaffale', label: 'Profondita scaffale', descrizione: 'Struttura esterna dell\'espositore', tipo: 'number', unita: 'cm', obbligatorio: true, ordine: 1, attivo: true },
  { id: 'campo-2', fase: 1, nome: 'profonditaMensola', label: 'Profondita mensola', descrizione: 'Ripiano interno, dove si appoggiano i prodotti', tipo: 'number', unita: 'cm', obbligatorio: true, ordine: 2, attivo: true },
  { id: 'campo-3', fase: 1, nome: 'larghezza', label: 'Larghezza', tipo: 'number', unita: 'cm', obbligatorio: true, ordine: 3, attivo: true },
  { id: 'campo-4', fase: 1, nome: 'altezza', label: 'Altezza', tipo: 'number', unita: 'cm', obbligatorio: true, ordine: 4, attivo: true },
  { id: 'campo-5', fase: 1, nome: 'numScaffali', label: 'Numero scaffali', tipo: 'number', unita: 'pz', obbligatorio: true, ordine: 5, attivo: true },
]

export function getCampiConfigurazione(): CampoConfigurazione[] {
  const stored = localStorage.getItem('campi_configurazione')
  if (stored) return JSON.parse(stored)
  return defaultCampiConfigurazione
}

export function saveCampiConfigurazione(campi: CampoConfigurazione[]) {
  localStorage.setItem('campi_configurazione', JSON.stringify(campi))
}
