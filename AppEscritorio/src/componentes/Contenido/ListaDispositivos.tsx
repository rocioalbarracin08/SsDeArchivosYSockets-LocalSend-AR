import './ListaDispositivos.css'

interface Dispositivo {
  name: string
  addresses: string[]
  port: number
}

interface Props {
  dispositivos: Dispositivo[]
  seleccionados: Set<string>
  onToggleSeleccion: (nombre: string) => void
}

function ListaDispositivos({ dispositivos, seleccionados, onToggleSeleccion }: Props) {
  if (dispositivos.length === 0) {
    return <p className="texto-sin-dispositivos">Ningún dispositivo encontrado todavía.</p>
  }

  return (
    <ul className="lista-dispositivos">
      {dispositivos.map((d) => (
        <li key={d.name} className="item-dispositivo">
          <label className="etiqueta-checkbox-dispositivo">
            <input
              type="checkbox"
              className="checkbox-oculto"
              checked={seleccionados.has(d.name)}
              onChange={() => onToggleSeleccion(d.name)}
            />
            <span className="casilla-personalizada" aria-hidden="true"></span>
            <div>
              <p className="nombre-dispositivo">{d.name}</p>
              <p className="direccion-dispositivo">{d.addresses[0]}:{d.port}</p>
            </div>
          </label>
        </li>
      ))}
    </ul>
  )
}

export default ListaDispositivos