import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { isSupabaseConfigured } from './lib/supabase'
import { initMockData } from './data/mock'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import BrandDashboard, { BrandMapPage, BrandFarmaciePage } from './pages/BrandDashboard'
import AdminDashboard, { AdminFarmaciePage, AdminMerchandiserPage, AdminMapPage, AdminConfigurazionePage } from './pages/AdminDashboard'
import MerchandiserPage from './pages/MerchandiserPage'

// Initialize mock data only if Supabase is not configured
if (!isSupabaseConfigured) {
  initMockData()
}

function getRoutesForRole(ruolo: string) {
  switch (ruolo) {
    case 'admin':
      return [
        <Route key="admin" path="/admin" element={<AdminDashboard />} />,
        <Route key="admin-farm" path="/admin/farmacie" element={<AdminFarmaciePage />} />,
        <Route key="admin-merch" path="/admin/merchandiser" element={<AdminMerchandiserPage />} />,
        <Route key="admin-map" path="/admin/mappa" element={<AdminMapPage />} />,
        <Route key="admin-config" path="/admin/configurazione" element={<AdminConfigurazionePage />} />,
        <Route key="admin-catch" path="*" element={<Navigate to="/admin" replace />} />,
      ]
    case 'brand':
      return [
        <Route key="brand" path="/brand" element={<BrandDashboard />} />,
        <Route key="brand-map" path="/brand/mappa" element={<BrandMapPage />} />,
        <Route key="brand-farm" path="/brand/farmacie" element={<BrandFarmaciePage />} />,
        <Route key="brand-catch" path="*" element={<Navigate to="/brand" replace />} />,
      ]
    case 'merchandiser':
      return [
        <Route key="merch" path="/merchandiser" element={<MerchandiserPage />} />,
        <Route key="merch-catch" path="*" element={<Navigate to="/merchandiser" replace />} />,
      ]
    default:
      return [<Route key="fallback" path="*" element={<Navigate to="/" replace />} />]
  }
}

function AppRoutes() {
  const { user } = useAuth()

  if (!user) {
    return (
      <Routes>
        <Route path="/registrazione" element={<RegisterPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        {getRoutesForRole(user.ruolo)}
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
