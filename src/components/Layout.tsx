import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Map, Users, Store, ClipboardList,
  LogOut, Menu, X, ChevronDown, Settings, Columns
} from 'lucide-react'
import { useState } from 'react'

const navItems = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/farmacie', label: 'Farmacie', icon: Store },
    { to: '/admin/merchandiser', label: 'Merchandiser', icon: Users },
    { to: '/admin/mappa', label: 'Mappa', icon: Map },
    { to: '/admin/kanban', label: 'Kanban', icon: Columns },
    { to: '/admin/configurazione', label: 'Configurazione', icon: Settings },
  ],
  brand: [
    { to: '/brand', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/brand/mappa', label: 'Mappa', icon: Map },
    { to: '/brand/farmacie', label: 'Farmacie', icon: Store },
  ],
  merchandiser: [
    { to: '/merchandiser', label: 'Le mie farmacie', icon: ClipboardList },
  ],
}

const roleLabels = {
  admin: 'Amministratore',
  brand: 'Cliente',
  merchandiser: 'Merchandiser',
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) return null

  const items = navItems[user.ruolo] || []

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f9fc' }}>
      {/* Top bar */}
      <header className="bg-white border-b border-brand-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-1 -ml-1" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X size={20} className="text-brand-600" /> : <Menu size={20} className="text-brand-600" />}
              </button>
              <Link to="/" className="flex items-center gap-2">
                <img src="/Retaillogo.png" alt="Retail+" className="h-8" />
              </Link>
            </div>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {items.map(item => {
                const Icon = item.icon
                const active = location.pathname === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                      active
                        ? 'bg-accent-50 text-accent-700'
                        : 'text-brand-500 hover:text-brand-700 hover:bg-brand-50'
                    }`}
                  >
                    <Icon size={15} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right mr-1 hidden sm:block">
              <p className="text-[13px] font-medium text-brand-800">{user.nome} {user.cognome}</p>
              <p className="text-[11px] text-brand-400">{roleLabels[user.ruolo]}</p>
            </div>
            <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: '#edf9f7' }}>
              <span className="text-xs font-semibold" style={{ color: '#329083' }}>
                {user.nome[0]}{user.cognome[0]}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-brand-400 hover:text-brand-700 hover:bg-brand-50 rounded-md transition-colors duration-150"
              title="Esci"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-brand-100 px-4 py-2 space-y-0.5 shadow-card">
          {items.map(item => {
            const Icon = item.icon
            const active = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                  active ? 'bg-accent-50 text-accent-700' : 'text-brand-600 hover:bg-brand-50'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </div>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  )
}
