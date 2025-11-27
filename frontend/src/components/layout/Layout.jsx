/**
 * Layout principal con menú hamburguesa responsive
 * Aplicando heurísticas de Nielsen para mobile-first
 */
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, User, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/donadoras', label: 'Donadoras', icon: '🐄' },
    { path: '/opu', label: 'OPU', icon: '🔬' },
    { path: '/fecundacion', label: 'Fecundación', icon: '🧬' },
    { path: '/transferencia', label: 'Transferencia', icon: '💉' },
    { path: '/gfe', label: 'GFE', icon: '✅' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Sticky */}
      <header className="bg-primary text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl">🐄</span>
              <h1 className="text-xl md:text-2xl font-bold hidden sm:block">
                Embriones
              </h1>
            </Link>

            {/* Menú Hamburguesa (Mobile) */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-primary-dark transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Navegación Desktop */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-white/20'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Usuario Desktop */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <User size={20} />
                <span className="text-sm">{user?.nombre_completo}</span>
                <ChevronDown size={16} />
              </button>

              {/* Dropdown Usuario */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 text-gray-800">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium">{user?.nombre_completo}</p>
                    <p className="text-xs text-gray-500">{user?.rol}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <LogOut size={16} />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menú Mobile Dropdown */}
        {menuOpen && (
          <nav className="md:hidden bg-primary-dark border-t border-white/20">
            <div className="container mx-auto px-4 py-4 space-y-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`block py-3 px-4 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-white/20'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              {/* Usuario Mobile */}
              <div className="border-t border-white/20 pt-3 mt-3">
                <div className="px-4 py-2 text-sm">
                  <p className="font-medium">{user?.nombre_completo}</p>
                  <p className="text-xs text-white/70">{user?.rol}</p>
                </div>
                <button
                  onClick={() => {
                    handleLogout()
                    setMenuOpen(false)
                  }}
                  className="w-full text-left py-3 px-4 rounded-lg hover:bg-white/10 flex items-center space-x-2 mt-2"
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-600">
            © 2025 Sistema de Gestión de Embriones Bovinos
          </p>
        </div>
      </footer>
    </div>
  )
}
