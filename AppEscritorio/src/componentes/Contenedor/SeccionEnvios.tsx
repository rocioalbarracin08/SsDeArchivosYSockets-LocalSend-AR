import ResumenEnvios from '../Contenido/ResumenEnvios'
import PanelHistorial from '../Contenido/PanelHistorial'
import type { EnvioSaliente } from '../../hooks/useEnviosSalientes'
import './Seccion.css'

interface Props {
  activos: EnvioSaliente[]
  historial: EnvioSaliente[]
  onEliminar: (ids: string[]) => void
}

// Ya NO llama a useEnviosSalientes acá adentro — recibe los datos ya listos
// desde App.tsx, así todos miran la misma "fuente de verdad".
function SeccionEnvios({ activos, historial, onEliminar }: Props) {
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
      <PanelHistorial items={itemsHistorial} onEliminar={onEliminar} />
    </section>
  )
}

export default SeccionEnvios