import './ResumenEnvios.css'

interface EnvioSaliente {
  envioId: string
  nombreArchivo: string
  nombreDispositivo: string
  estado: string
}

const TEXTOS_ESTADO: Record<string, string> = {
  enviando: 'Enviando solicitud...',
  esperando: 'Esperando que acepte...',
  aceptado: 'Aceptado, transfiriendo...',
  rechazado: 'Rechazado',
  completado: 'Enviado con éxito',
  error: 'No se pudo conectar'
}

interface Props {
  envios: EnvioSaliente[]
}

function ResumenEnvios({ envios }: Props) {
  if (envios.length === 0) return null

  return (
    <ul className="lista-resumen-envios">
      {envios.map((e) => (
        <li key={e.envioId} className={`item-resumen-envio estado-${e.estado}`}>
          <span className="nombre-archivo-envio">{e.nombreArchivo}</span>
          <span className="destino-envio">→ {e.nombreDispositivo}</span>
          <span className="estado-texto-envio">{TEXTOS_ESTADO[e.estado] ?? e.estado}</span>
        </li>
      ))}
    </ul>
  )
}

export default ResumenEnvios