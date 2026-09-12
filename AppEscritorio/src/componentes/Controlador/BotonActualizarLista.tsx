import { useState } from 'react'
import './BotonActualizarLista.css'

interface Props {
  onClick: () => void
}

function BotonActualizarLista({ onClick }: Props) {
  const [actualizando, setActualizando] = useState(false)

  function manejarClick() {
    setActualizando(true)
    onClick()
    // La búsqueda real es instantánea (reenvía lo ya conocido),
    // así que el ícono gira un momento corto solo como confirmación visual.
    setTimeout(() => setActualizando(false), 600)
  }

  return (
    <button className="boton-actualizar-lista" onClick={manejarClick}>
      <span className={`icono-actualizar ${actualizando ? 'icono-girando' : ''}`}>⟳</span>
      Actualizar lista
    </button>
  )
}

export default BotonActualizarLista