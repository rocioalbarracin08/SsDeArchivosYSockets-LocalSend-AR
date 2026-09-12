import './BotonToggleVisibilidad.css'

interface Props {
  visible: boolean
  onClick: () => void
}

function BotonToggleVisibilidad({ visible, onClick }: Props) {
  return (
    <div className="fila-visibilidad">
      <span className={`led-estado ${visible ? 'led-activo' : ''}`} />
      <p className="texto-estado-visibilidad">
        {visible ? 'Visible en la red' : 'Oculto — nadie puede encontrarte'}
      </p>
      <button className="boton-toggle-visibilidad" onClick={onClick}>
        {visible ? 'Desactivar' : 'Activar'}
      </button>
    </div>
  )
}

export default BotonToggleVisibilidad