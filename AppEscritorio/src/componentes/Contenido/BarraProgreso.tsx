import './BarraProgreso.css'
import { formatearBytes } from '../../../../estructuraCompartida/utilidades/formatearBytes'

interface ProgresoTransferencia {
  transferId: string
  nombreArchivo: string
  bytesRecibidos: number
  tamañoEsperado: number
}

interface Props {
  transferencias: ProgresoTransferencia[]
}

function BarraProgreso({ transferencias }: Props) {
  if (transferencias.length === 0) return null

  return (
    <div className="lista-progresos">
      {transferencias.map((t) => {
        const porcentaje = Math.min(100, Math.round((t.bytesRecibidos / t.tamañoEsperado) * 100))
        return (
          <div key={t.transferId} className="tarjeta-progreso">
            <div className="fila-info-progreso">
              <span className="nombre-archivo-progreso">{t.nombreArchivo}</span>
              <span className="porcentaje-progreso">{porcentaje}%</span>
            </div>
            <div className="riel-progreso">
              <div className="relleno-progreso" style={{ width: `${porcentaje}%` }} />
            </div>
            <span className="peso-progreso">
              {formatearBytes(t.bytesRecibidos)} / {formatearBytes(t.tamañoEsperado)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default BarraProgreso