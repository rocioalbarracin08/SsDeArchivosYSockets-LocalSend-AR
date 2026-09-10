import './DialogoSolicitudTransferencia.css'
import { formatearBytes } from '../../../../estructuraCompartida/utilidades/formatearBytes'

interface DescripcionArchivos {
  nombre: string
  tamaño: number
  tipo: string
  remitente: string
}

interface Props {
  transferId: string
  descripcion: DescripcionArchivos
  onAceptar: (transferId: string) => void
  onRechazar: (transferId: string) => void
}

function DialogoSolicitudTransferencia({ transferId, descripcion, onAceptar, onRechazar }: Props) {
  return (
    <div className="fondo-dialogo">
      <div className="tarjeta-dialogo">
        <p className="texto-remitente">{descripcion.remitente} quiere enviarte un archivo</p>
        <p className="texto-nombre-archivo">{descripcion.nombre}</p>
        <p className="texto-peso-archivo">{formatearBytes(descripcion.tamaño)}</p>

        <div className="fila-botones">
          <button className="boton-rechazar" onClick={() => onRechazar(transferId)}>
            Rechazar
          </button>
          <button className="boton-aceptar" onClick={() => onAceptar(transferId)}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

export default DialogoSolicitudTransferencia