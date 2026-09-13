import BarraProgreso from '../Contenido/BarraProgreso'
import PanelHistorial from '../Contenido/PanelHistorial'
import DialogoSolicitudTransferencia from '../Controlador/DialogoSolicitudTransferencia'
import { useRecepciones } from '../../hooks/useRecepciones'
import { useTransferencias } from '../../hooks/useTransferencias'
import './Seccion.css'

function SeccionRecepciones() {
  const { activos, historial, eliminarRecepciones } = useRecepciones()
  const { solicitudActual, responderSolicitud } = useTransferencias()

  const itemsHistorial = historial.map((r) => ({
    id: r.transferId,
    etiqueta: `${r.nombreArchivo} de ${r.remitente}`,
    estadoTexto: 'Recibido'
  }))

  return (
    <section className="seccion">
      <h2 className="subtitulo-transferencia">Recibidos</h2>
      {activos.length === 0 && historial.length === 0 && (
        <p className="texto-sin-dispositivos">Todavía no recibiste nada.</p>
      )}
      <BarraProgreso transferencias={activos} />
      <PanelHistorial items={itemsHistorial} onEliminar={eliminarRecepciones} />

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

export default SeccionRecepciones