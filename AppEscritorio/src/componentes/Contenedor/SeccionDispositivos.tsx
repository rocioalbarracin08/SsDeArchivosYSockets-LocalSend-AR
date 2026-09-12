import BotonActualizarLista from '../Controlador/BotonActualizarLista'
import ListaDispositivos from '../Contenido/ListaDispositivos'
import { useDispositivos, type Dispositivo } from '../../hooks/useDispositivos'
import './Seccion.css'

interface Props {
  onEnviar: (dispositivo: Dispositivo) => void
}

function SeccionDispositivos({ onEnviar }: Props) {
  const { dispositivos, actualizarLista } = useDispositivos()

  return (
    <section className="seccion">
      <h2>Dispositivos cercanos</h2>
      <BotonActualizarLista onClick={actualizarLista} />
      <ListaDispositivos dispositivos={dispositivos} onEnviar={onEnviar} />
    </section>
  )
}

export default SeccionDispositivos