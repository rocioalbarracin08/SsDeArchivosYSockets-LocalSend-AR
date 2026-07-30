interface Window {
  api: {
    buscarDispositivos: () => void
    onDispositivoEncontrado: (callback: (data: any) => void) => void
    enviarArchivo: (rutaArchivo: string, ipDestino: string) => void
    obtenerRutaDeArchivo: (archivo: File) => string
  }
}