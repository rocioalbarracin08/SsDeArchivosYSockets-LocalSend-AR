import { View, Text } from 'react-native'
import ResumenEnvios from '../Contenido/ResumenEnvios'
import PanelHistorial from '../Contenido/PanelHistorial'
import { estilosSeccion } from '../../estilos/Seccion.styles'
import type { EnvioSaliente } from '../../hooks/useEnviosSalientes'

interface Props {
  activos: EnvioSaliente[]
  historial: EnvioSaliente[]
  onEliminar: (ids: string[]) => void
}

function SeccionEnvios({ activos, historial, onEliminar }: Props) {
  const itemsHistorial = historial.map((e) => ({
    id: e.envioId,
    etiqueta: `${e.nombreArchivo} → ${e.nombreDispositivo}`,
    estadoTexto: e.estado
  }))

  return (
    <View style={estilosSeccion.seccion}>
      <Text style={estilosSeccion.tituloSeccion}>Enviados</Text>
      {activos.length === 0 && historial.length === 0 && (
        <Text style={estilosSeccion.textoSecundario}>Todavía no enviaste nada.</Text>
      )}
      <ResumenEnvios envios={activos} />
      <PanelHistorial items={itemsHistorial} onEliminar={onEliminar} />
    </View>
  )
}

export default SeccionEnvios