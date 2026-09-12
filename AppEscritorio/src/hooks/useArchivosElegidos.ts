import { useState } from 'react'

export interface ArchivoElegido {
  ruta: string
  nombre: string
}

export function useArchivosElegidos() {
  const [archivosElegidos, setArchivosElegidos] = useState<ArchivoElegido[]>([])

  function agregarArchivos(lista: FileList) {
    const nuevos: ArchivoElegido[] = Array.from(lista).map((archivo) => ({
      ruta: window.api.obtenerRutaDeArchivo(archivo),
      nombre: archivo.name
    }))
    setArchivosElegidos((previos) => [...previos, ...nuevos])
  }

  function quitarArchivo(nombre: string) {
    setArchivosElegidos((previos) => previos.filter((a) => a.nombre !== nombre))
  }

  return { archivosElegidos, agregarArchivos, quitarArchivo }
}