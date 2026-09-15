// Por defecto, Metro (el empaquetador de Expo) solo resuelve archivos DENTRO
// de esta carpeta (AppMovil/). Como importamos código de estructuraCompartida,
// que vive un nivel más arriba, hay que decirle explícitamente que también
// mire ahí — esto es lo único que hace este archivo.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const carpetaProyecto = __dirname
const carpetaRaizDelRepo = path.resolve(carpetaProyecto, '..')

const config = getDefaultConfig(carpetaProyecto)

// "Vigilá también los cambios de archivos en la raíz del repo"
config.watchFolders = [carpetaRaizDelRepo]

// "Si necesitás resolver un paquete de node_modules, buscalo en los dos lugares"
config.resolver.nodeModulesPaths = [
  path.resolve(carpetaProyecto, 'node_modules'),
  path.resolve(carpetaRaizDelRepo, 'node_modules')
]

module.exports = config