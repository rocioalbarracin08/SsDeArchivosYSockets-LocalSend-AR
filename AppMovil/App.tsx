import './src/red/polyfillBuffer'
import { useEffect } from 'react'
import { ScrollView, Text, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from "react-native-safe-area-context";
import SeccionVisibilidad from './src/componentes/Contenedor/SeccionVisibilidad'
import SeccionArchivos from './src/componentes/Contenedor/SeccionArchivos'
import SeccionDispositivos from './src/componentes/Contenedor/SeccionDispositivos'
import SeccionEnvios from './src/componentes/Contenedor/SeccionEnvios'
import SeccionRecepciones from './src/componentes/Contenedor/SeccionRecepciones'
import { useArchivosElegidos } from './src/hooks/useArchivosElegidos'
import { useEnviosSalientes } from './src/hooks/useEnviosSalientes'
import { enviarArchivoAPeer } from './src/red/clienteEnvio'
import { iniciarServidorTransferencia } from './src/red/servidorTransferencia'
import { generarIdUnico } from './src/red/generarIdUnico'
import { nombreDispositivo } from './src/red/identidadDispositivo'
import { PUERTO_TRANSFERENCIA } from '../estructuraCompartida/protocolo/constantes'
import { elegirDireccionIP } from '../estructuraCompartida/utilidades/elegirDireccionIP'
import { colores } from './src/estilos/colores'
import type { Dispositivo } from '../estructuraCompartida/tipos/Dispositivo'

export default function App() {
  const { archivosElegidos, agregarArchivos, quitarArchivo, vaciarArchivosElegidos } = useArchivosElegidos()
  const {
    activos: enviosActivos,
    historial: enviosHistorial,
    registrarEnvio,
    actualizarEstadoEnvio,
    eliminarEnvios
  } = useEnviosSalientes()

  useEffect(() => {
    iniciarServidorTransferencia(PUERTO_TRANSFERENCIA)
  }, [])

  function manejarEnvio(dispositivosSeleccionados: Dispositivo[]) {
    if (archivosElegidos.length === 0) {
      Alert.alert('Elegí archivos', 'Primero elegí al menos un archivo.')
      return
    }

    archivosElegidos.forEach((archivo) => {
      dispositivosSeleccionados.forEach((dispositivo) => {
        const envioId = generarIdUnico()
        registrarEnvio(envioId, archivo.nombre, dispositivo.name)

        const ipElegida = elegirDireccionIP(dispositivo.addresses)
        enviarArchivoAPeer(archivo, ipElegida, dispositivo.port, nombreDispositivo, (estado) => {
          actualizarEstadoEnvio(envioId, estado)
        })
      })
    })

    vaciarArchivosElegidos()
  }

  return (
    <SafeAreaView style={estilos.contenedorPrincipal}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <Text style={estilos.titulo}>LocalSend</Text>
        <SeccionVisibilidad />
        <SeccionArchivos archivosElegidos={archivosElegidos} onAgregar={agregarArchivos} onQuitar={quitarArchivo} />
        <SeccionDispositivos onEnviar={manejarEnvio} />
        <SeccionEnvios activos={enviosActivos} historial={enviosHistorial} onEliminar={eliminarEnvios} />
        <SeccionRecepciones />
      </ScrollView>
    </SafeAreaView>
  )
}

const estilos = StyleSheet.create({
  contenedorPrincipal: { flex: 1, backgroundColor: colores.fondoApp },
  contenido: { padding: 24 },
  titulo: { fontSize: 22, fontWeight: '700', color: colores.textoPrincipal, marginBottom: 20 }
})