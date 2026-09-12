import './index.css'
import SeccionVisibilidad from './componentes/Contenedor/SeccionVisibilidad'
import SeccionArchivos from './componentes/Contenedor/SeccionArchivos'
import SeccionDispositivos from './componentes/Contenedor/SeccionDispositivos'
import SeccionTransferencias from './componentes/Contenedor/SeccionTransferencia'
import ResumenEnvios from './componentes/Contenido/ResumenEnvios'
import { useArchivosElegidos } from './hooks/useArchivosElegidos'
import { useEnviosSalientes } from './hooks/useEnviosSalientes'
import type { Dispositivo } from './hooks/useDispositivos'

function App() {
  const { archivosElegidos, agregarArchivos, quitarArchivo } = useArchivosElegidos()
  const { envios, registrarEnvio } = useEnviosSalientes()

  function manejarEnvio(dispositivo: Dispositivo) {
    if (archivosElegidos.length === 0) {
      alert('Primero elegí al menos un archivo.')
      return
    }
    archivosElegidos.forEach((archivo) => {
      const envioId = crypto.randomUUID()
      registrarEnvio(envioId, archivo.nombre, dispositivo.name)
      window.api.enviarArchivo(envioId, archivo.ruta, dispositivo.addresses, dispositivo.port, dispositivo.name)
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
      <SeccionTransferencias />
      <ResumenEnvios envios={envios} />
    </div>
  )
}

export default App