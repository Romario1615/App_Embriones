import { create } from 'zustand'

export const useGFEStore = create((set) => ({
  chequeos: [],
  setChequeos: (chequeos) => set({ chequeos }),
  addChequeo: (chequeo) => set((state) => ({ chequeos: [...state.chequeos, chequeo] })),
  updateChequeo: (id, data) => set((state) => ({
    chequeos: state.chequeos.map((c) => (c.id === id ? { ...c, ...data } : c))
  })),
  removeChequeo: (id) => set((state) => ({
    chequeos: state.chequeos.filter((c) => c.id !== id)
  }))
}))
