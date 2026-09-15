// src/componentes/Controlador/CasillaSeleccion.tsx
//
// Checkbox personalizado y reutilizable. En RN no existen los checkboxes con
// estilo propio del navegador, así que armamos el nuestro con una cajita que
// cambia de color/relleno según esté marcada o no.
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { colores } from '../../estilos/colores'

interface Props {
  marcada: boolean
  onCambiar: () => void
}

function CasillaSeleccion({ marcada, onCambiar }: Props) {
  return (
    <TouchableOpacity
      onPress={onCambiar}
      style={[estilos.casilla, marcada && estilos.casillaMarcada]}
      activeOpacity={0.7}
    >
      {marcada && <View style={estilos.relleno} />}
    </TouchableOpacity>
  )
}

const estilos = StyleSheet.create({
  casilla: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colores.bordeSutil,
    backgroundColor: colores.fondoElemento,
    alignItems: 'center',
    justifyContent: 'center'
  },
  casillaMarcada: {
    backgroundColor: colores.acentoMauve,
    borderColor: colores.acentoMauve
  },
  relleno: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: colores.fondoApp
  }
})

export default CasillaSeleccion