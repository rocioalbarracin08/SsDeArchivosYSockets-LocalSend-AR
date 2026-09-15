import { StyleSheet } from 'react-native'
import { colores } from './colores'

// En RN no hay archivos .css: cada componente arma un StyleSheet y lo importa
// Este es el estilo de "tarjeta de sección" que se repite en todas las pantallas
export const estilosSeccion = StyleSheet.create({
  seccion: {
    backgroundColor: colores.fondoTarjeta,
    borderWidth: 1,
    borderColor: colores.bordeSutil,
    borderRadius: colores.radioBorde,
    padding: 20,
    marginBottom: 20
  },
  tituloSeccion: {
    fontSize: 16,
    fontWeight: '600',
    color: colores.textoPrincipal,
    marginBottom: 12
  },
  textoSecundario: {
    color: colores.textoSecundario,
    fontSize: 13
  }
})