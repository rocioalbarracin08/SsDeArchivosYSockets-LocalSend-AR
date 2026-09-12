import BotonToggleVisibilidad from '../Controlador/BotonToggleVisibilidad'
import { useVisibilidad } from '../../hooks/useVisibilidad'
import './Seccion.css'

function SeccionVisibilidad() {
  const { visible, alternarVisibilidad } = useVisibilidad()

  return (
    <section className="seccion">
      <BotonToggleVisibilidad visible={visible} onClick={alternarVisibilidad} />
    </section>
  )
}

export default SeccionVisibilidad