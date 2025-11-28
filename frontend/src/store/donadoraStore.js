/**
 * Store de donadoras (Zustand)
 */
import { create } from 'zustand'

export const useDonadoraStore = create((set) => ({
  donadoras: [],
  selectedDonadora: null,
  loading: false,
  error: null,

  // Paginación
  currentPage: 1,
  totalPages: 1,
  totalDonadoras: 0,
  limit: 30,

  // Filtros
  filters: {
    raza: '',
    tipo_ganado: '',
    propietario_nombre: '',
    activo: true,
    search: ''
  },

  // Estadísticas
  statistics: null,

  setDonadoras: (donadoras) => set({ donadoras }),

  setPaginationData: (data) => set({
    donadoras: data.donadoras || [],
    currentPage: data.page || 1,
    totalPages: data.total_pages || 1,
    totalDonadoras: data.total || 0,
    limit: data.limit || 30
  }),

  setStatistics: (statistics) => set({ statistics }),

  addDonadora: (donadora) => set((state) => ({
    donadoras: [...state.donadoras, donadora]
  })),

  updateDonadora: (id, updatedData) => set((state) => ({
    donadoras: state.donadoras.map(d =>
      d.id === id ? { ...d, ...updatedData } : d
    )
  })),

  removeDonadora: (id) => set((state) => ({
    donadoras: state.donadoras.filter(d => d.id !== id)
  })),

  selectDonadora: (donadora) => set({ selectedDonadora: donadora }),

  clearSelection: () => set({ selectedDonadora: null }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  // Actualizar filtros
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
    currentPage: 1 // Resetear a página 1 al cambiar filtros
  })),

  // Resetear filtros
  resetFilters: () => set({
    filters: {
      raza: '',
      tipo_ganado: '',
      propietario_nombre: '',
      activo: true,
      search: ''
    },
    currentPage: 1
  }),

  // Cambiar página
  setPage: (page) => set({ currentPage: page })
}))
