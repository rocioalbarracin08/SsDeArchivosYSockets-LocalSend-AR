import { View } from 'react-native'
import BotonToggleVisibilidad from '../Controlador/BotonToggleVisibilidad'
import { useVisibilidad } from '../../hooks/useVisibilidad'
import { estilosSeccion } from '../../estilos/Seccion.styles'

function SeccionVisibilidad() {
  const { visible, alternarVisibilidad } = useVisibilidad()

  return (
    <View style={estilosSeccion.seccion}>
      <BotonToggleVisibilidad visible={visible} onPresionar={alternarVisibilidad} />
    </View>
  )
}

export default SeccionVisibilidad