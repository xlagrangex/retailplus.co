import { useState } from 'react'
import { useData } from '../context/DataContext'
import StatsCards from '../components/StatsCards'
import FarmaciaMap from '../components/FarmaciaMap'
import { getStatoFarmacia, getLabelStato, getColoreStato, getLabelFase, User, Farmacia, StatoFarmacia, CampoConfigurazione, FaseNumero } from '../types'
import { isSupabaseConfigured } from '../lib/supabase'
import { uploadPlanogramma } from '../lib/supabase'
import {
  Upload, Plus, Trash2, UserPlus, Link2, Unlink, Search, MapPin, Users,
  AlertTriangle, ImagePlus, ArrowRightLeft, X, LayoutList, Columns, Filter,
  Settings, ChevronUp, ChevronDown, GripVertical,
} from 'lucide-react'
import Papa from 'papaparse'

export default function AdminDashboard() {
  const { farmacie, rilievi, users, assegnazioni } = useData()
  const merchandisers = users.filter(u => u.ruolo === 'merchandiser')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Pannello di controllo</h1>
        <p className="page-subtitle">Gestione completa farmacie, merchandiser e allestimenti</p>
      </div>
      <StatsCards farmacie={farmacie} rilievi={rilievi} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-brand-500" />
            <p className="text-xs text-brand-500 font-medium">Merchandiser attive</p>
          </div>
          <p className="text-2xl font-semibold text-brand-900">{merchandisers.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-brand-500 font-medium mb-1">Farmacie assegnate</p>
          <p className="text-2xl font-semibold text-brand-900">
            {assegnazioni.length} <span className="text-sm font-normal text-brand-400">/ {farmacie.length}</span>
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-warning-500" />
            <p className="text-xs text-brand-500 font-medium">Non assegnate</p>
          </div>
          <p className="text-2xl font-semibold text-danger-500">{farmacie.length - assegnazioni.length}</p>
        </div>
      </div>
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-brand-700 mb-3">Distribuzione nazionale</h2>
        <FarmaciaMap farmacie={farmacie} rilievi={rilievi} height="350px" />
      </div>
    </div>
  )
}

export function AdminFarmaciePage() {
  const { farmacie, rilievi, assegnazioni, users, addFarmacia, removeFarmacia, importFarmacie, assignFarmacia, unassignFarmacia, updateFarmacia } = useData()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [uploadingPlanogramma, setUploadingPlanogramma] = useState<string | null>(null)
  const merchandisers = users.filter(u => u.ruolo === 'merchandiser')

  const filtered = farmacie.filter(f =>
    (f.nome + f.citta + f.indirizzo + f.provincia).toLowerCase().includes(search.toLowerCase())
  )

  function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const newFarmacie: Farmacia[] = result.data.map((row: any, i: number) => ({
          id: `imp-${Date.now()}-${i}`,
          nome: row.nome || row.Farmacia || row.name || '',
          indirizzo: row.indirizzo || row.Indirizzo || row.address || '',
          citta: row.citta || row.Citta || row.city || '',
          provincia: row.provincia || row.Provincia || '',
          cap: row.cap || row.CAP || '',
          lat: parseFloat(row.lat || row.latitudine || '41.9') || 41.9,
          lng: parseFloat(row.lng || row.longitudine || '12.5') || 12.5,
          telefono: row.telefono || row.Telefono || '',
          referente: row.referente || row.Referente || '',
        })).filter((f: Farmacia) => f.nome)
        importFarmacie(newFarmacie)
        alert(`Importate ${newFarmacie.length} farmacie`)
      }
    })
    e.target.value = ''
  }

  function handleAddManual(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const f: Farmacia = {
      id: `man-${Date.now()}`,
      nome: fd.get('nome') as string,
      indirizzo: fd.get('indirizzo') as string,
      citta: fd.get('citta') as string,
      provincia: fd.get('provincia') as string,
      cap: fd.get('cap') as string,
      lat: parseFloat(fd.get('lat') as string) || 41.9,
      lng: parseFloat(fd.get('lng') as string) || 12.5,
      telefono: fd.get('telefono') as string,
      referente: fd.get('referente') as string,
    }
    addFarmacia(f)
    setShowAdd(false)
  }

  // Task 8: Planogramma upload
  async function handlePlanogrammaUpload(farmaciaId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPlanogramma(farmaciaId)

    if (isSupabaseConfigured) {
      try {
        const url = await uploadPlanogramma(file, farmaciaId)
        updateFarmacia(farmaciaId, { planogrammaUrl: url })
      } catch (err) {
        console.error('Upload planogramma failed:', err)
        alert('Errore durante il caricamento del planogramma')
      }
    } else {
      // Fallback: base64
      const reader = new FileReader()
      reader.onload = () => {
        updateFarmacia(farmaciaId, { planogrammaUrl: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
    setUploadingPlanogramma(null)
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Gestione farmacie</h1>
          <p className="page-subtitle">{farmacie.length} punti vendita nel database</p>
        </div>
        <div className="flex gap-2">
          <label className="btn-secondary cursor-pointer">
            <Upload size={15} /> Importa CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
          </label>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary">
            <Plus size={15} /> Aggiungi
          </button>
        </div>
      </div>

      {/* Form aggiunta manuale */}
      {showAdd && (
        <form onSubmit={handleAddManual} className="card p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 md:col-span-4 mb-1">
            <h3 className="text-sm font-semibold text-brand-700">Nuova farmacia</h3>
          </div>
          <input name="nome" placeholder="Nome farmacia *" required className="col-span-2 input" />
          <input name="indirizzo" placeholder="Indirizzo *" required className="col-span-2 input" />
          <input name="citta" placeholder="Citta *" required className="input" />
          <input name="provincia" placeholder="Provincia" className="input" />
          <input name="cap" placeholder="CAP" className="input" />
          <input name="telefono" placeholder="Telefono" className="input" />
          <input name="referente" placeholder="Referente" className="input" />
          <input name="lat" placeholder="Latitudine" className="input" />
          <input name="lng" placeholder="Longitudine" className="input" />
          <div className="flex gap-2 col-span-2 md:col-span-1">
            <button type="submit" className="btn-primary">Salva</button>
            <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost">Annulla</button>
          </div>
        </form>
      )}

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
        <input type="text" placeholder="Cerca farmacia..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Farmacia</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider hidden sm:table-cell">Localita</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Stato</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Merchandiser</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {filtered.map(f => {
                const stato = getStatoFarmacia(rilievi, f.id)
                const assegnazione = assegnazioni.find(a => a.farmaciaId === f.id)
                const merch = assegnazione ? users.find(u => u.id === assegnazione.merchandiserId) : null
                const statoColors: Record<StatoFarmacia, { bg: string; text: string; border: string; dot: string }> = {
                  da_fare: { bg: 'bg-danger-50', text: 'text-danger-600', border: 'border-danger-100', dot: '#d64545' },
                  in_corso: { bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-100', dot: '#de911d' },
                  completata: { bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-100', dot: '#3f9142' },
                  in_attesa: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', dot: '#6366f1' },
                }
                const sc = statoColors[stato]

                return (
                  <tr key={f.id} className="hover:bg-brand-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-brand-900 text-[13px]">{f.nome}</p>
                      <p className="text-xs text-brand-400">{f.indirizzo}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-brand-600 hidden sm:table-cell">{f.citta}</td>
                    <td className="px-4 py-3.5">
                      <span className={`badge ${sc.bg} ${sc.text} border ${sc.border}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.dot }} />
                        {getLabelStato(stato)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {assigning === f.id ? (
                        <select
                          className="input py-1.5 text-xs"
                          defaultValue=""
                          onChange={e => { if (e.target.value) assignFarmacia(f.id, e.target.value); setAssigning(null) }}
                          onBlur={() => setAssigning(null)}
                          autoFocus
                        >
                          <option value="">Seleziona...</option>
                          {merchandisers.map(m => (
                            <option key={m.id} value={m.id}>{m.nome} {m.cognome}</option>
                          ))}
                        </select>
                      ) : merch ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-brand-100 flex items-center justify-center">
                            <span className="text-[10px] font-semibold text-brand-600">{merch.nome[0]}{merch.cognome[0]}</span>
                          </div>
                          <span className="text-[13px] text-brand-700">{merch.nome} {merch.cognome}</span>
                          <button onClick={() => unassignFarmacia(f.id)} className="text-brand-300 hover:text-danger-500 transition-colors" title="Rimuovi assegnazione">
                            <Unlink size={13} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setAssigning(f.id)} className="text-accent-600 hover:text-accent-700 text-xs font-medium flex items-center gap-1 transition-colors">
                          <Link2 size={13} /> Assegna
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {/* Task 8: Planogramma upload */}
                        <label className="text-brand-300 hover:text-accent-500 transition-colors cursor-pointer p-1" title="Carica planogramma">
                          {uploadingPlanogramma === f.id ? (
                            <div className="w-4 h-4 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <ImagePlus size={15} className={f.planogrammaUrl ? 'text-accent-500' : ''} />
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={e => handlePlanogrammaUpload(f.id, e)} />
                        </label>
                        <button
                          onClick={() => { if (confirm('Eliminare questa farmacia?')) removeFarmacia(f.id) }}
                          className="text-brand-300 hover:text-danger-500 transition-colors p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// MERCHANDISER PAGE — Table + Kanban views
// ============================================================

const statoColors: Record<StatoFarmacia, { bg: string; text: string; border: string; dot: string }> = {
  da_fare: { bg: 'bg-danger-50', text: 'text-danger-600', border: 'border-danger-100', dot: '#d64545' },
  in_corso: { bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-100', dot: '#de911d' },
  completata: { bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-100', dot: '#3f9142' },
  in_attesa: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', dot: '#6366f1' },
}

export function AdminMerchandiserPage() {
  const { users, assegnazioni, farmacie, rilievi, addUser, removeUser, assignFarmacia, unassignFarmacia } = useData()
  const merchandisers = users.filter(u => u.ruolo === 'merchandiser')
  const [showAdd, setShowAdd] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const u: User = {
      id: `merch-${Date.now()}`,
      email: fd.get('email') as string,
      nome: fd.get('nome') as string,
      cognome: fd.get('cognome') as string,
      ruolo: 'merchandiser',
      telefono: fd.get('telefono') as string,
    }
    addUser(u)
    setShowAdd(false)
  }

  const totalAssigned = assegnazioni.length
  const totalUnassigned = farmacie.length - new Set(assegnazioni.map(a => a.farmaciaId)).size

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Merchandiser e assegnazioni</h1>
          <p className="page-subtitle">{merchandisers.length} operatrici — {farmacie.length} farmacie</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-sm border border-brand-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-brand-900 text-white'
                  : 'bg-white text-brand-500 hover:bg-brand-50'
              }`}
            >
              <LayoutList size={13} /> Tabella
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-brand-900 text-white'
                  : 'bg-white text-brand-500 hover:bg-brand-50'
              }`}
            >
              <Columns size={13} /> Kanban
            </button>
          </div>
          <button type="button" onClick={() => setShowAdd(!showAdd)} className="btn-primary">
            <UserPlus size={15} /> Aggiungi
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <p className="text-xl font-semibold text-brand-900">{merchandisers.length}</p>
          <p className="text-[11px] text-brand-500">Merchandiser</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-semibold text-success-600">{totalAssigned}</p>
          <p className="text-[11px] text-brand-500">Assegnate</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-semibold text-danger-500">{totalUnassigned}</p>
          <p className="text-[11px] text-brand-500">Non assegnate</p>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="card p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 md:col-span-4 mb-1">
            <h3 className="text-sm font-semibold text-brand-700">Nuova merchandiser</h3>
          </div>
          <input name="nome" placeholder="Nome *" required className="input" />
          <input name="cognome" placeholder="Cognome *" required className="input" />
          <input name="email" type="email" placeholder="Email *" required className="input" />
          <input name="telefono" placeholder="Telefono" className="input" />
          <div className="col-span-2 md:col-span-4 flex gap-2">
            <button type="submit" className="btn-primary">Salva</button>
            <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost">Annulla</button>
          </div>
        </form>
      )}

      {/* View content */}
      {viewMode === 'table' ? (
        <AssignmentTableView
          farmacie={farmacie}
          rilievi={rilievi}
          assegnazioni={assegnazioni}
          merchandisers={merchandisers}
          users={users}
          assignFarmacia={assignFarmacia}
          unassignFarmacia={unassignFarmacia}
          removeUser={removeUser}
        />
      ) : (
        <AssignmentKanbanView
          farmacie={farmacie}
          rilievi={rilievi}
          assegnazioni={assegnazioni}
          merchandisers={merchandisers}
          assignFarmacia={assignFarmacia}
          unassignFarmacia={unassignFarmacia}
          removeUser={removeUser}
        />
      )}
    </div>
  )
}

// ============================================================
// TABLE VIEW
// ============================================================

function AssignmentTableView({
  farmacie, rilievi, assegnazioni, merchandisers, users,
  assignFarmacia, unassignFarmacia, removeUser,
}: {
  farmacie: Farmacia[]; rilievi: any[]; assegnazioni: any[]; merchandisers: User[]; users: User[]
  assignFarmacia: (fId: string, mId: string) => void
  unassignFarmacia: (fId: string) => void
  removeUser: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const [filterStato, setFilterStato] = useState<string>('tutti')
  const [filterMerch, setFilterMerch] = useState<string>('tutti')
  const [assigning, setAssigning] = useState<string | null>(null)

  const filtered = farmacie.filter(f => {
    const matchSearch = (f.nome + f.citta + f.indirizzo + f.provincia).toLowerCase().includes(search.toLowerCase())
    const stato = getStatoFarmacia(rilievi, f.id)
    const matchStato = filterStato === 'tutti' || stato === filterStato
    const assegnazione = assegnazioni.find((a: any) => a.farmaciaId === f.id)
    const matchMerch = filterMerch === 'tutti' ||
      (filterMerch === 'non_assegnate' && !assegnazione) ||
      (assegnazione && assegnazione.merchandiserId === filterMerch)
    return matchSearch && matchStato && matchMerch
  })

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input
            type="text"
            placeholder="Cerca farmacia..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 py-2"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-brand-400" />
          <select
            value={filterStato}
            onChange={e => setFilterStato(e.target.value)}
            className="input py-2 text-xs w-auto pr-8"
          >
            <option value="tutti">Tutti gli stati</option>
            <option value="da_fare">Da fare</option>
            <option value="in_corso">In corso</option>
            <option value="completata">Completata</option>
            <option value="in_attesa">In attesa</option>
          </select>
        </div>
        <select
          value={filterMerch}
          onChange={e => setFilterMerch(e.target.value)}
          className="input py-2 text-xs w-auto pr-8"
        >
          <option value="tutti">Tutte le merchandiser</option>
          <option value="non_assegnate">Non assegnate</option>
          {merchandisers.map(m => (
            <option key={m.id} value={m.id}>{m.nome} {m.cognome}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Farmacia</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider hidden sm:table-cell">Citta</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Stato</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Merchandiser</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider w-20">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {filtered.map(f => {
                const stato = getStatoFarmacia(rilievi, f.id)
                const assegnazione = assegnazioni.find((a: any) => a.farmaciaId === f.id)
                const merch = assegnazione ? users.find(u => u.id === assegnazione.merchandiserId) : null
                const sc = statoColors[stato]

                return (
                  <tr key={f.id} className="hover:bg-brand-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-900 text-[13px]">{f.nome}</p>
                      <p className="text-xs text-brand-400">{f.indirizzo}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-brand-600 hidden sm:table-cell">
                      {f.citta} <span className="text-brand-400">({f.provincia})</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${sc.bg} ${sc.text} border ${sc.border}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.dot }} />
                        {getLabelStato(stato)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {assigning === f.id ? (
                        <select
                          className="input py-1.5 text-xs"
                          defaultValue=""
                          onChange={e => { if (e.target.value) assignFarmacia(f.id, e.target.value); setAssigning(null) }}
                          onBlur={() => setAssigning(null)}
                          autoFocus
                        >
                          <option value="">Seleziona...</option>
                          {merchandisers.map(m => (
                            <option key={m.id} value={m.id}>{m.nome} {m.cognome}</option>
                          ))}
                        </select>
                      ) : merch ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-sm bg-brand-100 flex items-center justify-center">
                            <span className="text-[10px] font-semibold text-brand-600">{merch.nome[0]}{merch.cognome[0]}</span>
                          </div>
                          <span className="text-[13px] text-brand-700">{merch.nome} {merch.cognome}</span>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setAssigning(f.id)} className="text-accent-600 hover:text-accent-700 text-xs font-medium flex items-center gap-1 transition-colors">
                          <Link2 size={13} /> Assegna
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {merch && (
                          <button
                            type="button"
                            onClick={() => setAssigning(f.id)}
                            className="text-brand-300 hover:text-accent-500 transition-colors p-1"
                            title="Riassegna"
                          >
                            <ArrowRightLeft size={13} />
                          </button>
                        )}
                        {merch && (
                          <button
                            type="button"
                            onClick={() => unassignFarmacia(f.id)}
                            className="text-brand-300 hover:text-danger-500 transition-colors p-1"
                            title="Rimuovi assegnazione"
                          >
                            <Unlink size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-brand-400">
            Nessuna farmacia trovata con i filtri selezionati
          </div>
        )}
      </div>

      {/* Merchandiser list (compact) */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-3">Merchandiser registrate</p>
        <div className="flex flex-wrap gap-2">
          {merchandisers.map(m => {
            const count = assegnazioni.filter((a: any) => a.merchandiserId === m.id).length
            return (
              <div key={m.id} className="flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-sm px-3 py-2 group">
                <div className="w-6 h-6 rounded-sm bg-brand-200 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-brand-600">{m.nome[0]}{m.cognome[0]}</span>
                </div>
                <span className="text-xs font-medium text-brand-700">{m.nome} {m.cognome}</span>
                <span className="text-[10px] text-brand-400">{count} farmacie</span>
                <button
                  type="button"
                  onClick={() => { if (confirm(`Eliminare ${m.nome} ${m.cognome}?`)) removeUser(m.id) }}
                  className="text-brand-300 hover:text-danger-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// KANBAN VIEW
// ============================================================

function AssignmentKanbanView({
  farmacie, rilievi, assegnazioni, merchandisers,
  assignFarmacia, unassignFarmacia, removeUser,
}: {
  farmacie: Farmacia[]; rilievi: any[]; assegnazioni: any[]; merchandisers: User[]
  assignFarmacia: (fId: string, mId: string) => void
  unassignFarmacia: (fId: string) => void
  removeUser: (id: string) => void
}) {
  // Group farmacie by merchandiser
  const assignedFarmacieIds = new Set(assegnazioni.map((a: any) => a.farmaciaId))
  const unassigned = farmacie.filter(f => !assignedFarmacieIds.has(f.id))

  const columns = [
    ...merchandisers.map(m => ({
      id: m.id,
      title: `${m.nome} ${m.cognome}`,
      initials: `${m.nome[0]}${m.cognome[0]}`,
      farmacie: farmacie.filter(f =>
        assegnazioni.some((a: any) => a.farmaciaId === f.id && a.merchandiserId === m.id)
      ),
      isMerch: true as const,
    })),
    {
      id: '__unassigned__',
      title: 'Non assegnate',
      initials: '—',
      farmacie: unassigned,
      isMerch: false as const,
    },
  ]

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
      {columns.map(col => {
        const completate = col.farmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'completata').length
        const pct = col.farmacie.length > 0 ? Math.round((completate / col.farmacie.length) * 100) : 0

        return (
          <div key={col.id} className="flex-shrink-0 w-72">
            {/* Column header */}
            <div className={`card p-3 mb-2 ${col.isMerch ? '' : 'border-dashed border-brand-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-sm flex items-center justify-center ${
                    col.isMerch ? 'bg-brand-100' : 'bg-brand-50'
                  }`}>
                    <span className="text-[10px] font-semibold text-brand-600">{col.initials}</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-brand-800">{col.title}</p>
                    <p className="text-[10px] text-brand-400">{col.farmacie.length} farmacie</p>
                  </div>
                </div>
                {col.isMerch && (
                  <button
                    type="button"
                    onClick={() => { if (confirm(`Eliminare ${col.title}?`)) removeUser(col.id) }}
                    className="text-brand-300 hover:text-danger-500 transition-colors p-0.5"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              {col.isMerch && col.farmacie.length > 0 && (
                <div className="mt-2">
                  <div className="w-full bg-brand-100 rounded-full h-1">
                    <div className="h-1 rounded-full bg-success-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-brand-400 mt-1">{pct}% completamento</p>
                </div>
              )}
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {col.farmacie.map(f => {
                const stato = getStatoFarmacia(rilievi, f.id)
                const sc = statoColors[stato]

                return (
                  <div key={f.id} className="card p-3 group">
                    <div className="flex items-start justify-between mb-1.5">
                      <p className="text-xs font-medium text-brand-900 flex-1">{f.nome}</p>
                      <span className={`badge text-[10px] py-0 px-1.5 ${sc.bg} ${sc.text} border ${sc.border}`}>
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: sc.dot }} />
                        {getLabelStato(stato)}
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-400 mb-2">{f.citta} ({f.provincia})</p>
                    <div className="flex items-center gap-1">
                      {/* Move to select */}
                      <select
                        className="text-[10px] border border-brand-200 rounded-sm px-1.5 py-1 bg-white flex-1 text-brand-500"
                        defaultValue=""
                        onChange={e => {
                          if (!e.target.value) return
                          if (e.target.value === '__remove__') {
                            unassignFarmacia(f.id)
                          } else {
                            assignFarmacia(f.id, e.target.value)
                          }
                          e.target.value = ''
                        }}
                      >
                        <option value="">Sposta a...</option>
                        {merchandisers
                          .filter(m => !col.isMerch || m.id !== col.id)
                          .map(m => (
                            <option key={m.id} value={m.id}>{m.nome} {m.cognome}</option>
                          ))
                        }
                        {col.isMerch && <option value="__remove__">Rimuovi assegnazione</option>}
                      </select>
                    </div>
                  </div>
                )
              })}
              {col.farmacie.length === 0 && (
                <div className="border border-dashed border-brand-200 rounded-sm p-4 text-center">
                  <p className="text-[11px] text-brand-400 italic">Nessuna farmacia</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function AdminMapPage() {
  const { farmacie, rilievi } = useData()
  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Mappa</h1>
        <p className="page-subtitle">Distribuzione geografica dei punti vendita</p>
      </div>
      <div className="card p-4">
        <FarmaciaMap farmacie={farmacie} rilievi={rilievi} height="calc(100vh - 220px)" />
      </div>
    </div>
  )
}

// ============================================================
// CONFIGURAZIONE CAMPI
// ============================================================

const tipoOptions = [
  { value: 'number', label: 'Numero' },
  { value: 'text', label: 'Testo' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'select', label: 'Selezione' },
]

export function AdminConfigurazionePage() {
  const { campiConfigurazione, addCampo, updateCampo, removeCampo } = useData()
  const [activeFase, setActiveFase] = useState<FaseNumero>(1)
  const [editingId, setEditingId] = useState<string | null>(null)

  const campiFase = campiConfigurazione
    .filter(c => c.fase === activeFase)
    .sort((a, b) => a.ordine - b.ordine)

  function handleAddCampo() {
    const maxOrdine = campiFase.length > 0 ? Math.max(...campiFase.map(c => c.ordine)) : 0
    const newCampo: CampoConfigurazione = {
      id: `campo-${Date.now()}`,
      fase: activeFase,
      nome: `campo_${Date.now()}`,
      label: 'Nuovo campo',
      tipo: 'number',
      obbligatorio: false,
      ordine: maxOrdine + 1,
      attivo: true,
    }
    addCampo(newCampo)
    setEditingId(newCampo.id)
  }

  function handleSaveCampo(campo: CampoConfigurazione) {
    updateCampo(campo)
    setEditingId(null)
  }

  function handleMoveUp(campo: CampoConfigurazione) {
    const idx = campiFase.findIndex(c => c.id === campo.id)
    if (idx <= 0) return
    const prev = campiFase[idx - 1]
    updateCampo({ ...campo, ordine: prev.ordine })
    updateCampo({ ...prev, ordine: campo.ordine })
  }

  function handleMoveDown(campo: CampoConfigurazione) {
    const idx = campiFase.findIndex(c => c.id === campo.id)
    if (idx >= campiFase.length - 1) return
    const next = campiFase[idx + 1]
    updateCampo({ ...campo, ordine: next.ordine })
    updateCampo({ ...next, ordine: campo.ordine })
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Configurazione campi</h1>
        <p className="page-subtitle">Personalizza i campi del form per ogni fase</p>
      </div>

      {/* Fase tabs */}
      <div className="flex gap-1 border-b border-brand-100 pb-0">
        {([1, 2, 3] as FaseNumero[]).map(fase => (
          <button
            key={fase}
            type="button"
            onClick={() => { setActiveFase(fase); setEditingId(null) }}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeFase === fase
                ? 'border-accent-600 text-accent-700'
                : 'border-transparent text-brand-400 hover:text-brand-600'
            }`}
          >
            Fase {fase} — {getLabelFase(fase)}
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="card p-3 bg-brand-50 border-brand-100">
        <p className="text-xs text-brand-600">
          {activeFase === 1
            ? 'Configura i campi misure che il merchandiser deve compilare. Questi campi sono completamente personalizzabili.'
            : 'Per la Fase ' + activeFase + ', i campi checklist principali sono fissi. Puoi aggiungere campi supplementari.'}
        </p>
      </div>

      {/* Fields list */}
      <div className="space-y-2">
        {campiFase.map((campo, idx) => (
          <div key={campo.id} className="card p-4">
            {editingId === campo.id ? (
              <CampoEditForm
                campo={campo}
                onSave={handleSaveCampo}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(campo)}
                    disabled={idx === 0}
                    className="text-brand-300 hover:text-brand-600 disabled:opacity-30 transition-colors"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(campo)}
                    disabled={idx === campiFase.length - 1}
                    className="text-brand-300 hover:text-brand-600 disabled:opacity-30 transition-colors"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-brand-900">{campo.label}</p>
                    <span className="badge bg-brand-50 text-brand-500 border border-brand-100 text-[10px]">
                      {tipoOptions.find(t => t.value === campo.tipo)?.label}
                    </span>
                    {campo.unita && (
                      <span className="text-[10px] text-brand-400">{campo.unita}</span>
                    )}
                    {campo.obbligatorio && (
                      <span className="text-[10px] text-danger-500 font-medium">*</span>
                    )}
                    {!campo.attivo && (
                      <span className="badge bg-brand-50 text-brand-400 border border-brand-100 text-[10px]">Disattivato</span>
                    )}
                  </div>
                  {campo.descrizione && (
                    <p className="text-[11px] text-brand-400 mt-0.5">{campo.descrizione}</p>
                  )}
                  <p className="text-[10px] text-brand-300 mt-0.5">nome: {campo.nome}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingId(campo.id)}
                    className="btn-ghost text-xs py-1 px-2"
                  >
                    Modifica
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (confirm('Eliminare questo campo?')) removeCampo(campo.id) }}
                    className="text-brand-300 hover:text-danger-500 transition-colors p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {campiFase.length === 0 && (
        <div className="card p-8 text-center">
          <Settings size={24} className="mx-auto text-brand-300 mb-2" />
          <p className="text-sm text-brand-400">Nessun campo configurato per questa fase</p>
        </div>
      )}

      <button type="button" onClick={handleAddCampo} className="btn-secondary w-full py-2.5">
        <Plus size={15} /> Aggiungi campo
      </button>
    </div>
  )
}

function CampoEditForm({
  campo, onSave, onCancel
}: {
  campo: CampoConfigurazione
  onSave: (c: CampoConfigurazione) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState(campo.label)
  const [nome, setNome] = useState(campo.nome)
  const [descrizione, setDescrizione] = useState(campo.descrizione || '')
  const [tipo, setTipo] = useState(campo.tipo)
  const [unita, setUnita] = useState(campo.unita || '')
  const [obbligatorio, setObbligatorio] = useState(campo.obbligatorio)
  const [attivo, setAttivo] = useState(campo.attivo)
  const [opzioniStr, setOpzioniStr] = useState((campo.opzioni || []).join(', '))

  function handleSave() {
    onSave({
      ...campo,
      label,
      nome: nome || label.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      descrizione: descrizione || undefined,
      tipo,
      unita: unita || undefined,
      obbligatorio,
      attivo,
      opzioni: tipo === 'select' ? opzioniStr.split(',').map(o => o.trim()).filter(Boolean) : undefined,
    })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Etichetta</label>
          <input value={label} onChange={e => setLabel(e.target.value)} className="input" placeholder="Es: Profondita scaffale" />
        </div>
        <div>
          <label className="label">Nome tecnico</label>
          <input value={nome} onChange={e => setNome(e.target.value)} className="input" placeholder="Es: profonditaScaffale" />
        </div>
      </div>
      <div>
        <label className="label">Descrizione (opzionale)</label>
        <input value={descrizione} onChange={e => setDescrizione(e.target.value)} className="input" placeholder="Testo helper sotto il campo" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value as any)} className="input">
            {tipoOptions.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Unita</label>
          <input value={unita} onChange={e => setUnita(e.target.value)} className="input" placeholder="cm, pz, ..." />
        </div>
        <div className="flex flex-col gap-2 pt-6">
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={obbligatorio} onChange={e => setObbligatorio(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-brand-300 text-accent-600" />
            Obbligatorio
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={attivo} onChange={e => setAttivo(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-brand-300 text-accent-600" />
            Attivo
          </label>
        </div>
      </div>
      {tipo === 'select' && (
        <div>
          <label className="label">Opzioni (separate da virgola)</label>
          <input value={opzioniStr} onChange={e => setOpzioniStr(e.target.value)} className="input" placeholder="Buono, Discreto, Pessimo" />
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={handleSave} className="btn-primary">Salva</button>
        <button type="button" onClick={onCancel} className="btn-ghost">Annulla</button>
      </div>
    </div>
  )
}
