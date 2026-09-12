// Bonjour puede devolver varias direcciones para el mismo dispositivo
// (IPv4 e IPv6 mezcladas). Preferimos IPv4 porque es más simple y
// funciona en cualquier red; si no hay ninguna, usamos la primera
// IPv6 disponible, envuelta en corchetes (obligatorio en URLs de WebSocket).
export function elegirDireccionIP(direcciones: string[]): string {
  const direccionIPv4 = direcciones.find((direccion) => direccion.includes('.'))
  if (direccionIPv4) return direccionIPv4

  return `[${direcciones[0]}]`
}