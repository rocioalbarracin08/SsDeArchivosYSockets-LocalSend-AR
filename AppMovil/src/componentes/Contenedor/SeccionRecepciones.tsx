import { View, Text } from 'react-native'
import BarraProgreso from '../Contenido/BarraProgreso'
import PanelHistorial from '../Contenido/PanelHistorial'
import DialogoSolicitudTransferencia from '../Controlador/DialogoSolicitudTransferencia'
import { useRecepciones } from '../../hooks/useRecepciones'
import { useTransferencias } from '../../hooks/useTransferencias'
import { estilosSeccion } from '../../estilos/Seccion.styles'

function SeccionRecepciones() {
  const { activos, historial, eliminarRecepciones } = useRecepciones()
  const { solicitudActual, responderSolicitud } = useTransferencias()

  const itemsHistorial = historial.map((r) => ({
    id: r.transferId,
    etiqueta: `${r.nombreArchivo} de ${r.remitente}`,
    estadoTexto: 'Recibido'
  }))

  return (
    <View style={estilosSeccion.seccion}>
      <Text style={estilosSeccion.tituloSeccion}>Recibidos</Text>
      {activos.length === 0 && historial.length === 0 && (
        <Text style={estilosSeccion.textoSecundario}>Todavía no recibiste nada.</Text>
      )}
      <BarraProgreso transferencias={activos} />
      <PanelHistorial items={itemsHistorial} onEliminar={eliminarRecepciones} />

      {solicitudActual && (
        <DialogoSolicitudTransferencia
          transferId={solicitudActual.transferId}
          descripcion={solicitudActual.descripcion}
          onAceptar={(id) => responderSolicitud(id, true)}
          onRechazar={(id) => responderSolicitud(id, false)}
        />
      )}
    </View>
  )
}

export default SeccionRecepciones