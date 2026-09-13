import ResumenEnvios from '../Contenido/ResumenEnvios'
import PanelHistorial from '../Contenido/PanelHistorial'
import { useEnviosSalientes } from '../../hooks/useEnviosSalientes'
import './Seccion.css'

function SeccionEnvios() {
  const { activos, historial, eliminarEnvios } = useEnviosSalientes()

  const itemsHistorial = historial.map((e) => ({
    id: e.envioId,
    etiqueta: `${e.nombreArchivo} → ${e.nombreDispositivo}`,
    estadoTexto: e.estado
  }))

  return (
    <section className="seccion">
      <h2 className="subtitulo-transferencia">Enviados</h2>
      {activos.length === 0 && historial.length === 0 && (
        <p className="texto-sin-dispositivos">Todavía no enviaste nada.</p>
      )}
      <ResumenEnvios envios={activos} />
      <PanelHistorial items={itemsHistorial} onEliminar={eliminarEnvios} />
    </section>
  )
}

export default SeccionEnvios