import { useState } from 'react'
import * as DocumentPicker from 'expo-document-picker'

export interface ArchivoElegido {
  uri: string
  nombre: string
  tamaño: number
}

export function useArchivosElegidos() {
  const [archivosElegidos, setArchivosElegidos] = useState<ArchivoElegido[]>([])

  async function agregarArchivos() {
    // type: '*/*' → cualquier tipo de archivo (texto, apk, video, audio, lo que sea).
    // copyToCacheDirectory: true → el sistema operativo copia el archivo a una carpeta
    // propia de la app ANTES de devolvernos la ruta. Esto lo hace el sistema, no
    // nuestro código JS, así que no pesa en RAM aunque el archivo sea gigante.
    const resultado = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      multiple: true,
      copyToCacheDirectory: true
    })

    if (resultado.canceled) return

    const nuevos: ArchivoElegido[] = resultado.assets.map((archivo) => ({
      uri: archivo.uri,
      nombre: archivo.name,
      tamaño: archivo.size ?? 0
    }))

    setArchivosElegidos((previos) => [...previos, ...nuevos])
  }

  function quitarArchivo(nombre: string) {
    setArchivosElegidos((previos) => previos.filter((a) => a.nombre !== nombre))
  }

  function vaciarArchivosElegidos() {
    setArchivosElegidos([])
  }

  return { archivosElegidos, agregarArchivos, quitarArchivo, vaciarArchivosElegidos }
}