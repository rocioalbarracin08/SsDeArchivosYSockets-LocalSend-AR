interface Window {
  api: {
    buscarDispositivos: () => void
    onDispositivoEncontrado: (callback: (data: any) => void) => void
    onDispositivoPerdido: (callback: (data: { name: string }) => void) => void
    enviarArchivo: (envioId: string, rutaArchivo: string, direcciones: string[], puertoDestino: number, nombreDispositivoDestino: string) => void
    onEstadoEnvio: (callback: (data: { envioId: string; estado: string }) => void) => void
    obtenerRutaDeArchivo: (archivo: File) => string
    cambiarVisibilidad: (visible: boolean) => void
    onSolicitudTransferencia: (callback: (data: any) => void) => void
    responderTransferencia: (transferId: string, aceptado: boolean) => void
    onProgresoTransferencia: (callback: (data: any) => void) => void
  }
}