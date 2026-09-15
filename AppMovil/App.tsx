import './src/red/polyfillBuffer'
import { SafeAreaView, ScrollView, Text, StyleSheet, Alert } from 'react-native'
import SeccionVisibilidad from './src/componentes/Contenedor/SeccionVisibilidad'
import SeccionArchivos from './src/componentes/Contenedor/SeccionArchivos'
import SeccionDispositivos from './src/componentes/Contenedor/SeccionDispositivos'
import { useArchivosElegidos } from './src/hooks/useArchivosElegidos'
import { colores } from './src/estilos/colores'
import type { Dispositivo } from '../estructuraCompartida/tipos/Dispositivo'

export default function App() {
  const { archivosElegidos, agregarArchivos, quitarArchivo, vaciarArchivosElegidos } = useArchivosElegidos()

  function manejarEnvio(dispositivosSeleccionados: Dispositivo[]) {
    if (archivosElegidos.length === 0) {
      Alert.alert('Elegí archivos', 'Primero elegí al menos un archivo.')
      return
    }
    console.log('Listo para enviar (todavía sin conexión real):', archivosElegidos, dispositivosSeleccionados)
    // TODO: cuando armemos el cliente de envío mobile, acá disparamos el envío real
    vaciarArchivosElegidos()
  }

  return (
    <SafeAreaView style={estilos.contenedorPrincipal}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <Text style={estilos.titulo}>LocalSend</Text>
        <SeccionVisibilidad />
        <SeccionArchivos archivosElegidos={archivosElegidos} onAgregar={agregarArchivos} onQuitar={quitarArchivo} />
        <SeccionDispositivos onEnviar={manejarEnvio} />
      </ScrollView>
    </SafeAreaView>
  )
}

const estilos = StyleSheet.create({
  contenedorPrincipal: { flex: 1, backgroundColor: colores.fondoApp },
  contenido: { padding: 24 },
  titulo: { fontSize: 22, fontWeight: '700', color: colores.textoPrincipal, marginBottom: 20 }
})