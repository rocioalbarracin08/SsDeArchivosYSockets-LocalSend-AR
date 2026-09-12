import ZonaDropArchivos from '../Controlador/ZonaDropArchivos'
import ListaArchivosElegidos from '../Contenido/ListaArchivosElegidos'
import './Seccion.css'

interface ArchivoElegido {
  ruta: string
  nombre: string
}

interface Props {
  archivosElegidos: ArchivoElegido[]
  onAgregar: (lista: FileList) => void
  onQuitar: (nombre: string) => void
}

function SeccionArchivos({ archivosElegidos, onAgregar, onQuitar }: Props) {
  return (
    <section className="seccion">
      <h2>Elegir archivos</h2>
      <ZonaDropArchivos onArchivosSeleccionados={onAgregar} />
      <ListaArchivosElegidos archivos={archivosElegidos} onQuitar={onQuitar} />
    </section>
  )
}

export default SeccionArchivos