import BotonActualizarLista from '../Controlador/BotonActualizarLista'
import ListaDispositivos from '../Contenido/ListaDispositivos'
import { useDispositivos } from '../../hooks/useDispositivos'
import './Seccion.css'
import type { Dispositivo } from '../../hooks/useDispositivos'

interface Props {
  onEnviar: (dispositivo: Dispositivo) => void
}

function SeccionDispositivos({ onEnviar }: Props) {
  const { dispositivos, actualizarLista, huboCambioReciente } = useDispositivos()

  return (
    <section className="seccion">
      <h2>
        Dispositivos cercanos
        {huboCambioReciente && <span className="spinner-cambio"> ⟳</span>}
      </h2>
      <BotonActualizarLista onClick={actualizarLista} />
      <ListaDispositivos dispositivos={dispositivos} onEnviar={onEnviar} />
    </section>
  )
}

export default SeccionDispositivos