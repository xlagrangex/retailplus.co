import { User, Farmacia, Assegnazione, Rilievo, CampoConfigurazione } from '../types'

export const mockUsers: User[] = [
  { id: 'admin-1', email: 'admin@logplus.it', nome: 'Giuseppe', cognome: 'Mandurino', ruolo: 'admin' },
  { id: 'brand-1', email: 'brand@cosmetica.it', nome: 'Marco', cognome: 'Rossi', ruolo: 'brand' },
  { id: 'merch-1', email: 'anna@logplus.it', nome: 'Anna', cognome: 'Bianchi', ruolo: 'merchandiser', telefono: '333-1234567' },
  { id: 'merch-2', email: 'lucia@logplus.it', nome: 'Lucia', cognome: 'Verdi', ruolo: 'merchandiser', telefono: '339-7654321' },
  { id: 'merch-3', email: 'sara@logplus.it', nome: 'Sara', cognome: 'Neri', ruolo: 'merchandiser', telefono: '347-1112233' },
]

export const mockFarmacie: Farmacia[] = [
  // Campania
  { id: 'f1', nome: 'Farmacia Centrale', indirizzo: 'Via Toledo 156', citta: 'Napoli', provincia: 'NA', cap: '80134', lat: 40.8428, lng: 14.2498, telefono: '081-5551234', referente: 'Dr. Esposito' },
  { id: 'f2', nome: 'Farmacia San Carlo', indirizzo: 'Corso Umberto I 45', citta: 'Napoli', provincia: 'NA', cap: '80138', lat: 40.8496, lng: 14.2641, telefono: '081-5552345', referente: 'Dr.ssa Russo' },
  { id: 'f3', nome: 'Farmacia Vomero', indirizzo: 'Via Scarlatti 89', citta: 'Napoli', provincia: 'NA', cap: '80129', lat: 40.8503, lng: 14.2322, telefono: '081-5553456' },
  { id: 'f4', nome: 'Farmacia del Mare', indirizzo: 'Lungomare Caracciolo 12', citta: 'Napoli', provincia: 'NA', cap: '80122', lat: 40.8300, lng: 14.2350, telefono: '081-5554567' },
  { id: 'f5', nome: 'Farmacia Salerno Centro', indirizzo: 'Corso Vittorio Emanuele 78', citta: 'Salerno', provincia: 'SA', cap: '84121', lat: 40.6794, lng: 14.7688, referente: 'Dr. Adinolfi' },
  // Lazio
  { id: 'f6', nome: 'Farmacia Piazza Navona', indirizzo: 'Via dei Coronari 22', citta: 'Roma', provincia: 'RM', cap: '00186', lat: 41.8994, lng: 12.4731, telefono: '06-5551234' },
  { id: 'f7', nome: 'Farmacia Trastevere', indirizzo: 'Viale di Trastevere 100', citta: 'Roma', provincia: 'RM', cap: '00153', lat: 41.8825, lng: 12.4708, referente: 'Dr.ssa Conti' },
  { id: 'f8', nome: 'Farmacia Prati', indirizzo: 'Via Cola di Rienzo 55', citta: 'Roma', provincia: 'RM', cap: '00192', lat: 41.9084, lng: 12.4620 },
  { id: 'f9', nome: 'Farmacia EUR', indirizzo: 'Viale Europa 150', citta: 'Roma', provincia: 'RM', cap: '00144', lat: 41.8312, lng: 12.4680 },
  { id: 'f10', nome: 'Farmacia Tuscolana', indirizzo: 'Via Tuscolana 320', citta: 'Roma', provincia: 'RM', cap: '00181', lat: 41.8742, lng: 12.5180 },
  // Lombardia
  { id: 'f11', nome: 'Farmacia Duomo', indirizzo: 'Via Torino 15', citta: 'Milano', provincia: 'MI', cap: '20123', lat: 45.4628, lng: 9.1830, telefono: '02-5551234', referente: 'Dr. Colombo' },
  { id: 'f12', nome: 'Farmacia Brera', indirizzo: 'Via Brera 28', citta: 'Milano', provincia: 'MI', cap: '20121', lat: 45.4720, lng: 9.1871 },
  { id: 'f13', nome: 'Farmacia Navigli', indirizzo: 'Ripa di Porta Ticinese 55', citta: 'Milano', provincia: 'MI', cap: '20143', lat: 45.4492, lng: 9.1760 },
  { id: 'f14', nome: 'Farmacia Porta Garibaldi', indirizzo: 'Corso Como 10', citta: 'Milano', provincia: 'MI', cap: '20154', lat: 45.4819, lng: 9.1856 },
  { id: 'f15', nome: 'Farmacia Bergamo Alta', indirizzo: 'Via Gombito 12', citta: 'Bergamo', provincia: 'BG', cap: '24129', lat: 45.7037, lng: 9.6622 },
  // Piemonte
  { id: 'f16', nome: 'Farmacia Po', indirizzo: 'Via Po 25', citta: 'Torino', provincia: 'TO', cap: '10124', lat: 45.0676, lng: 7.6941, referente: 'Dr. Ferraris' },
  { id: 'f17', nome: 'Farmacia San Salvario', indirizzo: 'Via Madama Cristina 30', citta: 'Torino', provincia: 'TO', cap: '10125', lat: 45.0546, lng: 7.6780 },
  // Toscana
  { id: 'f18', nome: 'Farmacia Santa Maria Novella', indirizzo: 'Via della Scala 16', citta: 'Firenze', provincia: 'FI', cap: '50123', lat: 43.7734, lng: 11.2486, referente: 'Dr.ssa Galli' },
  { id: 'f19', nome: 'Farmacia San Lorenzo', indirizzo: 'Via dei Ginori 38', citta: 'Firenze', provincia: 'FI', cap: '50129', lat: 43.7756, lng: 11.2539 },
  { id: 'f20', nome: 'Farmacia Siena', indirizzo: 'Via di Citta 50', citta: 'Siena', provincia: 'SI', cap: '53100', lat: 43.3188, lng: 11.3308 },
  // Veneto
  { id: 'f21', nome: 'Farmacia San Marco', indirizzo: 'Calle Larga XXII Marzo 2399', citta: 'Venezia', provincia: 'VE', cap: '30124', lat: 45.4336, lng: 12.3387 },
  { id: 'f22', nome: 'Farmacia Padova Centro', indirizzo: 'Via Roma 20', citta: 'Padova', provincia: 'PD', cap: '35122', lat: 45.4064, lng: 11.8768 },
  // Emilia Romagna
  { id: 'f23', nome: 'Farmacia Bologna Centro', indirizzo: 'Via Rizzoli 10', citta: 'Bologna', provincia: 'BO', cap: '40125', lat: 44.4937, lng: 11.3467, referente: 'Dr. Barbieri' },
  { id: 'f24', nome: 'Farmacia Parma', indirizzo: 'Strada della Repubblica 45', citta: 'Parma', provincia: 'PR', cap: '43121', lat: 44.8018, lng: 10.3278 },
  // Puglia
  { id: 'f25', nome: 'Farmacia Bari Vecchia', indirizzo: 'Via Sparano 100', citta: 'Bari', provincia: 'BA', cap: '70121', lat: 41.1259, lng: 16.8700, referente: 'Dr.ssa Lorusso' },
  { id: 'f26', nome: 'Farmacia Lecce', indirizzo: 'Via Trinchese 22', citta: 'Lecce', provincia: 'LE', cap: '73100', lat: 40.3529, lng: 18.1719 },
  // Sicilia
  { id: 'f27', nome: 'Farmacia Palermo Liberta', indirizzo: 'Via Liberta 150', citta: 'Palermo', provincia: 'PA', cap: '90143', lat: 38.1271, lng: 13.3475, telefono: '091-5551234' },
  { id: 'f28', nome: 'Farmacia Catania Etna', indirizzo: 'Via Etnea 80', citta: 'Catania', provincia: 'CT', cap: '95131', lat: 37.5079, lng: 15.0869 },
  // Sardegna
  { id: 'f29', nome: 'Farmacia Cagliari Marina', indirizzo: 'Via Roma 75', citta: 'Cagliari', provincia: 'CA', cap: '09124', lat: 39.2167, lng: 9.1089 },
  // Liguria
  { id: 'f30', nome: 'Farmacia Genova Porto', indirizzo: 'Via XX Settembre 30', citta: 'Genova', provincia: 'GE', cap: '16121', lat: 44.4093, lng: 8.9337, referente: 'Dr. Parodi' },
]

export const mockAssegnazioni: Assegnazione[] = [
  // Anna (merch-1) - Campania + parte Lazio
  { farmaciaId: 'f1', merchandiserId: 'merch-1' },
  { farmaciaId: 'f2', merchandiserId: 'merch-1' },
  { farmaciaId: 'f3', merchandiserId: 'merch-1' },
  { farmaciaId: 'f4', merchandiserId: 'merch-1' },
  { farmaciaId: 'f5', merchandiserId: 'merch-1' },
  { farmaciaId: 'f6', merchandiserId: 'merch-1' },
  { farmaciaId: 'f7', merchandiserId: 'merch-1' },
  { farmaciaId: 'f25', merchandiserId: 'merch-1' },
  { farmaciaId: 'f26', merchandiserId: 'merch-1' },
  { farmaciaId: 'f27', merchandiserId: 'merch-1' },
  { farmaciaId: 'f28', merchandiserId: 'merch-1' },
  // Lucia (merch-2) - Nord
  { farmaciaId: 'f8', merchandiserId: 'merch-2' },
  { farmaciaId: 'f9', merchandiserId: 'merch-2' },
  { farmaciaId: 'f10', merchandiserId: 'merch-2' },
  { farmaciaId: 'f11', merchandiserId: 'merch-2' },
  { farmaciaId: 'f12', merchandiserId: 'merch-2' },
  { farmaciaId: 'f13', merchandiserId: 'merch-2' },
  { farmaciaId: 'f14', merchandiserId: 'merch-2' },
  { farmaciaId: 'f15', merchandiserId: 'merch-2' },
  { farmaciaId: 'f16', merchandiserId: 'merch-2' },
  { farmaciaId: 'f17', merchandiserId: 'merch-2' },
  // Sara (merch-3) - Centro + resto
  { farmaciaId: 'f18', merchandiserId: 'merch-3' },
  { farmaciaId: 'f19', merchandiserId: 'merch-3' },
  { farmaciaId: 'f20', merchandiserId: 'merch-3' },
  { farmaciaId: 'f21', merchandiserId: 'merch-3' },
  { farmaciaId: 'f22', merchandiserId: 'merch-3' },
  { farmaciaId: 'f23', merchandiserId: 'merch-3' },
  { farmaciaId: 'f24', merchandiserId: 'merch-3' },
  { farmaciaId: 'f29', merchandiserId: 'merch-3' },
  { farmaciaId: 'f30', merchandiserId: 'merch-3' },
]

// Alcuni rilievi pre-compilati per la demo
export const mockRilievi: Rilievo[] = [
  // Farmacia f1 - tutte e 3 le fasi complete (verde)
  { id: 'r1', farmaciaId: 'f1', merchandiserId: 'merch-1', fase: 1, profonditaScaffale: 35, profonditaMensola: 30, larghezza: 80, altezza: 200, numScaffali: 5, foto: [], completata: true, dataCompletamento: '2026-02-15', oraCompletamento: '10:30' },
  { id: 'r2', farmaciaId: 'f1', merchandiserId: 'merch-1', fase: 2, pezziRicevuti: true, montaggioCompleto: true, foto: [], completata: true, dataCompletamento: '2026-02-18', oraCompletamento: '14:15', note: 'Plexiglass montato senza problemi, biadesivo tiene bene' },
  { id: 'r3', farmaciaId: 'f1', merchandiserId: 'merch-1', fase: 3, prodottiPosizionati: true, foto: [], completata: true, dataCompletamento: '2026-02-20', oraCompletamento: '11:00', note: 'Tutti i prodotti posizionati correttamente' },
  // Farmacia f2 - fase 1 e 2 complete (giallo)
  { id: 'r4', farmaciaId: 'f2', merchandiserId: 'merch-1', fase: 1, profonditaScaffale: 30, profonditaMensola: 28, larghezza: 90, altezza: 180, numScaffali: 4, foto: [], completata: true, dataCompletamento: '2026-02-16', oraCompletamento: '09:45' },
  { id: 'r5', farmaciaId: 'f2', merchandiserId: 'merch-1', fase: 2, pezziRicevuti: true, montaggioCompleto: true, foto: [], completata: true, dataCompletamento: '2026-02-19', oraCompletamento: '16:30' },
  // Farmacia f3 - solo fase 1 (giallo)
  { id: 'r6', farmaciaId: 'f3', merchandiserId: 'merch-1', fase: 1, profonditaScaffale: 40, profonditaMensola: 35, larghezza: 100, altezza: 210, numScaffali: 6, foto: [], completata: true, dataCompletamento: '2026-02-17', oraCompletamento: '11:20' },
  // Farmacia f11 - tutte complete (verde)
  { id: 'r7', farmaciaId: 'f11', merchandiserId: 'merch-2', fase: 1, profonditaScaffale: 32, profonditaMensola: 30, larghezza: 85, altezza: 195, numScaffali: 5, foto: [], completata: true, dataCompletamento: '2026-02-14', oraCompletamento: '10:00' },
  { id: 'r8', farmaciaId: 'f11', merchandiserId: 'merch-2', fase: 2, pezziRicevuti: true, montaggioCompleto: true, foto: [], completata: true, dataCompletamento: '2026-02-17', oraCompletamento: '15:30' },
  { id: 'r9', farmaciaId: 'f11', merchandiserId: 'merch-2', fase: 3, prodottiPosizionati: true, foto: [], completata: true, dataCompletamento: '2026-02-21', oraCompletamento: '12:00' },
  // Farmacia f18 - fase 1 completa (giallo)
  { id: 'r10', farmaciaId: 'f18', merchandiserId: 'merch-3', fase: 1, profonditaScaffale: 38, profonditaMensola: 34, larghezza: 75, altezza: 190, numScaffali: 4, foto: [], completata: true, dataCompletamento: '2026-02-18', oraCompletamento: '09:30' },
  // Farmacia f23 - tutte complete (verde)
  { id: 'r11', farmaciaId: 'f23', merchandiserId: 'merch-3', fase: 1, profonditaScaffale: 36, profonditaMensola: 33, larghezza: 95, altezza: 200, numScaffali: 5, foto: [], completata: true, dataCompletamento: '2026-02-13', oraCompletamento: '10:15' },
  { id: 'r12', farmaciaId: 'f23', merchandiserId: 'merch-3', fase: 2, pezziRicevuti: true, montaggioCompleto: true, foto: [], completata: true, dataCompletamento: '2026-02-16', oraCompletamento: '14:00' },
  { id: 'r13', farmaciaId: 'f23', merchandiserId: 'merch-3', fase: 3, prodottiPosizionati: true, foto: [], completata: true, dataCompletamento: '2026-02-19', oraCompletamento: '11:45' },
]

// Helper per inizializzare localStorage
const STORAGE_KEYS = {
  users: 'logplus_users',
  farmacie: 'logplus_farmacie',
  assegnazioni: 'logplus_assegnazioni',
  rilievi: 'logplus_rilievi',
}

export function initMockData() {
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
