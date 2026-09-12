import { useState, useEffect } from 'react'

interface EnvioSaliente {
  envioId: string
  nombreArchivo: string
  nombreDispositivo: string
  estado: string
}

export function useEnviosSalientes() {
  const [envios, setEnvios] = useState<Record<string, EnvioSaliente>>({})

  useEffect(() => {
    window.api.onEstadoEnvio((data: { envioId: string; estado: string }) => {
      setEnvios((previos) => {
        const envioExistente = previos[data.envioId]
        if (!envioExistente) return previos
        return { ...previos, [data.envioId]: { ...envioExistente, estado: data.estado } }
      })
    })
  }, [])

  function registrarEnvio(envioId: string, nombreArchivo: string, nombreDispositivo: string) {
    setEnvios((previos) => ({
      ...previos,
      [envioId]: { envioId, nombreArchivo, nombreDispositivo, estado: 'enviando' }
    }))
  }

  return { envios: Object.values(envios), registrarEnvio }
}