import { useState } from 'react'
import { useData } from '../context/DataContext'
import StatsCards from '../components/StatsCards'
import FarmaciaMap from '../components/FarmaciaMap'
import { getStatoFarmacia, getLabelStato, getColoreStato, User, Farmacia } from '../types'
import { Upload, Plus, Trash2, UserPlus, Link2, Unlink, Search, MapPin } from 'lucide-react'
import Papa from 'papaparse'

export default function AdminDashboard() {
  const { farmacie, rilievi, users, assegnazioni } = useData()
  const merchandisers = users.filter(u => u.ruolo === 'merchandiser')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500">Gestione completa farmacie ed espositori</p>
      </div>
      <StatsCards farmacie={farmacie} rilievi={rilievi} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Merchandiser attive</p>
          <p className="text-2xl font-bold">{merchandisers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Farmacie assegnate</p>
          <p className="text-2xl font-bold">{assegnazioni.length} / {farmacie.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Farmacie non assegnate</p>
          <p className="text-2xl font-bold text-red-600">{farmacie.length - assegnazioni.length}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Mappa</h2>
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
        <h1 className="text-2xl font-bold text-gray-900">Gestione Farmacie</h1>
        <div className="flex gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 cursor-pointer transition">
            <Upload size={16} /> Importa CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
          </label>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus size={16} /> Aggiungi
          </button>
        </div>
      </div>

      {/* Form aggiunta manuale */}
      {showAdd && (
        <form onSubmit={handleAddManual} className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input name="nome" placeholder="Nome farmacia *" required className="col-span-2 px-3 py-2 border rounded-lg text-sm" />
          <input name="indirizzo" placeholder="Indirizzo *" required className="col-span-2 px-3 py-2 border rounded-lg text-sm" />
          <input name="citta" placeholder="Citta *" required className="px-3 py-2 border rounded-lg text-sm" />
          <input name="provincia" placeholder="Prov" className="px-3 py-2 border rounded-lg text-sm" />
          <input name="cap" placeholder="CAP" className="px-3 py-2 border rounded-lg text-sm" />
          <input name="telefono" placeholder="Telefono" className="px-3 py-2 border rounded-lg text-sm" />
          <input name="referente" placeholder="Referente" className="px-3 py-2 border rounded-lg text-sm" />
          <input name="lat" placeholder="Latitudine" className="px-3 py-2 border rounded-lg text-sm" />
          <input name="lng" placeholder="Longitudine" className="px-3 py-2 border rounded-lg text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Salva</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">Annulla</button>
          </div>
        </form>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Farmacia</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Citta</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stato</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Merchandiser</th>
                <th className="px-4 py-3 font-medium text-gray-600">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(f => {
                const stato = getStatoFarmacia(rilievi, f.id)
                const assegnazione = assegnazioni.find(a => a.farmaciaId === f.id)
                const merch = assegnazione ? users.find(u => u.id === assegnazione.merchandiserId) : null

                return (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{f.nome}</p>
                      <p className="text-xs text-gray-500">{f.indirizzo}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{f.citta}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: getColoreStato(stato) + '20', color: getColoreStato(stato) }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getColoreStato(stato) }} />
                        {getLabelStato(stato)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {assigning === f.id ? (
                        <select
                          className="text-sm border rounded px-2 py-1"
                          defaultValue=""
                          onChange={e => {
                            if (e.target.value) assignFarmacia(f.id, e.target.value)
                            setAssigning(null)
                          }}
                          onBlur={() => setAssigning(null)}
                          autoFocus
                        >
                          <option value="">Seleziona...</option>
                          {merchandisers.map(m => (
                            <option key={m.id} value={m.id}>{m.nome} {m.cognome}</option>
                          ))}
                        </select>
                      ) : merch ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-700">{merch.nome} {merch.cognome}</span>
                          <button onClick={() => unassignFarmacia(f.id)} className="text-gray-400 hover:text-red-500" title="Rimuovi">
                            <Unlink size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAssigning(f.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                        >
                          <Link2 size={14} /> Assegna
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => { if (confirm('Eliminare questa farmacia?')) removeFarmacia(f.id) }}
                        className="text-gray-400 hover:text-red-600 transition"
                      >
                        <Trash2 size={16} />
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
  const { users, assegnazioni, farmacie, addUser, removeUser } = useData()
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
        <h1 className="text-2xl font-bold text-gray-900">Merchandiser</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          <UserPlus size={16} /> Aggiungi
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input name="nome" placeholder="Nome *" required className="px-3 py-2 border rounded-lg text-sm" />
          <input name="cognome" placeholder="Cognome *" required className="px-3 py-2 border rounded-lg text-sm" />
          <input name="email" type="email" placeholder="Email *" required className="px-3 py-2 border rounded-lg text-sm" />
          <input name="telefono" placeholder="Telefono" className="px-3 py-2 border rounded-lg text-sm" />
          <div className="col-span-2 md:col-span-4 flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Salva</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">Annulla</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {merchandisers.map(m => {
          const mieAssegnazioni = assegnazioni.filter(a => a.merchandiserId === m.id)
          const mieFarmacie = farmacie.filter(f => mieAssegnazioni.some(a => a.farmaciaId === f.id))
          return (
            <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{m.nome} {m.cognome}</p>
                  <p className="text-sm text-gray-500">{m.email}</p>
                  {m.telefono && <p className="text-sm text-gray-500">{m.telefono}</p>}
                </div>
                <button
                  onClick={() => { if (confirm('Eliminare questa merchandiser?')) removeUser(m.id) }}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Farmacie assegnate ({mieFarmacie.length})</p>
                {mieFarmacie.length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {mieFarmacie.map(f => (
                      <p key={f.id} className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin size={12} className="text-gray-400 shrink-0" />
                        {f.nome} — {f.citta}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Nessuna farmacia assegnata</p>
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
      <h1 className="text-2xl font-bold text-gray-900">Mappa Admin</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <FarmaciaMap farmacie={farmacie} rilievi={rilievi} height="calc(100vh - 220px)" />
      </div>
    </div>
  )
}
