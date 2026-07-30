// Convierte un número de bytes en un texto legible, ej: 512000 -> "500 KB"
// Todavía no lo usamos, pero lo vamos a necesitar para el Monitor de Transferencia (Fase 5).
export function formatearBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}