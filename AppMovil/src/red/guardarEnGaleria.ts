import * as MediaLibrary from 'expo-media-library/legacy'

const EXTENSIONES_MULTIMEDIA = ['.jpg', '.jpeg', '.png', '.gif', '.heic', '.webp', '.mp4', '.mov', '.avi', '.mkv']

export function esArchivoMultimedia(nombre: string): boolean {
  const punto = nombre.lastIndexOf('.')
  if (punto === -1) return false
  return EXTENSIONES_MULTIMEDIA.includes(nombre.slice(punto).toLowerCase())
}

export async function guardarEnGaleria(uri: string): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync()
  if (status !== 'granted') {
    console.warn('Permiso de galería no concedido')
    return false
  }
  try {
    const asset = await MediaLibrary.createAssetAsync(uri)
    await MediaLibrary.createAlbumAsync('LocalSend', asset, false)
    return true
  } catch (error) {
    console.warn('Error guardando en galería:', error)
    return false
  }
}