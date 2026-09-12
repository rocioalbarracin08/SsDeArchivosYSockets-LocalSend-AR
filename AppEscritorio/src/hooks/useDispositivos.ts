import { useState, useEffect } from 'react'

export interface Dispositivo {
  name: string
  addresses: string[]
  port: number
}

export function useDispositivos() {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])

  useEffect(() => {
    window.api.onDispositivoEncontrado((data: Dispositivo) => {
      setDispositivos((previos) => {
        const yaExiste = previos.some((d) => d.name === data.name)
        return yaExiste ? previos : [...previos, data]
      })
    })
  }, [])

  useEffect(() => {
    window.api.onDispositivoPerdido((data: { name: string }) => {
      setDispositivos((previos) => previos.filter((d) => d.name !== data.name))
    })
  }, [])

  function actualizarLista() {
    window.api.buscarDispositivos()
  }

  return { dispositivos, actualizarLista }
}