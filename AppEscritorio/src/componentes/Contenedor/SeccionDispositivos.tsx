import { useState } from 'react'
import BotonActualizarLista from '../Controlador/BotonActualizarLista'
import ListaDispositivos from '../Contenido/ListaDispositivos'
import { useDispositivos, type Dispositivo } from '../../hooks/useDispositivos'
import './Seccion.css'

interface Props {
  onEnviar: (dispositivos: Dispositivo[]) => void
}

function SeccionDispositivos({ onEnviar }: Props) {
  const { dispositivos, actualizarLista, huboCambioReciente } = useDispositivos()
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())

  function alternarSeleccion(nombre: string) {
    setSeleccionados((previos) => {
      const copia = new Set(previos)
      if (copia.has(nombre)) copia.delete(nombre)
      else copia.add(nombre)
      return copia
    })
  }

  function manejarEnvio() {
    const elegidos = dispositivos.filter((d) => seleccionados.has(d.name))
    onEnviar(elegidos)
  }

  return (
    <section className="seccion">
      <h2>
        Dispositivos cercanos
        {huboCambioReciente && <span className="spinner-cambio"> ⟳</span>}
      </h2>
      <BotonActualizarLista onClick={actualizarLista} />
      <ListaDispositivos
        dispositivos={dispositivos}
        seleccionados={seleccionados}
        onToggleSeleccion={alternarSeleccion}
      />
      {seleccionados.size > 0 && (
        <button className="boton-enviar-seleccionados" onClick={manejarEnvio}>
          Enviar a {seleccionados.size} dispositivo{seleccionados.size > 1 ? 's' : ''}
        </button>
      )}
    </section>
  )
}

export default SeccionDispositivos