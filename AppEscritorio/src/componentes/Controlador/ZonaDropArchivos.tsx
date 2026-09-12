import { useRef, useState } from 'react'
import './ZonaDropArchivos.css'

interface Props {
  onArchivosSeleccionados: (lista: FileList) => void
}

function ZonaDropArchivos({ onArchivosSeleccionados }: Props) {
  const [estaArrastrando, setEstaArrastrando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function manejarDragOver(evento: React.DragEvent) {
    evento.preventDefault()
    setEstaArrastrando(true)
  }

  function manejarDragLeave() {
    setEstaArrastrando(false)
  }

  function manejarDrop(evento: React.DragEvent) {
    evento.preventDefault()
    setEstaArrastrando(false)
    if (evento.dataTransfer.files) onArchivosSeleccionados(evento.dataTransfer.files)
  }

  function manejarSeleccion(evento: React.ChangeEvent<HTMLInputElement>) {
    if (evento.target.files) onArchivosSeleccionados(evento.target.files)
  }

  return (
    <div
      className={`zona-drop ${estaArrastrando ? 'zona-drop-activa' : ''}`}
      onDragOver={manejarDragOver}
      onDragLeave={manejarDragLeave}
      onDrop={manejarDrop}
    >
      <p className="texto-zona-drop">
        {estaArrastrando ? 'Soltá el archivo acá' : 'Arrastrá archivos acá'}
      </p>
      <input
        type="file"
        multiple
        ref={inputRef}
        onChange={manejarSeleccion}
        style={{ display: 'none' }}
      />
      <button className="boton-elegir-archivos" onClick={() => inputRef.current?.click()}>
        Elegir archivos
      </button>
    </div>
  )
}

export default ZonaDropArchivos