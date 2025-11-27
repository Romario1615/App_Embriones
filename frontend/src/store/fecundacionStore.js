import { create } from 'zustand'

export const useFecundacionStore = create((set) => ({
  registros: [],
  setRegistros: (registros) => set({ registros }),
  addRegistro: (registro) => set((state) => ({ registros: [...state.registros, registro] })),
  updateRegistro: (id, data) => set((state) => ({
    registros: state.registros.map((r) => (r.id === id ? { ...r, ...data } : r))
  })),
  removeRegistro: (id) => set((state) => ({
    registros: state.registros.filter((r) => r.id !== id)
  }))
}))
