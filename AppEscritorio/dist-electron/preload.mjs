"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  buscarDispositivos: () => electron.ipcRenderer.send("buscar-servicios"),
  onDispositivoEncontrado: (callback) => {
    electron.ipcRenderer.on("servicio-encontrado", (_event, data) => callback(data));
  },
  onDispositivoPerdido: (callback) => {
    electron.ipcRenderer.on("servicio-perdido", (_event, data) => callback(data));
  },
  enviarArchivo: (rutaArchivo, direcciones, puertoDestino) => electron.ipcRenderer.send("enviar-archivo", { rutaArchivo, direcciones, puertoDestino }),
  obtenerRutaDeArchivo: (archivo) => electron.webUtils.getPathForFile(archivo),
  cambiarVisibilidad: (visible) => electron.ipcRenderer.send("cambiar-visibilidad", visible),
  // NUEVO: diálogo de aceptación
  onSolicitudTransferencia: (callback) => {
    electron.ipcRenderer.on("solicitud-transferencia", (_event, data) => callback(data));
  },
  responderTransferencia: (transferId, aceptado) => electron.ipcRenderer.send("respuesta-transferencia", { transferId, aceptado }),
  // NUEVO: progreso en tiempo real
  onProgresoTransferencia: (callback) => {
    electron.ipcRenderer.on("progreso-transferencia", (_event, data) => callback(data));
  }
});
