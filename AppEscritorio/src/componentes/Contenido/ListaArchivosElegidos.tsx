import './ListaArchivosElegidos.css'

interface ArchivoElegido {
  ruta: string
  nombre: string
}

interface Props {
  archivos: ArchivoElegido[]
  onQuitar: (nombre: string) => void
}

function ListaArchivosElegidos({ archivos, onQuitar }: Props) {
  if (archivos.length === 0) return null

  return (
    <ul className="lista-archivos-elegidos">
      {archivos.map((a) => (
        <li key={a.nombre} className="item-archivo-elegido">
          <span>{a.nombre}</span>
          <button className="boton-quitar-archivo" onClick={() => onQuitar(a.nombre)}>
            ✕
          </button>
        </li>
      ))}
    </ul>
  )
}

export default ListaArchivosElegidos