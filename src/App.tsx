import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { initMockData, resetMockData } from './data/mock'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import BrandDashboard, { BrandMapPage, BrandFarmaciePage } from './pages/BrandDashboard'
import AdminDashboard, { AdminFarmaciePage, AdminMerchandiserPage, AdminMapPage } from './pages/AdminDashboard'
import MerchandiserPage from './pages/MerchandiserPage'

// Force reset mock data to new format (foto array, new fields)
// Change this key when data structure changes to force a refresh
const DATA_VERSION = 'v2-foto-array'
if (localStorage.getItem('logplus_data_version') !== DATA_VERSION) {
  resetMockData()
  localStorage.setItem('logplus_data_version', DATA_VERSION)
} else {
  initMockData()
}

function AppRoutes() {
  const { user } = useAuth()

  if (!user) return <LoginPage />

  return (
    <Layout>
      <Routes>
        {/* Admin routes */}
        {user.ruolo === 'admin' && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/farmacie" element={<AdminFarmaciePage />} />
            <Route path="/admin/merchandiser" element={<AdminMerchandiserPage />} />
            <Route path="/admin/mappa" element={<AdminMapPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </>
        )}

        {/* Brand routes */}
        {user.ruolo === 'brand' && (
          <>
            <Route path="/brand" element={<BrandDashboard />} />
            <Route path="/brand/mappa" element={<BrandMapPage />} />
            <Route path="/brand/farmacie" element={<BrandFarmaciePage />} />
            <Route path="*" element={<Navigate to="/brand" replace />} />
          </>
        )}

        {/* Merchandiser routes */}
        {user.ruolo === 'merchandiser' && (
          <>
            <Route path="/merchandiser" element={<MerchandiserPage />} />
            <Route path="*" element={<Navigate to="/merchandiser" replace />} />
          </>
        )}
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
