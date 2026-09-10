interface Window {
  api: {
    buscarDispositivos: () => void
    onDispositivoEncontrado: (callback: (data: any) => void) => void
    onDispositivoPerdido: (callback: (data: { name: string }) => void) => void
    enviarArchivo: (rutaArchivo: string, ipDestino: string, puertoDestino: number) => void
    obtenerRutaDeArchivo: (archivo: File) => string
    cambiarVisibilidad: (visible: boolean) => void
  }
}