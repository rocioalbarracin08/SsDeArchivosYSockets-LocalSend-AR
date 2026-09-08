// Genera un nombre tipo "Adjetivo Sustantivo" (ej: "Manzana Veloz"),
// al estilo LocalSend real. Se genera una vez por arranque de la app,
// y de paso resuelve el choque de nombres duplicados en la red.
const ADJETIVOS = ['Veloz', 'Silencioso', 'Brillante', 'Curioso', 'Elegante', 'Ágil']
const SUSTANTIVOS = ['Manzana', 'Zorro', 'Cometa', 'Bosque', 'Ola', 'Faro']

export function generarNombreDispositivo(): string {
  const adjetivo = ADJETIVOS[Math.floor(Math.random() * ADJETIVOS.length)]
  const sustantivo = SUSTANTIVOS[Math.floor(Math.random() * SUSTANTIVOS.length)]
  return `${sustantivo} ${adjetivo}`
}