import { useState, useEffect, useRef } from 'react'

interface Dispositivo {
  name: string
  addresses: string[]
  port: number
}

interface ArchivoElegido {
  ruta: string
  nombre: string
}

function App() {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
  const [archivosElegidos, setArchivosElegidos] = useState<ArchivoElegido[]>([])
  const [estaArrastrando, setEstaArrastrando] = useState(false)
  const [visible, setVisible] = useState(true)
  const inputArchivoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.api.onDispositivoEncontrado((data: Dispositivo) => {
      setDispositivos((previos) => {
        const yaExiste = previos.some((d) => d.name === data.name)
        return yaExiste ? previos : [...previos, data]
      })
    })
  }, [])

  function agregarArchivos(lista: FileList) {
    const nuevos: ArchivoElegido[] = Array.from(lista).map((archivo) => ({
      ruta: window.api.obtenerRutaDeArchivo(archivo),
      nombre: archivo.name
    }))
    setArchivosElegidos((previos) => [...previos, ...nuevos])
  }

  function manejarSeleccionArchivo(evento: React.ChangeEvent<HTMLInputElement>) {
    if (evento.target.files) agregarArchivos(evento.target.files)
  }

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
    if (evento.dataTransfer.files) agregarArchivos(evento.dataTransfer.files)
  }

  function quitarArchivo(nombre: string) {
    setArchivosElegidos((previos) => previos.filter((a) => a.nombre !== nombre))
  }

  function manejarEnvio(dispositivo: Dispositivo) {
    if (archivosElegidos.length === 0) {
      alert('Primero elegí al menos un archivo.')
      return
    }
    archivosElegidos.forEach((archivo) => {
      window.api.enviarArchivo(archivo.ruta, dispositivo.addresses[0], dispositivo.port)
    })
  }

  function alternarVisibilidad() {
    const nuevoEstado = !visible
    setVisible(nuevoEstado)
    window.api.cambiarVisibilidad(nuevoEstado)
  }

  return (
    <div>
      <h1>LocalSend - Desktop</h1>

      <section>
        <h2>Visibilidad</h2>
        <p>{visible ? 'Visible en la red' : 'Oculto — nadie puede encontrarte'}</p>
        <button onClick={alternarVisibilidad}>
          {visible ? 'Desactivar estado visible' : 'Activar estado visible'}
        </button>
      </section>

      <section>
        <h2>1. Elegir archivos</h2>
        <div
          onDragOver={manejarDragOver}
          onDragLeave={manejarDragLeave}
          onDrop={manejarDrop}
          style={{ border: '2px dashed gray', padding: '20px' }}
        >
          {estaArrastrando ? 'Soltá el archivo acá' : 'Arrastrá archivos acá'}
          <br />
          <input
            type="file"
            multiple
            ref={inputArchivoRef}
            onChange={manejarSeleccionArchivo}
            style={{ display: 'none' }}
          />
          <button onClick={() => inputArchivoRef.current?.click()}>Elegir archivos</button>
        </div>

        <ul>
          {archivosElegidos.map((a) => (
            <li key={a.nombre}>
              {a.nombre}
              <button onClick={() => quitarArchivo(a.nombre)}>Quitar</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>2. Dispositivos cercanos</h2>
        <button onClick={() => window.api.buscarDispositivos()}>Buscar dispositivos</button>
        <ul>
          {dispositivos.length === 0 && <li>Ningún dispositivo encontrado todavía.</li>}
          {dispositivos.map((d) => (
            <li key={d.name}>
              {d.name} — {d.addresses[0]}:{d.port}
              <button onClick={() => manejarEnvio(d)}>Enviar acá</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default App