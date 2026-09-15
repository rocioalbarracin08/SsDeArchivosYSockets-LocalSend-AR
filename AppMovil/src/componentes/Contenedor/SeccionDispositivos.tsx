// src/componentes/Contenedor/SeccionDispositivos.tsx
import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import BotonActualizarLista from '../Controlador/BotonActualizarLista'
import ListaDispositivos from '../Contenido/ListaDispositivos'
import { useDispositivos } from '../../hooks/useDispositivos'
import { estilosSeccion } from '../../estilos/Seccion.styles'
import { colores } from '../../estilos/colores'
import type { Dispositivo } from '../../../../estructuraCompartida/tipos/Dispositivo'

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
    setSeleccionados(new Set()) // arranca en 0 para el próximo envío
  }

  return (
    <View style={estilosSeccion.seccion}>
      <Text style={estilosSeccion.tituloSeccion}>
        Dispositivos cercanos{huboCambioReciente ? ' ⟳' : ''}
      </Text>
      <BotonActualizarLista onPresionar={actualizarLista} />
      <ListaDispositivos dispositivos={dispositivos} seleccionados={seleccionados} onToggleSeleccion={alternarSeleccion} />
      {seleccionados.size > 0 && (
        <TouchableOpacity style={estilos.botonEnviar} onPress={manejarEnvio}>
          <Text style={estilos.textoBotonEnviar}>
            Enviar a {seleccionados.size} dispositivo{seleccionados.size > 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const estilos = StyleSheet.create({
  botonEnviar: {
    marginTop: 12,
    backgroundColor: colores.acentoMauve,
    borderRadius: colores.radioBorde,
    paddingVertical: 10,
    alignItems: 'center'
  },
  textoBotonEnviar: { color: colores.fondoApp, fontWeight: '600' }
})

export default SeccionDispositivos