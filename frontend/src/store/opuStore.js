import { create } from 'zustand'

export const useOPUStore = create((set) => ({
  sesiones: [],
  setSesiones: (sesiones) => set({ sesiones }),
  addSesion: (sesion) => set((state) => ({ sesiones: [...state.sesiones, sesion] })),
  updateSesion: (id, data) => set((state) => ({
    sesiones: state.sesiones.map((s) => (s.id === id ? { ...s, ...data } : s))
  })),
  removeSesion: (id) => set((state) => ({
    sesiones: state.sesiones.filter((s) => s.id !== id)
  }))
}))
