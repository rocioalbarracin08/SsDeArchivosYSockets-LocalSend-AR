import './BotonEnviarA.css'

interface Props {
  onClick: () => void
}

function BotonEnviarA({ onClick }: Props) {
  return (
    <button className="boton-enviar-a" onClick={onClick}>
      Enviar acá
    </button>
  )
}

export default BotonEnviarA