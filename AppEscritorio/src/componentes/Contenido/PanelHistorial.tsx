import { useState } from 'react'
import './PanelHistorial.css'

interface ItemHistorial {
  id: string
  etiqueta: string
  estadoTexto: string
}

interface Props {
  items: ItemHistorial[]
  onEliminar: (ids: string[]) => void
}

function PanelHistorial({ items, onEliminar }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())

  function alternarSeleccion(id: string) {
    setSeleccionados((previos) => {
      const copia = new Set(previos)
      if (copia.has(id)) copia.delete(id)
      else copia.add(id)
      return copia
    })
  }

  function eliminarSeleccionados() {
    onEliminar(Array.from(seleccionados))
    setSeleccionados(new Set())
  }

  if (items.length === 0) return null

  return (
    <div className="panel-historial">
      <button className="boton-ver-historial" onClick={() => setAbierto((v) => !v)}>
        {abierto ? 'Ocultar historial' : `Ver historial (${items.length})`}
      </button>

      {abierto && (
        <div className="contenido-historial">
          <ul className="lista-historial">
            {items.map((item) => (
              <li key={item.id} className="item-historial">
                <input
                  type="checkbox"
                  checked={seleccionados.has(item.id)}
                  onChange={() => alternarSeleccion(item.id)}
                />
                <span className="etiqueta-historial">{item.etiqueta}</span>
                <span className="estado-historial">{item.estadoTexto}</span>
              </li>
            ))}
          </ul>
          {seleccionados.size > 0 && (
            <button className="boton-eliminar-historial" onClick={eliminarSeleccionados}>
              Eliminar seleccionados ({seleccionados.size})
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default PanelHistorial