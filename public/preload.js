const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  logError: (error) => ipcRenderer.send('log-error', error),
});
