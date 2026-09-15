import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colores } from '../../estilos/colores'

interface Props {
  visible: boolean
  onPresionar: () => void
}

function BotonToggleVisibilidad({ visible, onPresionar }: Props) {
  return (
    <View style={estilos.filaVisibilidad}>
      <View style={[estilos.ledEstado, visible && estilos.ledActivo]} />
      <Text style={estilos.textoEstado}>
        {visible ? 'Visible en la red' : 'Oculto — nadie puede encontrarte'}
      </Text>
      <TouchableOpacity style={estilos.boton} onPress={onPresionar}>
        <Text style={estilos.textoBoton}>{visible ? 'Desactivar' : 'Activar'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const estilos = StyleSheet.create({
  filaVisibilidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  ledEstado: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4a4550'
  },
  ledActivo: {
    backgroundColor: colores.acentoMauveClaro
  },
  textoEstado: {
    flex: 1,
    color: colores.textoSecundario,
    fontSize: 14
  },
  boton: {
    backgroundColor: colores.fondoElemento,
    borderWidth: 1,
    borderColor: colores.bordeSutil,
    borderRadius: colores.radioBorde,
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  textoBoton: {
    color: colores.textoPrincipal
  }
})

export default BotonToggleVisibilidad