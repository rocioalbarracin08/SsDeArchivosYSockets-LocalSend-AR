import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import CasillaSeleccion from '../Controlador/CasillaSeleccion'
import { colores } from '../../estilos/colores'

interface ItemHistorial {
  id: string
  etiqueta: string
  estadoTexto: string
}

interface Props {
  items: ItemHistorial[]
  onEliminar: (ids: string[]) => void
}

function PanelHistorial({ items, onEliminar }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())

  function alternarSeleccion(id: string) {
    setSeleccionados((previos) => {
      const copia = new Set(previos)
      if (copia.has(id)) copia.delete(id)
      else copia.add(id)
      return copia
    })
  }

  const todosSeleccionados = items.length > 0 && seleccionados.size === items.length

  function alternarSeleccionTotal() {
    setSeleccionados(todosSeleccionados ? new Set() : new Set(items.map((i) => i.id)))
  }

  function eliminarSeleccionados() {
    onEliminar(Array.from(seleccionados))
    setSeleccionados(new Set())
  }

  if (items.length === 0) return null

  return (
    <View style={estilos.panel}>
      <TouchableOpacity onPress={() => setAbierto((v) => !v)}>
        <Text style={estilos.botonVer}>{abierto ? 'Ocultar historial' : `Ver historial (${items.length})`}</Text>
      </TouchableOpacity>

      {abierto && (
        <View style={estilos.contenido}>
          <View style={estilos.filaSeleccionarTodos}>
            <CasillaSeleccion marcada={todosSeleccionados} onCambiar={alternarSeleccionTotal} />
            <Text style={estilos.textoSeleccionarTodos}>
              {todosSeleccionados ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </Text>
          </View>

          {items.map((item) => (
            <View key={item.id} style={estilos.item}>
              <CasillaSeleccion marcada={seleccionados.has(item.id)} onCambiar={() => alternarSeleccion(item.id)} />
              <Text style={estilos.etiqueta}>{item.etiqueta}</Text>
              <Text style={estilos.estadoTexto}>{item.estadoTexto}</Text>
            </View>
          ))}

          {seleccionados.size > 0 && (
            <TouchableOpacity style={estilos.botonEliminar} onPress={eliminarSeleccionados}>
              <Text style={estilos.textoEliminar}>Eliminar seleccionados ({seleccionados.size})</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

const estilos = StyleSheet.create({
  panel: { marginTop: 14 },
  botonVer: { color: colores.textoSecundario, fontSize: 12, textDecorationLine: 'underline' },
  contenido: { marginTop: 10, gap: 4 },
  filaSeleccionarTodos: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: colores.bordeSutil },
  textoSeleccionarTodos: { color: colores.textoSecundario, fontSize: 12 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colores.fondoElemento, borderRadius: 6, padding: 8 },
  etiqueta: { color: colores.textoPrincipal, fontSize: 12, flex: 1 },
  estadoTexto: { color: colores.textoSecundario, fontSize: 12 },
  botonEliminar: { marginTop: 8, backgroundColor: '#3a1f22', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start' },
  textoEliminar: { color: '#d99', fontSize: 12 }
})

export default PanelHistorial