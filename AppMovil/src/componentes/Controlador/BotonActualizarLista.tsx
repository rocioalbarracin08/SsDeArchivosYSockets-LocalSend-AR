// src/componentes/Controlador/BotonActualizarLista.tsx
import { useState } from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { colores } from '../../estilos/colores'

interface Props {
  onPresionar: () => void
}

function BotonActualizarLista({ onPresionar }: Props) {
  const [actualizando, setActualizando] = useState(false)

  function manejarPresion() {
    setActualizando(true)
    onPresionar()
    setTimeout(() => setActualizando(false), 600)
  }

  return (
    <TouchableOpacity style={estilos.boton} onPress={manejarPresion}>
      <Text style={estilos.texto}>{actualizando ? '⟳ Buscando...' : '⟳ Actualizar lista'}</Text>
    </TouchableOpacity>
  )
}

const estilos = StyleSheet.create({
  boton: {
    backgroundColor: colores.fondoElemento,
    borderWidth: 1,
    borderColor: colores.bordeSutil,
    borderRadius: colores.radioBorde,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 4
  },
  texto: { color: colores.textoPrincipal }
})

export default BotonActualizarLista