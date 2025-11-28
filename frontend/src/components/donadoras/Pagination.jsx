/**
 * Componente de paginación
 */
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, limit }) {
  const startItem = (currentPage - 1) * limit + 1
  const endItem = Math.min(currentPage * limit, totalItems)

  // Generar array de números de página
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // Si hay 5 páginas o menos, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Mostrar páginas alrededor de la actual
      let startPage = Math.max(1, currentPage - 2)
      let endPage = Math.min(totalPages, currentPage + 2)

      // Ajustar si estamos cerca del inicio
      if (currentPage <= 3) {
        endPage = maxPagesToShow
      }

      // Ajustar si estamos cerca del final
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - maxPagesToShow + 1
      }

      // Agregar primera página y ellipsis
      if (startPage > 1) {
        pages.push(1)
        if (startPage > 2) {
          pages.push('...')
        }
      }

      // Agregar páginas del rango
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // Agregar ellipsis y última página
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...')
        }
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4">
      {/* Información de registros */}
      <div className="text-sm text-gray-600">
        Mostrando <span className="font-semibold">{startItem}</span> a{' '}
        <span className="font-semibold">{endItem}</span> de{' '}
        <span className="font-semibold">{totalItems}</span> donadoras
      </div>

      {/* Botones de paginación */}
      <div className="flex items-center space-x-2">
        {/* Botón anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Página anterior"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Números de página */}
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
                  ...
                </span>
              )
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-2 rounded-md transition-colors ${
                  currentPage === page
                    ? 'bg-primary text-white font-semibold'
                    : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {page}
              </button>
            )
          })}
        </div>

        {/* Botón siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Página siguiente"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
