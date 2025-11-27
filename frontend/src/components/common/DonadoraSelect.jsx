import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import donadoraService from '../../services/donadoraService'

export default function DonadoraSelect({
  label = 'Donadora',
  placeholder = 'Busca por nombre o registro',
  onSelect,
  selectedDonadora = null,
  helperText = ''
}) {
  const [query, setQuery] = useState(selectedDonadora?.nombre || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setQuery(selectedDonadora?.nombre || '')
  }, [selectedDonadora])

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    const handler = setTimeout(async () => {
      try {
        setLoading(true)
        const data = await donadoraService.search(query)
        setResults(data)
      } catch (error) {
        console.error('Error buscando donadoras', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(handler)
  }, [query])

  const handleSelect = (donadora) => {
    onSelect(donadora)
    setQuery(donadora.nombre)
    setResults([])
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    onSelect(null)
  }

  return (
    <div className="space-y-1 relative">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="input-field pr-10"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Limpiar selección"
          >
            <X size={16} />
          </button>
        )}
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>
      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}

      {(results.length > 0 || loading) && (
        <div className="absolute z-20 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 w-full max-h-60 overflow-y-auto">
          {results.length > 0 &&
            results.map((donadora) => (
              <button
                key={donadora.id}
                type="button"
                onClick={() => handleSelect(donadora)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50"
              >
                <p className="font-medium text-gray-800">{donadora.nombre}</p>
                <p className="text-xs text-gray-500">
                  Reg: {donadora.numero_registro} · Raza: {donadora.raza}
                </p>
              </button>
            ))}
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500">Buscando...</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">Sin resultados</div>
          )}
        </div>
      )}
    </div>
  )
}
