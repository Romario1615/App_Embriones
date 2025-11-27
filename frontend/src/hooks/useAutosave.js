/**
 * Hook personalizado para autosave de formularios
 */
import { useEffect, useRef } from 'react'
import draftService from '../services/draftService'

const AUTOSAVE_DELAY = 3000 // 3 segundos

export const useAutosave = (modulo, tipoRegistro, formData, enabled = true) => {
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!enabled || !formData || Object.keys(formData).length === 0) {
      return
    }

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Configurar nuevo autosave
    timeoutRef.current = setTimeout(async () => {
      try {
        await draftService.save(modulo, tipoRegistro, formData)
        console.log('✅ Autosave exitoso')
      } catch (error) {
        console.error('❌ Error en autosave:', error)
      }
    }, AUTOSAVE_DELAY)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [formData, modulo, tipoRegistro, enabled])

  return null
}
