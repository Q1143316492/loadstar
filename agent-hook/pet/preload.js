const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  restart: () => ipcRenderer.send('restart'),
  requestState: () => ipcRenderer.send('request-state'),
  onState: (cb) => ipcRenderer.on('pet-state', (_e, payload) => cb(payload)),
  quit: () => ipcRenderer.send('quit'),
  initialState: process.env.PET_INITIAL_STATE || null
});
