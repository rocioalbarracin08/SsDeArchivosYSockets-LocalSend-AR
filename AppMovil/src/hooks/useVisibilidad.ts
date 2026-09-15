// src/hooks/useVisibilidad.ts
import { useState, useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { activarVisibilidad, desactivarVisibilidad } from '../red/descubrimiento'
import { idPropio, nombreDispositivo } from '../red/identidadDispositivo'
import { PUERTO_TRANSFERENCIA } from '../../../estructuraCompartida/protocolo/constantes'

export function useVisibilidad() {
  const [visible, setVisible] = useState(true)
  const visibleRef = useRef(visible) // el listener de AppState necesita leer el valor "de ahora", no el de cuando se creó

  useEffect(() => {
    visibleRef.current = visible
  }, [visible])

  useEffect(() => {
    activarVisibilidad(nombreDispositivo, PUERTO_TRANSFERENCIA, idPropio)

    // Al pasar a segundo plano, nos des-anunciamos YA — así ningún otro
    // dispositivo se queda con nuestro nombre "fantasma" colgado.
    const suscripcion = AppState.addEventListener('change', (estadoApp) => {
      if (!visibleRef.current) return
      if (estadoApp === 'background') desactivarVisibilidad(nombreDispositivo)
      else if (estadoApp === 'active') activarVisibilidad(nombreDispositivo, PUERTO_TRANSFERENCIA, idPropio)
    })

    return () => {
      desactivarVisibilidad(nombreDispositivo)
      suscripcion.remove()
    }
  }, [])

  function alternarVisibilidad() {
    const nuevoEstado = !visible
    setVisible(nuevoEstado)
    if (nuevoEstado) activarVisibilidad(nombreDispositivo, PUERTO_TRANSFERENCIA, idPropio)
    else desactivarVisibilidad(nombreDispositivo)
  }

  return { visible, alternarVisibilidad }
}