import { View, Text, StyleSheet } from 'react-native'
import { colores } from '../../estilos/colores'

interface EnvioSaliente {
  envioId: string
  nombreArchivo: string
  nombreDispositivo: string
  estado: string
}

const TEXTOS_ESTADO: Record<string, string> = {
  enviando: 'Enviando solicitud...',
  esperando: 'Esperando que acepte...',
  aceptado: 'Aceptado, transfiriendo...',
  rechazado: 'Rechazado',
  completado: 'Entregado con éxito',
  error: 'No se pudo conectar'
}

const COLOR_POR_ESTADO: Record<string, string> = {
  completado: '#7fbf8f',
  rechazado: '#c97a7a',
  error: '#c97a7a'
}

interface Props {
  envios: EnvioSaliente[]
}

function ResumenEnvios({ envios }: Props) {
  if (envios.length === 0) return null

  return (
    <View style={estilos.lista}>
      {envios.map((e) => (
        <View key={e.envioId} style={estilos.item}>
          <Text style={estilos.nombreArchivo}>{e.nombreArchivo}</Text>
          <Text style={estilos.destino}>→ {e.nombreDispositivo}</Text>
          <Text style={[estilos.estado, { color: COLOR_POR_ESTADO[e.estado] ?? colores.acentoMauveClaro }]}>
            {TEXTOS_ESTADO[e.estado] ?? e.estado}
          </Text>
        </View>
      ))}
    </View>
  )
}

const estilos = StyleSheet.create({
  lista: {
    marginTop: 14,
    gap: 6
  },

  item: {
    backgroundColor: colores.fondoTarjeta,
    borderRadius: 8,
    padding: 10
  },

  nombreArchivo: {
    color: colores.textoPrincipal,
    fontWeight: '600',
    fontSize: 13,
    flexShrink: 1
  },

  destino: {
    color: colores.textoSecundario,
    fontSize: 13,
    marginTop: 4,
    flexShrink: 1
  },

  estado: {
    fontSize: 12,
    marginTop: 6,
    flexShrink: 1
  }
})

export default ResumenEnvios