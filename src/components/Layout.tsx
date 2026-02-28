import { ReactNode, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { resetOnboarding } from './OnboardingModal'
import {
  LayoutDashboard, Map, Users, Store, ClipboardList,
  LogOut, Menu, X, ChevronDown, Settings, Columns, HelpCircle
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

const roleHome = {
  admin: '/admin',
  brand: '/brand',
  merchandiser: '/merchandiser',
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [userMenuOpen])

  if (!user) return null

  const items = navItems[user.ruolo] || []

  function handleRivediTour() {
    setUserMenuOpen(false)
    const home = roleHome[user!.ruolo] || '/'
    if (location.pathname !== home) {
      navigate(home)
    }
    // resetOnboarding dispatches a custom event that pages listen to
    resetOnboarding(user!.id)
  }

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

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-8 h-8 rounded-md flex items-center justify-center hover:ring-2 hover:ring-accent-200 transition-all"
                style={{ backgroundColor: '#edf9f7' }}
              >
                <span className="text-xs font-semibold" style={{ color: '#329083' }}>
                  {user.nome[0]}{user.cognome[0]}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-elevated border border-brand-100 py-1 z-50">
                  <button
                    onClick={handleRivediTour}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-brand-600 hover:bg-brand-50 transition-colors text-left"
                  >
                    <HelpCircle size={14} className="text-brand-400" />
                    Rivedi tour
                  </button>
                  <div className="h-px bg-brand-100 mx-2 my-1" />
                  <button
                    onClick={() => { setUserMenuOpen(false); logout() }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-brand-600 hover:bg-brand-50 transition-colors text-left"
                  >
                    <LogOut size={14} className="text-brand-400" />
                    Esci
                  </button>
                </div>
              )}
            </div>
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
          <div className="h-px bg-brand-100 mx-1 my-1" />
          <button
            onClick={() => { setMobileOpen(false); handleRivediTour() }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors w-full text-left"
          >
            <HelpCircle size={16} />
            Rivedi tour
          </button>
        </div>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  )
}
