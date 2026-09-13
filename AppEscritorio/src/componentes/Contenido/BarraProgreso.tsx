import './BarraProgreso.css'
import { formatearBytes } from '../../../../estructuraCompartida/utilidades/formatearBytes'

interface ItemProgreso {
  transferId: string
  nombreArchivo: string
  remitente?: string
  bytesRecibidos: number
  tamañoEsperado: number
  estado?: string
}

interface Props {
  transferencias: ItemProgreso[]
}

function BarraProgreso({ transferencias }: Props) {
  if (transferencias.length === 0) return null

  return (
    <div className="lista-progresos">
      {transferencias.map((t) => {
        const porcentaje = Math.min(100, Math.round((t.bytesRecibidos / t.tamañoEsperado) * 100))
        const completado = t.estado === 'completado' || porcentaje >= 100
        return (
          <div key={t.transferId} className="tarjeta-progreso">
            <div className="fila-info-progreso">
              <span className="nombre-archivo-progreso">
                {t.nombreArchivo}{t.remitente ? ` — de ${t.remitente}` : ''}
              </span>
              <span className="porcentaje-progreso">{completado ? 'Completado' : `${porcentaje}%`}</span>
            </div>
            <div className="riel-progreso">
              <div className="relleno-progreso" style={{ width: `${porcentaje}%` }} />
            </div>
            {!completado && (
              <span className="peso-progreso">
                {formatearBytes(t.bytesRecibidos)} / {formatearBytes(t.tamañoEsperado)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default BarraProgreso