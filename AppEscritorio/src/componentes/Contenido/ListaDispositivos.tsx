import BotonEnviarA from '../Controlador/BotonEnviarA'
import './ListaDispositivos.css'

interface Dispositivo {
  name: string
  addresses: string[]
  port: number
}

interface Props {
  dispositivos: Dispositivo[]
  onEnviar: (dispositivo: Dispositivo) => void
}

function ListaDispositivos({ dispositivos, onEnviar }: Props) {
  if (dispositivos.length === 0) {
    return <p className="texto-sin-dispositivos">Ningún dispositivo encontrado todavía.</p>
  }

  return (
    <ul className="lista-dispositivos">
      {dispositivos.map((d) => (
        <li key={d.name} className="item-dispositivo">
          <div>
            <p className="nombre-dispositivo">{d.name}</p>
            <p className="direccion-dispositivo">{d.addresses[0]}:{d.port}</p>
          </div>
          <BotonEnviarA onClick={() => onEnviar(d)} />
        </li>
      ))}
    </ul>
  )
}

export default ListaDispositivos