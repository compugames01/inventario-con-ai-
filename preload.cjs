const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readDB: () => ipcRenderer.invoke('read-db'),
  writeDB: (data) => ipcRenderer.invoke('write-db', data),
  getDBPath: () => ipcRenderer.invoke('get-db-path'),
  printHtmlToPdf: (payload) => ipcRenderer.invoke('print-html-to-pdf', payload),
});
