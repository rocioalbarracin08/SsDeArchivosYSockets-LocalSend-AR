import { useState, useEffect } from 'react'

export interface Dispositivo {
  name: string
  addresses: string[]
  port: number
}

export function useDispositivos() {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
  const [huboCambioReciente, setHuboCambioReciente] = useState(false)

  function marcarCambio() {
    setHuboCambioReciente(true)
    setTimeout(() => setHuboCambioReciente(false), 800)
  }

  useEffect(() => {
    window.api.onDispositivoEncontrado((data: Dispositivo) => {
      setDispositivos((previos) => {
        const yaExiste = previos.some((d) => d.name === data.name)
        if (yaExiste) return previos
        marcarCambio()
        return [...previos, data]
      })
    })
  }, [])

  useEffect(() => {
    window.api.onDispositivoPerdido((data: { name: string }) => {
      setDispositivos((previos) => {
        marcarCambio()
        return previos.filter((d) => d.name !== data.name)
      })
    })
  }, [])

  function actualizarLista() {
    window.api.buscarDispositivos()
  }

  return { dispositivos, actualizarLista, huboCambioReciente }
}