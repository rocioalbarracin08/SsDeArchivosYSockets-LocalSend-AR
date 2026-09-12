interface Window {
  api: {
    buscarDispositivos: () => void
    onDispositivoEncontrado: (callback: (data: any) => void) => void
    onDispositivoPerdido: (callback: (data: { name: string }) => void) => void
    enviarArchivo: (rutaArchivo: string, direcciones: string[], puertoDestino: number) => void
    obtenerRutaDeArchivo: (archivo: File) => string
    cambiarVisibilidad: (visible: boolean) => void
    onSolicitudTransferencia: (callback: (data: any) => void) => void
    responderTransferencia: (transferId: string, aceptado: boolean) => void
    onProgresoTransferencia: (callback: (data: any) => void) => void
  }
}