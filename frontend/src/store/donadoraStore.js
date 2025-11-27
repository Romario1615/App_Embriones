/**
 * Store de donadoras (Zustand)
 */
import { create } from 'zustand'

export const useDonadoraStore = create((set) => ({
  donadoras: [],
  selectedDonadora: null,
  loading: false,
  error: null,

  setDonadoras: (donadoras) => set({ donadoras }),

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

  setError: (error) => set({ error })
}))
