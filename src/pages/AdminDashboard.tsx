import { useState } from 'react'
import { useData } from '../context/DataContext'
import StatsCards from '../components/StatsCards'
import FarmaciaMap from '../components/FarmaciaMap'
import { getStatoFarmacia, getLabelStato, getColoreStato, getLabelFase, getDescrizioneFase, getFaseCorrente, User, Farmacia, Rilievo, Assegnazione, StatoFarmacia, CampoConfigurazione, FaseNumero } from '../types'
import { isSupabaseConfigured } from '../lib/supabase'
import { uploadPlanogramma } from '../lib/supabase'
import {
  Upload, Plus, Trash2, UserPlus, Link2, Unlink, Search, MapPin, Users,
  AlertTriangle, ImagePlus, ArrowRightLeft, X, LayoutList, Columns, Filter,
  Settings, ChevronUp, ChevronDown, GripVertical, CheckCircle, XCircle,
  Clock, ChevronRight, Mail, Phone, FileText, MapPinIcon, ArrowLeft,
  Building2, Calendar,
} from 'lucide-react'
import Papa from 'papaparse'

export default function AdminDashboard() {
  const { farmacie, rilievi, users, assegnazioni } = useData()
  const merchandisers = users.filter(u => u.ruolo === 'merchandiser')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Pannello di controllo</h1>
        <p className="page-subtitle">Gestione completa farmacie, merchandiser e merchandising</p>
      </div>
      <StatsCards farmacie={farmacie} rilievi={rilievi} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-brand-500" />
            <p className="text-xs text-brand-500 font-medium">Merchandiser attive</p>
          </div>
          <p className="text-2xl font-heading font-bold text-brand-900">{merchandisers.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-brand-500 font-medium mb-1">Farmacie assegnate</p>
          <p className="text-2xl font-heading font-bold text-brand-900">
            {assegnazioni.length} <span className="text-sm font-normal text-brand-400">/ {farmacie.length}</span>
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-warning-500" />
            <p className="text-xs text-brand-500 font-medium">Non assegnate</p>
          </div>
          <p className="text-2xl font-heading font-bold text-danger-500">{farmacie.length - assegnazioni.length}</p>
        </div>
      </div>
      <div className="card p-5">
        <h2 className="text-sm font-heading font-bold text-brand-700 mb-3">Distribuzione nazionale</h2>
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
  const [selectedFarmaciaId, setSelectedFarmaciaId] = useState<string | null>(null)
  const merchandisers = users.filter(u => u.ruolo === 'merchandiser')
  const selectedFarmacia = selectedFarmaciaId ? farmacie.find(f => f.id === selectedFarmaciaId) || null : null

  const filtered = farmacie.filter(f =>
    (f.nome + f.citta + f.indirizzo + f.provincia + f.cap + (f.codiceCliente || '') + (f.telefono || '')).toLowerCase().includes(search.toLowerCase())
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
          codiceCliente: row.codiceCliente || row.codice || row.code || '',
          regione: row.regione || row.Regione || row.region || '',
          rippianiCategory: parseInt(row.rippianiCategory || row.ripiani || row['NUMERO DI RIPIANI category'] || '0') || undefined,
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
            <h3 className="text-sm font-heading font-bold text-brand-700">Nuova farmacia</h3>
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
                <th className="text-left px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Codice</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Farmacia</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Indirizzo</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Citta</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">CAP</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Prov.</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Telefono</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Stato</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Merchandiser</th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider w-20"></th>
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
                  <tr key={f.id} className="hover:bg-brand-50/50 transition-colors cursor-pointer" onClick={() => setSelectedFarmaciaId(f.id)}>
                    <td className="px-3 py-3 text-[13px] text-brand-500 font-mono">{f.codiceCliente || '—'}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-brand-900 text-[13px]">{f.nome}</p>
                    </td>
                    <td className="px-3 py-3 text-[13px] text-brand-600">{f.indirizzo || '—'}</td>
                    <td className="px-3 py-3 text-[13px] text-brand-600">{f.citta || '—'}</td>
                    <td className="px-3 py-3 text-[13px] text-brand-500">{f.cap || '—'}</td>
                    <td className="px-3 py-3 text-[13px] text-brand-500">{f.provincia || '—'}</td>
                    <td className="px-3 py-3 text-[13px] text-brand-500">{f.telefono || '—'}</td>
                    <td className="px-3 py-3">
                      <span className={`badge ${sc.bg} ${sc.text} border ${sc.border}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.dot }} />
                        {getLabelStato(stato)}
                      </span>
                    </td>
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
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
                    <td className="px-3 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
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

      {/* Farmacia Detail Slide-over */}
      {selectedFarmacia && (
        <FarmaciaDetailPanel
          farmacia={selectedFarmacia}
          rilievi={rilievi}
          assegnazioni={assegnazioni}
          users={users}
          merchandisers={merchandisers}
          onClose={() => setSelectedFarmaciaId(null)}
        />
      )}
    </div>
  )
}

// ============================================================
// FARMACIA DETAIL PANEL
// ============================================================

function FarmaciaDetailPanel({
  farmacia, rilievi, assegnazioni, users, merchandisers, onClose,
}: {
  farmacia: Farmacia
  rilievi: Rilievo[]
  assegnazioni: Assegnazione[]
  users: User[]
  merchandisers: User[]
  onClose: () => void
}) {
  const stato = getStatoFarmacia(rilievi, farmacia.id)
  const assegnazione = assegnazioni.find(a => a.farmaciaId === farmacia.id)
  const merch = assegnazione ? users.find(u => u.id === assegnazione.merchandiserId) : null
  const rilieviFarmacia = rilievi.filter(r => r.farmaciaId === farmacia.id)

  const statoColorsLocal: Record<StatoFarmacia, { bg: string; text: string; border: string; dot: string }> = {
    da_fare: { bg: 'bg-danger-50', text: 'text-danger-600', border: 'border-danger-100', dot: '#d64545' },
    in_corso: { bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-100', dot: '#de911d' },
    completata: { bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-100', dot: '#3f9142' },
    in_attesa: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', dot: '#6366f1' },
  }
  const sc = statoColorsLocal[stato]

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-brand-100 px-5 py-4 z-10">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="text-brand-400 hover:text-brand-700 transition-colors p-1 -ml-1">
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-heading font-bold text-brand-900 truncate">{farmacia.nome}</h2>
              {farmacia.codiceCliente && (
                <p className="text-[11px] text-brand-400 font-mono">#{farmacia.codiceCliente}</p>
              )}
            </div>
            <span className={`badge ${sc.bg} ${sc.text} border ${sc.border}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.dot }} />
              {getLabelStato(stato)}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Informazioni</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <MapPin size={13} className="text-brand-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-brand-400">Indirizzo</p>
                  <p className="text-xs text-brand-700">{farmacia.indirizzo}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Building2 size={13} className="text-brand-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-brand-400">Localita</p>
                  <p className="text-xs text-brand-700">{farmacia.citta} ({farmacia.provincia})</p>
                  {farmacia.cap && <p className="text-[10px] text-brand-400">CAP {farmacia.cap}</p>}
                </div>
              </div>
              {farmacia.regione && (
                <div>
                  <p className="text-[10px] text-brand-400">Regione</p>
                  <p className="text-xs text-brand-700">{farmacia.regione}</p>
                </div>
              )}
              {farmacia.telefono && (
                <div className="flex items-start gap-2">
                  <Phone size={13} className="text-brand-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-brand-400">Telefono</p>
                    <p className="text-xs text-brand-700">{farmacia.telefono}</p>
                  </div>
                </div>
              )}
              {farmacia.referente && (
                <div>
                  <p className="text-[10px] text-brand-400">Referente</p>
                  <p className="text-xs text-brand-700">{farmacia.referente}</p>
                </div>
              )}
              {farmacia.rippianiCategory && (
                <div>
                  <p className="text-[10px] text-brand-400">Ripiani category</p>
                  <p className="text-xs text-brand-700 font-mono">{farmacia.rippianiCategory}</p>
                </div>
              )}
            </div>
          </div>

          {/* Merchandiser assegnata */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Merchandiser</h3>
            {merch ? (
              <div className="flex items-center gap-3 bg-brand-50 rounded-md p-3">
                <div className="w-9 h-9 rounded-md bg-brand-200 flex items-center justify-center">
                  <span className="text-xs font-bold text-brand-700">{merch.nome[0]}{merch.cognome[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-brand-900">{merch.nome} {merch.cognome}</p>
                  <p className="text-[11px] text-brand-400">{merch.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-brand-400 italic">Nessuna merchandiser assegnata</p>
            )}
          </div>

          {/* Rilievi per fase */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Rilievi per fase</h3>
            {([1, 2, 3] as FaseNumero[]).map(fase => {
              const rilievo = rilieviFarmacia.find(r => r.fase === fase && r.completata)
              const inCorso = rilieviFarmacia.find(r => r.fase === fase && !r.completata)
              const isCompleted = !!rilievo
              const isInProgress = !!inCorso && !isCompleted

              return (
                <div key={fase} className={`rounded-md border p-3 ${
                  isCompleted ? 'border-success-200 bg-success-50/50' :
                  isInProgress ? 'border-warning-200 bg-warning-50/50' :
                  'border-brand-100 bg-brand-50/30'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCompleted ? 'bg-success-500 text-white' :
                      isInProgress ? 'bg-warning-500 text-white' :
                      'bg-brand-200 text-brand-500'
                    }`}>
                      {isCompleted ? '✓' : fase}
                    </div>
                    <p className="text-xs font-medium text-brand-800">Fase {fase} — {getLabelFase(fase)}</p>
                  </div>
                  <p className="text-[11px] text-brand-400 ml-7 mb-1">{getDescrizioneFase(fase)}</p>
                  {rilievo && (
                    <div className="ml-7 mt-2 space-y-2">
                      <p className="text-[11px] text-success-700 flex items-center gap-1">
                        <Calendar size={10} /> {rilievo.dataCompletamento} {rilievo.oraCompletamento}
                      </p>
                      {rilievo.note && (
                        <p className="text-[11px] text-brand-500 italic">{rilievo.note}</p>
                      )}
                      {rilievo.foto && rilievo.foto.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {rilievo.foto.map((foto, i) => (
                            <img key={i} src={foto} alt={`Foto ${i + 1}`} className="w-16 h-16 object-cover rounded border border-brand-200" />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {inCorso && !isCompleted && inCorso.inAttesaMateriale && (
                    <p className="text-[11px] text-indigo-600 ml-7 mt-1 flex items-center gap-1">
                      <Clock size={10} /> In attesa materiale
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Planogramma */}
          {farmacia.planogrammaUrl && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Planogramma</h3>
              <img src={farmacia.planogrammaUrl} alt="Planogramma" className="w-full rounded-md border border-brand-200" />
            </div>
          )}

          {/* Note */}
          {farmacia.note && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Note</h3>
              <p className="text-xs text-brand-600">{farmacia.note}</p>
            </div>
          )}
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
  const { users, assegnazioni, farmacie, rilievi, addUser, removeUser, assignFarmacia, unassignFarmacia, registrazioniPending, approveRegistrazione, rejectRegistrazione } = useData()
  const merchandisers = users.filter(u => u.ruolo === 'merchandiser')
  const [showAdd, setShowAdd] = useState(false)
  const [expandedReg, setExpandedReg] = useState<string | null>(null)
  const [selectedMerchId, setSelectedMerchId] = useState<string | null>(null)
  const selectedMerch = selectedMerchId ? merchandisers.find(m => m.id === selectedMerchId) || null : null

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
        <button type="button" onClick={() => setShowAdd(!showAdd)} className="btn-primary">
          <UserPlus size={15} /> Aggiungi
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <p className="text-xl font-heading font-bold text-brand-900">{merchandisers.length}</p>
          <p className="text-[11px] text-brand-500">Merchandiser</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-heading font-bold text-success-600">{totalAssigned}</p>
          <p className="text-[11px] text-brand-500">Assegnate</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-heading font-bold text-danger-500">{totalUnassigned}</p>
          <p className="text-[11px] text-brand-500">Non assegnate</p>
        </div>
      </div>

      {/* Richieste in attesa */}
      {registrazioniPending.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 bg-warning-50 border-b border-warning-100 flex items-center gap-2">
            <Clock size={15} className="text-warning-600" />
            <h3 className="text-sm font-heading font-bold text-warning-700">
              Richieste in attesa
            </h3>
            <span className="ml-1 bg-warning-200 text-warning-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {registrazioniPending.length}
            </span>
          </div>
          <div className="divide-y divide-brand-50">
            {registrazioniPending.map(reg => {
              const isExpanded = expandedReg === reg.id
              return (
                <div key={reg.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-brand-100 flex items-center justify-center">
                      <span className="text-[11px] font-semibold text-brand-600">{reg.nome[0]}{reg.cognome[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-brand-900">{reg.nome} {reg.cognome}</p>
                      <p className="text-xs text-brand-400">{reg.email} — {reg.citta} ({reg.provincia})</p>
                    </div>
                    <p className="text-[11px] text-brand-400 hidden sm:block">
                      {new Date(reg.dataRichiesta).toLocaleDateString('it-IT')}
                    </p>
                    <button
                      type="button"
                      onClick={() => setExpandedReg(isExpanded ? null : reg.id)}
                      className="text-brand-400 hover:text-brand-600 transition-colors p-1"
                    >
                      <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (confirm(`Approvare la richiesta di ${reg.nome} ${reg.cognome}?`)) approveRegistrazione(reg.id) }}
                      className="flex items-center gap-1 text-xs font-medium text-success-600 hover:text-success-700 bg-success-50 hover:bg-success-100 border border-success-200 px-2.5 py-1.5 rounded-md transition-colors"
                    >
                      <CheckCircle size={13} /> Approva
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (confirm(`Rifiutare la richiesta di ${reg.nome} ${reg.cognome}?`)) rejectRegistrazione(reg.id) }}
                      className="flex items-center gap-1 text-xs font-medium text-danger-600 hover:text-danger-700 bg-danger-50 hover:bg-danger-100 border border-danger-200 px-2.5 py-1.5 rounded-md transition-colors"
                    >
                      <XCircle size={13} /> Rifiuta
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 ml-11 grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-brand-50/50 rounded-md">
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-brand-400" />
                        <div>
                          <p className="text-[10px] text-brand-400">Telefono</p>
                          <p className="text-xs text-brand-700">{reg.telefono}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText size={12} className="text-brand-400" />
                        <div>
                          <p className="text-[10px] text-brand-400">Codice Fiscale</p>
                          <p className="text-xs text-brand-700 font-mono">{reg.codiceFiscale}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPinIcon size={12} className="text-brand-400" />
                        <div>
                          <p className="text-[10px] text-brand-400">Indirizzo</p>
                          <p className="text-xs text-brand-700">{reg.indirizzo}, {reg.citta} ({reg.provincia})</p>
                        </div>
                      </div>
                      {reg.partitaIva && (
                        <div>
                          <p className="text-[10px] text-brand-400">Partita IVA</p>
                          <p className="text-xs text-brand-700 font-mono">{reg.partitaIva}</p>
                        </div>
                      )}
                      {reg.iban && (
                        <div>
                          <p className="text-[10px] text-brand-400">IBAN</p>
                          <p className="text-xs text-brand-700 font-mono">{reg.iban}</p>
                        </div>
                      )}
                      {reg.note && (
                        <div className="col-span-2 md:col-span-3">
                          <p className="text-[10px] text-brand-400">Note</p>
                          <p className="text-xs text-brand-600 italic">{reg.note}</p>
                        </div>
                      )}
                      {reg.fotoDocumento && (
                        <div className="col-span-2 md:col-span-3">
                          <p className="text-[10px] text-brand-400 mb-1">Documento d'identita</p>
                          <img src={reg.fotoDocumento} alt="Documento" className="max-h-40 rounded-md border border-brand-200" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="card p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 md:col-span-4 mb-1">
            <h3 className="text-sm font-heading font-bold text-brand-700">Nuova merchandiser</h3>
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

      {/* Merchandiser cards */}
      {merchandisers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {merchandisers.map(m => {
            const assigned = assegnazioni.filter(a => a.merchandiserId === m.id)
            const assignedFarmacie = farmacie.filter(f => assigned.some(a => a.farmaciaId === f.id))
            const completate = assignedFarmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'completata').length
            const inCorso = assignedFarmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'in_corso').length
            const daFare = assignedFarmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'da_fare').length
            const pct = assignedFarmacie.length > 0 ? Math.round((completate / assignedFarmacie.length) * 100) : 0

            return (
              <div
                key={m.id}
                onClick={() => setSelectedMerchId(m.id)}
                className="card p-4 cursor-pointer hover:shadow-md hover:border-brand-200 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-brand-600">{m.nome[0]}{m.cognome[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-heading font-bold text-brand-900 truncate">{m.nome} {m.cognome}</p>
                    <p className="text-[11px] text-brand-400 truncate">{m.email}</p>
                  </div>
                  <ChevronRight size={14} className="text-brand-300 group-hover:text-brand-500 transition-colors shrink-0" />
                </div>

                {m.telefono && (
                  <p className="text-[11px] text-brand-400 mb-3 flex items-center gap-1.5">
                    <Phone size={11} /> {m.telefono}
                  </p>
                )}

                <div className="flex items-center gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-lg font-heading font-bold text-brand-900">{assignedFarmacie.length}</p>
                    <p className="text-[10px] text-brand-400">Farmacie</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-heading font-bold text-success-600">{completate}</p>
                    <p className="text-[10px] text-brand-400">Completate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-heading font-bold text-warning-600">{inCorso}</p>
                    <p className="text-[10px] text-brand-400">In corso</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-heading font-bold text-danger-500">{daFare}</p>
                    <p className="text-[10px] text-brand-400">Da fare</p>
                  </div>
                </div>

                {assignedFarmacie.length > 0 && (
                  <div>
                    <div className="w-full bg-brand-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-success-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-brand-400 mt-1 text-right">{pct}% completato</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Users size={28} className="mx-auto text-brand-300 mb-2" />
          <p className="text-sm text-brand-500 font-medium">Nessuna merchandiser registrata</p>
          <p className="text-xs text-brand-400 mt-1">Aggiungi una merchandiser o aspetta le richieste di registrazione</p>
        </div>
      )}

      {/* Farmacie non assegnate info */}
      {farmacie.length - new Set(assegnazioni.map(a => a.farmaciaId)).size > 0 && (
        <div className="card p-3 bg-warning-50 border-warning-100">
          <p className="text-xs text-warning-700 flex items-center gap-2">
            <AlertTriangle size={13} />
            <strong>{farmacie.length - new Set(assegnazioni.map(a => a.farmaciaId)).size}</strong> farmacie non ancora assegnate a nessuna merchandiser
          </p>
        </div>
      )}

      {/* Merchandiser Detail Slide-over */}
      {selectedMerch && (
        <MerchandiserDetailPanel
          merchandiser={selectedMerch}
          farmacie={farmacie}
          rilievi={rilievi}
          assegnazioni={assegnazioni}
          onClose={() => setSelectedMerchId(null)}
          removeUser={removeUser}
        />
      )}
    </div>
  )
}

// ============================================================
// MERCHANDISER DETAIL PANEL
// ============================================================

function MerchandiserDetailPanel({
  merchandiser, farmacie, rilievi, assegnazioni, onClose, removeUser,
}: {
  merchandiser: User
  farmacie: Farmacia[]
  rilievi: Rilievo[]
  assegnazioni: Assegnazione[]
  onClose: () => void
  removeUser: (id: string) => void
}) {
  const assigned = assegnazioni.filter(a => a.merchandiserId === merchandiser.id)
  const assignedFarmacie = farmacie.filter(f => assigned.some(a => a.farmaciaId === f.id))
  const completate = assignedFarmacie.filter(f => getStatoFarmacia(rilievi, f.id) === 'completata').length
  const pct = assignedFarmacie.length > 0 ? Math.round((completate / assignedFarmacie.length) * 100) : 0

  const statoColorsLocal: Record<StatoFarmacia, { bg: string; text: string; border: string; dot: string }> = {
    da_fare: { bg: 'bg-danger-50', text: 'text-danger-600', border: 'border-danger-100', dot: '#d64545' },
    in_corso: { bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-100', dot: '#de911d' },
    completata: { bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-100', dot: '#3f9142' },
    in_attesa: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', dot: '#6366f1' },
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-brand-100 px-5 py-4 z-10">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="text-brand-400 hover:text-brand-700 transition-colors p-1 -ml-1">
              <ArrowLeft size={18} />
            </button>
            <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
              <span className="text-sm font-bold text-brand-600">{merchandiser.nome[0]}{merchandiser.cognome[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-heading font-bold text-brand-900 truncate">{merchandiser.nome} {merchandiser.cognome}</h2>
              <p className="text-[11px] text-brand-400">{merchandiser.email}</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Contact info */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Contatti</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-brand-400" />
                <div>
                  <p className="text-[10px] text-brand-400">Email</p>
                  <p className="text-xs text-brand-700">{merchandiser.email}</p>
                </div>
              </div>
              {merchandiser.telefono && (
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-brand-400" />
                  <div>
                    <p className="text-[10px] text-brand-400">Telefono</p>
                    <p className="text-xs text-brand-700">{merchandiser.telefono}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Statistiche</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3 text-center">
                <p className="text-xl font-heading font-bold text-brand-900">{assignedFarmacie.length}</p>
                <p className="text-[10px] text-brand-400">Farmacie</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-xl font-heading font-bold text-success-600">{completate}</p>
                <p className="text-[10px] text-brand-400">Completate</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-xl font-heading font-bold text-brand-900">{pct}%</p>
                <p className="text-[10px] text-brand-400">Progresso</p>
              </div>
            </div>
            {assignedFarmacie.length > 0 && (
              <div className="w-full bg-brand-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-success-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>

          {/* Farmacie assegnate */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Farmacie assegnate ({assignedFarmacie.length})
            </h3>
            {assignedFarmacie.length > 0 ? (
              <div className="space-y-2">
                {assignedFarmacie.map(f => {
                  const stato = getStatoFarmacia(rilievi, f.id)
                  const sc = statoColorsLocal[stato]
                  const lastRil = rilievi.filter(r => r.farmaciaId === f.id && r.completata).sort((a, b) => (b.dataCompletamento || '').localeCompare(a.dataCompletamento || ''))[0]
                  const faseCorrente = getFaseCorrente(rilievi, f.id)

                  return (
                    <div key={f.id} className="rounded-md border border-brand-100 p-3 hover:bg-brand-50/50 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-medium text-brand-900 flex-1">{f.nome}</p>
                        <span className={`badge text-[10px] py-0 px-1.5 ${sc.bg} ${sc.text} border ${sc.border}`}>
                          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: sc.dot }} />
                          {getLabelStato(stato)}
                        </span>
                      </div>
                      <p className="text-[11px] text-brand-400">{f.citta} ({f.provincia})</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-[10px] text-brand-400">
                          Fase corrente: <span className="font-medium text-brand-600">{faseCorrente}/3</span>
                        </p>
                        {lastRil && (
                          <p className="text-[10px] text-brand-400">
                            Ultimo: {lastRil.dataCompletamento}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-brand-400 italic">Nessuna farmacia assegnata</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-brand-100">
            <button
              type="button"
              onClick={() => { if (confirm(`Eliminare ${merchandiser.nome} ${merchandiser.cognome}?`)) { removeUser(merchandiser.id); onClose() } }}
              className="flex items-center gap-1.5 text-xs font-medium text-danger-600 hover:text-danger-700 transition-colors"
            >
              <Trash2 size={13} /> Elimina merchandiser
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function _AssignmentTableView({
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider hidden lg:table-cell">Ultimo sopralluogo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Merchandiser</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider w-20">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {filtered.map(f => {
                const stato = getStatoFarmacia(rilievi, f.id)
                const ultimoRilievo = rilievi.filter((r: any) => r.farmaciaId === f.id && r.completata).sort((a: any, b: any) => (b.dataCompletamento || '').localeCompare(a.dataCompletamento || ''))[0]
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
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {ultimoRilievo ? (
                        <div>
                          <p className="text-[13px] text-brand-700">{ultimoRilievo.dataCompletamento}</p>
                          <p className="text-[11px] text-brand-400">{ultimoRilievo.oraCompletamento} — Fase {ultimoRilievo.fase}</p>
                        </div>
                      ) : (
                        <span className="text-[13px] text-brand-300">—</span>
                      )}
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

function _AssignmentKanbanView({
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
                const lastRil = rilievi.filter((r: any) => r.farmaciaId === f.id && r.completata).sort((a: any, b: any) => (b.dataCompletamento || '').localeCompare(a.dataCompletamento || ''))[0]

                return (
                  <div key={f.id} className="card p-3 group">
                    <div className="flex items-start justify-between mb-1.5">
                      <p className="text-xs font-medium text-brand-900 flex-1">{f.nome}</p>
                      <span className={`badge text-[10px] py-0 px-1.5 ${sc.bg} ${sc.text} border ${sc.border}`}>
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: sc.dot }} />
                        {getLabelStato(stato)}
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-400">{f.citta} ({f.provincia})</p>
                    {lastRil && (
                      <p className="text-[10px] text-brand-400 mb-2">{lastRil.dataCompletamento} {lastRil.oraCompletamento} — F{lastRil.fase}</p>
                    )}
                    {!lastRil && <div className="mb-2" />}
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
