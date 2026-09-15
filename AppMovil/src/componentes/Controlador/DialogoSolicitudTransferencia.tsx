import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colores } from '../../estilos/colores'
import { formatearBytes } from '../../../../estructuraCompartida/utilidades/formatearBytes'
import type { DescripcionArchivos } from '../../../../estructuraCompartida/tipos/DescripcionArchivos'

interface Props {
  transferId: string
  descripcion: DescripcionArchivos
  onAceptar: (transferId: string) => void
  onRechazar: (transferId: string) => void
}

function DialogoSolicitudTransferencia({ transferId, descripcion, onAceptar, onRechazar }: Props) {
  return (
    <Modal transparent animationType="fade" visible>
      <View style={estilos.fondo}>
        <View style={estilos.tarjeta}>
          <Text style={estilos.remitente}>{descripcion.remitente} quiere enviarte un archivo</Text>
          <Text style={estilos.nombreArchivo}>{descripcion.nombre}</Text>
          <Text style={estilos.peso}>{formatearBytes(descripcion.tamaño)}</Text>
          <View style={estilos.filaBotones}>
            <TouchableOpacity style={estilos.botonRechazar} onPress={() => onRechazar(transferId)}>
              <Text style={estilos.textoRechazar}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.botonAceptar} onPress={() => onAceptar(transferId)}>
              <Text style={estilos.textoAceptar}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(10,10,15,0.75)', alignItems: 'center', justifyContent: 'center' },
  tarjeta: { backgroundColor: colores.fondoTarjeta, borderWidth: 1, borderColor: colores.bordeSutil, borderRadius: 12, padding: 24, minWidth: 280 },
  remitente: { color: colores.acentoMauveClaro, fontSize: 14, marginBottom: 8 },
  nombreArchivo: { color: colores.textoPrincipal, fontSize: 18, fontWeight: '600', marginBottom: 4 },
  peso: { color: colores.textoSecundario, fontSize: 13, marginBottom: 24 },
  filaBotones: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  botonRechazar: { backgroundColor: colores.fondoElemento, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18 },
  botonAceptar: { backgroundColor: colores.acentoMauve, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18 },
  textoRechazar: { color: colores.textoPrincipal, fontSize: 14 },
  textoAceptar: { color: colores.fondoApp, fontSize: 14, fontWeight: '600' }
})

export default DialogoSolicitudTransferencia