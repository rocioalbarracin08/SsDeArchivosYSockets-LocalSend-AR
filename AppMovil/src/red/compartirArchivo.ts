import * as Sharing from 'expo-sharing'

export async function compartirOGuardarArchivo(uri: string): Promise<boolean> {
  const disponible = await Sharing.isAvailableAsync()
  if (!disponible) {
    console.warn('Compartir no está disponible en este dispositivo')
    return false
  }
  try {
    await Sharing.shareAsync(uri)
    return true
  } catch (error) {
    console.warn('Error al compartir el archivo:', error)
    return false
  }
}