import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colores } from '../../estilos/colores'

interface Props {
  onPresionar: () => void
}

function SelectorArchivos({ onPresionar }: Props) {
  return (
    <View style={estilos.zona}>
      <Text style={estilos.texto}>Tocá para elegir archivos</Text>
      <TouchableOpacity style={estilos.boton} onPress={onPresionar}>
        <Text style={estilos.textoBoton}>Elegir archivos</Text>
      </TouchableOpacity>
    </View>
  )
}

const estilos = StyleSheet.create({
  zona: {
    borderWidth: 2,
    borderColor: colores.bordeSutil,
    borderStyle: 'dashed',
    borderRadius: colores.radioBorde,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  texto: { color: colores.textoSecundario, marginBottom: 14 },
  boton: {
    backgroundColor: colores.acentoMauve,
    borderRadius: colores.radioBorde,
    paddingVertical: 10,
    paddingHorizontal: 18
  },
  textoBoton: { color: colores.fondoApp, fontWeight: '600' }
})

export default SelectorArchivos