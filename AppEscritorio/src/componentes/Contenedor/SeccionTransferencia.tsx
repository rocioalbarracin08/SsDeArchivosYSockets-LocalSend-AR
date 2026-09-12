import BarraProgreso from '../Contenido/BarraProgreso'
import DialogoSolicitudTransferencia from '../Controlador/DialogoSolicitudTransferencia'
import { useTransferencias } from '../../hooks/useTransferencias'
import './Seccion.css'

function SeccionTransferencias() {
  const { solicitudActual, progresos, responderSolicitud } = useTransferencias()

  return (
    <section className="seccion">
      <h2>Transferencias en curso</h2>
      <BarraProgreso transferencias={Object.values(progresos)} />

      {solicitudActual && (
        <DialogoSolicitudTransferencia
          transferId={solicitudActual.transferId}
          descripcion={solicitudActual.descripcion}
          onAceptar={(id) => responderSolicitud(id, true)}
          onRechazar={(id) => responderSolicitud(id, false)}
        />
      )}
    </section>
  )
}

export default SeccionTransferencias