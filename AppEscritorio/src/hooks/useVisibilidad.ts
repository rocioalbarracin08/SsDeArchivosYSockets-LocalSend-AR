import { useState } from 'react'

export function useVisibilidad() {
  const [visible, setVisible] = useState(true)

  function alternarVisibilidad() {
    const nuevoEstado = !visible
    setVisible(nuevoEstado)
    window.api.cambiarVisibilidad(nuevoEstado)
  }

  return { visible, alternarVisibilidad }
}