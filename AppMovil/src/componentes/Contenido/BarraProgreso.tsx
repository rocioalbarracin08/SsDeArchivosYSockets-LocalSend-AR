import { View, Text, StyleSheet } from 'react-native'
import { colores } from '../../estilos/colores'
import { formatearBytes } from '../../../../estructuraCompartida/utilidades/formatearBytes'

interface ItemProgreso {
  transferId: string
  nombreArchivo: string
  remitente?: string
  bytesRecibidos: number
  tamañoEsperado: number
  estado?: string
}

interface Props {
  transferencias: ItemProgreso[]
}

function BarraProgreso({ transferencias }: Props) {
  if (transferencias.length === 0) return null

  return (
    <View style={estilos.lista}>
      {transferencias.map((t) => {
        const porcentaje = Math.min(100, Math.round((t.bytesRecibidos / t.tamañoEsperado) * 100))
        const completado = t.estado === 'completado' || porcentaje >= 100
        return (
          <View key={t.transferId} style={estilos.tarjeta}>
            <View style={estilos.filaInfo}>
              <Text style={estilos.nombreArchivo}>
                {t.nombreArchivo}{t.remitente ? ` — de ${t.remitente}` : ''}
              </Text>
              <Text style={estilos.porcentaje}>{completado ? 'Completado' : `${porcentaje}%`}</Text>
            </View>
            <View style={estilos.riel}>
              <View style={[estilos.relleno, { width: `${porcentaje}%` }]} />
            </View>
            {!completado && (
              <Text style={estilos.peso}>{formatearBytes(t.bytesRecibidos)} / {formatearBytes(t.tamañoEsperado)}</Text>
            )}
          </View>
        )
      })}
    </View>
  )
}

const estilos = StyleSheet.create({
  lista: { gap: 12, marginTop: 16 },
  tarjeta: { backgroundColor: colores.fondoTarjeta, borderWidth: 1, borderColor: colores.bordeSutil, borderRadius: 10, padding: 12 },
  filaInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  nombreArchivo: { color: colores.textoPrincipal, fontSize: 13, flex: 1 },
  porcentaje: { color: colores.acentoMauveClaro, fontSize: 13, fontWeight: '600' },
  riel: { backgroundColor: colores.fondoElemento, borderRadius: 6, height: 8, overflow: 'hidden' },
  relleno: { backgroundColor: colores.acentoMauve, height: '100%' },
  peso: { color: colores.textoSecundario, fontSize: 11, marginTop: 6 }
})

export default BarraProgreso