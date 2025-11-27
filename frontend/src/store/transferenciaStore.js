import { create } from 'zustand'

export const useTransferenciaStore = create((set) => ({
  transferencias: [],
  setTransferencias: (transferencias) => set({ transferencias }),
  addTransferencia: (transferencia) => set((state) => ({
    transferencias: [...state.transferencias, transferencia]
  })),
  updateTransferencia: (id, data) => set((state) => ({
    transferencias: state.transferencias.map((t) => (t.id === id ? { ...t, ...data } : t))
  })),
  removeTransferencia: (id) => set((state) => ({
    transferencias: state.transferencias.filter((t) => t.id !== id)
  }))
}))
