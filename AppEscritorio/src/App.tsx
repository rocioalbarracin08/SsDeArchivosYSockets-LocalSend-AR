import './index.css'
import SeccionVisibilidad from './componentes/Contenedor/SeccionVisibilidad'
import SeccionArchivos from './componentes/Contenedor/SeccionArchivos'
import SeccionDispositivos from './componentes/Contenedor/SeccionDispositivos'
import SeccionEnvios from './componentes/Contenedor/SeccionEnvios'
import SeccionRecepciones from './componentes/Contenedor/SeccionRecepciones'
import { useArchivosElegidos } from './hooks/useArchivosElegidos'
import { useEnviosSalientes } from './hooks/useEnviosSalientes'
import type { Dispositivo } from './hooks/useDispositivos'

function App() {
  const { archivosElegidos, agregarArchivos, quitarArchivo } = useArchivosElegidos()
  const { registrarEnvio } = useEnviosSalientes()

  function manejarEnvio(dispositivosSeleccionados: Dispositivo[]) {
    if (archivosElegidos.length === 0) {
      alert('Primero elegí al menos un archivo.')
      return
    }
    archivosElegidos.forEach((archivo) => {
      dispositivosSeleccionados.forEach((dispositivo) => {
        const envioId = crypto.randomUUID()
        registrarEnvio(envioId, archivo.nombre, dispositivo.name)
        window.api.enviarArchivo(envioId, archivo.ruta, dispositivo.addresses, dispositivo.port, dispositivo.name)
      })
    })
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <h1>LocalSend</h1>
      <SeccionVisibilidad />
      <SeccionArchivos
        archivosElegidos={archivosElegidos}
        onAgregar={agregarArchivos}
        onQuitar={quitarArchivo}
      />
      <SeccionDispositivos onEnviar={manejarEnvio} />
      <SeccionEnvios />
      <SeccionRecepciones />
    </div>
  )
}

export default App