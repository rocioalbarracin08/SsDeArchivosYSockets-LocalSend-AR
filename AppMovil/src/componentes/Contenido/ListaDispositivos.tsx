// src/componentes/Contenido/ListaDispositivos.tsx
import { View, Text, StyleSheet } from 'react-native'
import CasillaSeleccion from '../Controlador/CasillaSeleccion'
import { colores } from '../../estilos/colores'
import type { Dispositivo } from '../../../../estructuraCompartida/tipos/Dispositivo'

interface Props {
  dispositivos: Dispositivo[]
  seleccionados: Set<string>
  onToggleSeleccion: (nombre: string) => void
}

function ListaDispositivos({ dispositivos, seleccionados, onToggleSeleccion }: Props) {
  if (dispositivos.length === 0) {
    return <Text style={estilos.textoSinDispositivos}>Ningún dispositivo encontrado todavía.</Text>
  }

  return (
    <View style={estilos.lista}>
      {dispositivos.map((d) => (
        <View key={d.name} style={estilos.item}>
          <CasillaSeleccion marcada={seleccionados.has(d.name)} onCambiar={() => onToggleSeleccion(d.name)} />
          <View style={estilos.info}>
            <Text style={estilos.nombre}>{d.name}</Text>
            <Text style={estilos.direccion}>{d.addresses[0]}:{d.port}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

const estilos = StyleSheet.create({
  textoSinDispositivos: { color: colores.textoSecundario, fontSize: 14 },
  lista: { marginTop: 14, gap: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colores.fondoTarjeta,
    borderWidth: 1,
    borderColor: colores.bordeSutil,
    borderRadius: colores.radioBorde,
    padding: 12
  },
  info: { flex: 1 },
  nombre: { color: colores.textoPrincipal, fontSize: 14, fontWeight: '600' },
  direccion: { color: colores.textoSecundario, fontSize: 12, marginTop: 2 }
})

export default ListaDispositivos