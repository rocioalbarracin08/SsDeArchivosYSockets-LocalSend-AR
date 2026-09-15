import { View, Text } from 'react-native'
import SelectorArchivos from '../Controlador/SelectorArchivos'
import ListaArchivosElegidos from '../Contenido/ListaArchivosElegidos'
import { estilosSeccion } from '../../estilos/Seccion.styles'
import type { ArchivoElegido } from '../../hooks/useArchivosElegidos'

interface Props {
  archivosElegidos: ArchivoElegido[]
  onAgregar: () => void
  onQuitar: (nombre: string) => void
}

function SeccionArchivos({ archivosElegidos, onAgregar, onQuitar }: Props) {
  return (
    <View style={estilosSeccion.seccion}>
      <Text style={estilosSeccion.tituloSeccion}>Elegir archivos</Text>
      <SelectorArchivos onPresionar={onAgregar} />
      <ListaArchivosElegidos archivos={archivosElegidos} onQuitar={onQuitar} />
    </View>
  )
}

export default SeccionArchivos