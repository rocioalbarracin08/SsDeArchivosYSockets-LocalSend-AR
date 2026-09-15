import { useState, useEffect } from 'react'
import { registrarEscuchasDeDispositivos, iniciarEscaneo, detenerEscaneo } from '../red/descubrimiento'
import { idPropio } from '../red/identidadDispositivo'
import type { Dispositivo } from '../../../estructuraCompartida/tipos/Dispositivo'

export function useDispositivos() {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
  const [huboCambioReciente, setHuboCambioReciente] = useState(false)

  function marcarCambio() {
    setHuboCambioReciente(true)
    setTimeout(() => setHuboCambioReciente(false), 800)
  }

  useEffect(() => {
    registrarEscuchasDeDispositivos(
      idPropio,
      (dispositivo) => {
        setDispositivos((previos) => {
          const yaExiste = previos.some((d) => d.name === dispositivo.name)
          if (yaExiste) return previos
          marcarCambio()
          return [...previos, dispositivo]
        })
      },
      (nombrePerdido) => {
        setDispositivos((previos) => {
          marcarCambio()
          return previos.filter((d) => d.name !== nombrePerdido)
        })
      }
    )
    iniciarEscaneo()
    return () => detenerEscaneo()
  }, [])

  function actualizarLista() {
    // Relanza el escaneo — los dispositivos ya conocidos se vuelven a resolver.
    iniciarEscaneo()
  }

  return { dispositivos, actualizarLista, huboCambioReciente }
}