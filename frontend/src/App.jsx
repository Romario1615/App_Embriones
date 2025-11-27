import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DonadorasPage from './pages/donadoras/DonadorasPage'
import DonadoraDetail from './pages/donadoras/DonadoraDetail'
import OPUPage from './pages/OPUPage'
import OPUDetail from './pages/OPUDetail'
import FecundacionPage from './pages/FecundacionPage'
import TransferenciaPage from './pages/TransferenciaPage'
import GFEPage from './pages/GFEPage'
import Layout from './components/layout/Layout'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Layout>{children}</Layout>
}

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/donadoras" element={
          <ProtectedRoute>
            <DonadorasPage />
          </ProtectedRoute>
        } />

        <Route path="/donadoras/:id" element={
          <ProtectedRoute>
            <DonadoraDetail />
          </ProtectedRoute>
        } />

        <Route path="/opu" element={
          <ProtectedRoute>
            <OPUPage />
          </ProtectedRoute>
        } />
        <Route path="/opu/:id" element={
          <ProtectedRoute>
            <OPUDetail />
          </ProtectedRoute>
        } />

        <Route path="/fecundacion" element={
          <ProtectedRoute>
            <FecundacionPage />
          </ProtectedRoute>
        } />

        <Route path="/transferencia" element={
          <ProtectedRoute>
            <TransferenciaPage />
          </ProtectedRoute>
        } />

        <Route path="/gfe" element={
          <ProtectedRoute>
            <GFEPage />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
