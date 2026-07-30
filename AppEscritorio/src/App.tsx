import { useState, useEffect, useRef } from 'react'

interface Dispositivo {
  name: string
  addresses: string[]
  port: number
}

// Forma interna de cada archivo ya elegido, listo para mostrarse y enviarse.
interface ArchivoElegido {
  ruta: string
  nombre: string
}

function App() {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
  const [archivosElegidos, setArchivosElegidos] = useState<ArchivoElegido[]>([])
  const [estaArrastrando, setEstaArrastrando] = useState(false) // NUEVO: para el feedback visual de "soltá acá"
  const inputArchivoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.api.onDispositivoEncontrado((data: Dispositivo) => {
      setDispositivos((previos) => {
        const yaExiste = previos.some((d) => d.name === data.name)
        return yaExiste ? previos : [...previos, data]
      })
    })
  }, [])

  // Convierte una FileList (viene tanto del input como del drop) en nuestro
  // formato interno, y la suma a lo que ya estaba elegido (no reemplaza).
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

  // --- Drag & Drop ---
  function manejarDragOver(evento: React.DragEvent) {
    evento.preventDefault() // OBLIGATORIO: sin esto, el navegador cancela el drop automáticamente
    setEstaArrastrando(true)
  }

  function manejarDragLeave() {
    setEstaArrastrando(false)
  }

  function manejarDrop(evento: React.DragEvent) {
    evento.preventDefault() // evita que el navegador intente "abrir" el archivo
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
    // Por ahora mandamos uno por uno; clienteEnvio.ts (pendiente) recién
    // va a hacer algo real con esto del lado Main.
    archivosElegidos.forEach((archivo) => {
      window.api.enviarArchivo(archivo.ruta, dispositivo.addresses[0])
    })
  }
  

  return (
    <div>
      <h1>LocalSend - Desktop</h1>

      <section>
        <h2>1. Elegir archivos</h2>

        {/* Zona de drop: reacciona a arrastrar y soltar, sin estilos todavía */}
        <div
          onDragOver={manejarDragOver}
          onDragLeave={manejarDragLeave}
          onDrop={manejarDrop}
          style={{ border: '2px dashed gray', padding: '20px' }}
        >
          {estaArrastrando ? 'Soltá el archivo acá' : 'Arrastrá archivos acá, o elegí manualmente:'}
          <br />
<input
  type="file"
  multiple
  ref={inputArchivoRef}
  onChange={manejarSeleccionArchivo}
  style={{ display: 'none' }} // oculta el control nativo feo con su texto fijo
/>
<button onClick={() => inputArchivoRef.current?.click()}>
  Elegir archivos
</button>        </div>

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