import { supabase } from '../lib/supabase'
import { User, Farmacia, Assegnazione, Rilievo, FaseNumero } from '../types'

// ── Mapping helpers (snake_case DB ↔ camelCase TS) ──

function userFromDb(row: any): User {
  return {
    id: row.id,
    email: row.email,
    nome: row.nome,
    cognome: row.cognome,
    ruolo: row.ruolo,
    telefono: row.telefono || undefined,
  }
}

function farmaciaFromDb(row: any): Farmacia {
  return {
    id: row.id,
    nome: row.nome,
    indirizzo: row.indirizzo,
    citta: row.citta,
    provincia: row.provincia,
    cap: row.cap,
    lat: row.lat,
    lng: row.lng,
    telefono: row.telefono || undefined,
    referente: row.referente || undefined,
    email: row.email || undefined,
    note: row.note || undefined,
    planogrammaUrl: row.planogramma_url || undefined,
  }
}

function assegnazioneFromDb(row: any): Assegnazione {
  return {
    farmaciaId: row.farmacia_id,
    merchandiserId: row.merchandiser_id,
  }
}

function rilievoFromDb(row: any): Rilievo {
  return {
    id: row.id,
    farmaciaId: row.farmacia_id,
    merchandiserId: row.merchandiser_id,
    fase: row.fase as FaseNumero,
    profonditaScaffale: row.profondita_scaffale ?? undefined,
    profonditaMensola: row.profondita_mensola ?? undefined,
    larghezza: row.larghezza ?? undefined,
    altezza: row.altezza ?? undefined,
    numScaffali: row.num_scaffali ?? undefined,
    pezziRicevuti: row.pezzi_ricevuti ?? undefined,
    montaggioCompleto: row.montaggio_completo ?? undefined,
    kitRicevuto: row.kit_ricevuto ?? undefined,
    problemaKit: row.problema_kit ?? undefined,
    descrizioneProblema: row.descrizione_problema || undefined,
    fotoProblema: row.foto_problema || undefined,
    prodottiPosizionati: row.prodotti_posizionati ?? undefined,
    foto: row.foto || [],
    note: row.note || undefined,
    completata: row.completata ?? false,
    dataCompletamento: row.data_completamento || undefined,
    oraCompletamento: row.ora_completamento || undefined,
    inAttesaMateriale: row.in_attesa_materiale ?? undefined,
  }
}

function rilievoToDb(r: Rilievo): any {
  return {
    id: r.id,
    farmacia_id: r.farmaciaId,
    merchandiser_id: r.merchandiserId,
    fase: r.fase,
    profondita_scaffale: r.profonditaScaffale ?? null,
    profondita_mensola: r.profonditaMensola ?? null,
    larghezza: r.larghezza ?? null,
    altezza: r.altezza ?? null,
    num_scaffali: r.numScaffali ?? null,
    pezzi_ricevuti: r.pezziRicevuti ?? false,
    montaggio_completo: r.montaggioCompleto ?? false,
    kit_ricevuto: r.kitRicevuto ?? false,
    problema_kit: r.problemaKit ?? false,
    descrizione_problema: r.descrizioneProblema ?? null,
    foto_problema: r.fotoProblema ?? null,
    prodotti_posizionati: r.prodottiPosizionati ?? false,
    foto: r.foto || [],
    note: r.note || null,
    completata: r.completata,
    data_completamento: r.dataCompletamento || null,
    ora_completamento: r.oraCompletamento || null,
    in_attesa_materiale: r.inAttesaMateriale ?? false,
  }
}

function farmaciaToDb(f: Farmacia): any {
  return {
    id: f.id,
    nome: f.nome,
    indirizzo: f.indirizzo,
    citta: f.citta,
    provincia: f.provincia,
    cap: f.cap,
    lat: f.lat,
    lng: f.lng,
    telefono: f.telefono || null,
    referente: f.referente || null,
    email: f.email || null,
    note: f.note || null,
    planogramma_url: f.planogrammaUrl || null,
  }
}

// ── Fetch functions ──

export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*')
  if (error) throw error
  return (data || []).map(userFromDb)
}

export async function fetchFarmacie(): Promise<Farmacia[]> {
  const { data, error } = await supabase.from('farmacie').select('*')
  if (error) throw error
  return (data || []).map(farmaciaFromDb)
}

export async function fetchAssegnazioni(): Promise<Assegnazione[]> {
  const { data, error } = await supabase.from('assegnazioni').select('*')
  if (error) throw error
  return (data || []).map(assegnazioneFromDb)
}

export async function fetchRilievi(): Promise<Rilievo[]> {
  const { data, error } = await supabase.from('rilievi').select('*')
  if (error) throw error
  return (data || []).map(rilievoFromDb)
}

// ── CRUD functions ──

export async function insertFarmacia(f: Farmacia): Promise<void> {
  const { error } = await supabase.from('farmacie').insert(farmaciaToDb(f))
  if (error) throw error
}

export async function insertFarmacie(list: Farmacia[]): Promise<void> {
  const { error } = await supabase.from('farmacie').insert(list.map(farmaciaToDb))
  if (error) throw error
}

export async function updateFarmaciaDb(id: string, updates: Partial<Farmacia>): Promise<void> {
  const dbUpdates: any = {}
  if (updates.planogrammaUrl !== undefined) dbUpdates.planogramma_url = updates.planogrammaUrl
  if (updates.email !== undefined) dbUpdates.email = updates.email
  if (updates.nome !== undefined) dbUpdates.nome = updates.nome
  if (updates.telefono !== undefined) dbUpdates.telefono = updates.telefono
  if (updates.referente !== undefined) dbUpdates.referente = updates.referente
  if (updates.note !== undefined) dbUpdates.note = updates.note
  const { error } = await supabase.from('farmacie').update(dbUpdates).eq('id', id)
  if (error) throw error
}

export async function deleteFarmaciaDb(id: string): Promise<void> {
  const { error } = await supabase.from('farmacie').delete().eq('id', id)
  if (error) throw error
}

export async function insertUser(u: User): Promise<void> {
  const { error } = await supabase.from('users').insert({
    id: u.id,
    email: u.email,
    nome: u.nome,
    cognome: u.cognome,
    ruolo: u.ruolo,
    telefono: u.telefono || null,
  })
  if (error) throw error
}

export async function deleteUserDb(id: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) throw error
}

export async function upsertAssegnazione(farmaciaId: string, merchandiserId: string): Promise<void> {
  // Remove existing assignment for this farmacia, then insert new one
  await supabase.from('assegnazioni').delete().eq('farmacia_id', farmaciaId)
  const { error } = await supabase.from('assegnazioni').insert({
    farmacia_id: farmaciaId,
    merchandiser_id: merchandiserId,
  })
  if (error) throw error
}

export async function deleteAssegnazione(farmaciaId: string): Promise<void> {
  const { error } = await supabase.from('assegnazioni').delete().eq('farmacia_id', farmaciaId)
  if (error) throw error
}

export async function upsertRilievo(r: Rilievo): Promise<void> {
  const { error } = await supabase.from('rilievi').upsert(rilievoToDb(r), {
    onConflict: 'id',
  })
  if (error) throw error
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single()
  if (data && !error) return userFromDb(data)
  return null
}
