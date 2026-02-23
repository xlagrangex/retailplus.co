import { useState } from 'react'
import { useData } from '../context/DataContext'
import StatsCards from '../components/StatsCards'
import FarmaciaMap from '../components/FarmaciaMap'
import { getStatoFarmacia, getLabelStato, getColoreStato, User, Farmacia } from '../types'
import { Upload, Plus, Trash2, UserPlus, Link2, Unlink, Search, MapPin, Users, AlertTriangle } from 'lucide-react'
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
  const { farmacie, rilievi, assegnazioni, users, addFarmacia, removeFarmacia, importFarmacie, assignFarmacia, unassignFarmacia } = useData()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)
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
                <th className="text-right px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {filtered.map(f => {
                const stato = getStatoFarmacia(rilievi, f.id)
                const assegnazione = assegnazioni.find(a => a.farmaciaId === f.id)
                const merch = assegnazione ? users.find(u => u.id === assegnazione.merchandiserId) : null
                const statoColors = {
                  da_fare: { bg: 'bg-danger-50', text: 'text-danger-600', border: 'border-danger-100', dot: '#d64545' },
                  in_corso: { bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-100', dot: '#de911d' },
                  completata: { bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-100', dot: '#3f9142' },
                }[stato]!

                return (
                  <tr key={f.id} className="hover:bg-brand-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-brand-900 text-[13px]">{f.nome}</p>
                      <p className="text-xs text-brand-400">{f.indirizzo}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-brand-600 hidden sm:table-cell">{f.citta}</td>
                    <td className="px-4 py-3.5">
                      <span className={`badge ${statoColors.bg} ${statoColors.text} border ${statoColors.border}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statoColors.dot }} />
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
                      <button
                        onClick={() => { if (confirm('Eliminare questa farmacia?')) removeFarmacia(f.id) }}
                        className="text-brand-300 hover:text-danger-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
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

export function AdminMerchandiserPage() {
  const { users, assegnazioni, farmacie, rilievi, addUser, removeUser } = useData()
  const merchandisers = users.filter(u => u.ruolo === 'merchandiser')
  const [showAdd, setShowAdd] = useState(false)

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Merchandiser</h1>
          <p className="page-subtitle">{merchandisers.length} operatrici registrate</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary">
          <UserPlus size={15} /> Aggiungi
        </button>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {merchandisers.map(m => {
          const mieAssegnazioni = assegnazioni.filter(a => a.merchandiserId === m.id)
          const mieFarmacie = farmacie.filter(f => mieAssegnazioni.some(a => a.farmaciaId === f.id))
          return (
            <div key={m.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-brand-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-brand-600">{m.nome[0]}{m.cognome[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium text-brand-900 text-[13px]">{m.nome} {m.cognome}</p>
                    <p className="text-xs text-brand-400">{m.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { if (confirm('Eliminare questa merchandiser?')) removeUser(m.id) }}
                  className="text-brand-300 hover:text-danger-500 transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {m.telefono && <p className="text-xs text-brand-400 mt-2 ml-[52px]">{m.telefono}</p>}
              <div className="mt-4 pt-4 border-t border-brand-50">
                <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-2">
                  Farmacie assegnate ({mieFarmacie.length})
                </p>
                {mieFarmacie.length > 0 ? (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {mieFarmacie.map(f => (
                      <div key={f.id} className="flex items-center gap-2 text-xs">
                        <MapPin size={11} className="text-brand-400 shrink-0" />
                        <span className="text-brand-600">{f.nome}</span>
                        <span className="text-brand-400">{f.citta}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-brand-400 italic">Nessuna farmacia assegnata</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
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
