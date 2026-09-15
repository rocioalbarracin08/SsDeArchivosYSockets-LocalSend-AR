import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colores } from '../../estilos/colores'
import { formatearBytes } from '../../../../estructuraCompartida/utilidades/formatearBytes'
import type { ArchivoElegido } from '../../hooks/useArchivosElegidos'

interface Props {
  archivos: ArchivoElegido[]
  onQuitar: (nombre: string) => void
}

function ListaArchivosElegidos({ archivos, onQuitar }: Props) {
  if (archivos.length === 0) return null

  return (
    <View style={estilos.lista}>
      {archivos.map((a) => (
        <View key={a.nombre} style={estilos.item}>
          <View style={estilos.info}>
            <Text style={estilos.nombre}>{a.nombre}</Text>
            <Text style={estilos.tamaño}>{formatearBytes(a.tamaño)}</Text>
          </View>
          <TouchableOpacity onPress={() => onQuitar(a.nombre)}>
            <Text style={estilos.botonQuitar}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  )
}

const estilos = StyleSheet.create({
  lista: { marginTop: 14, gap: 6 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.fondoTarjeta,
    borderRadius: 8,
    padding: 10
  },
  info: { flex: 1 },
  nombre: { color: colores.textoPrincipal, fontSize: 13 },
  tamaño: { color: colores.textoSecundario, fontSize: 11, marginTop: 2 },
  botonQuitar: { color: colores.textoSecundario, fontSize: 14, paddingHorizontal: 6 }
})

export default ListaArchivosElegidos