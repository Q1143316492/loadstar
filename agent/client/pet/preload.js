const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  restart: () => ipcRenderer.send('restart'),
  requestState: () => ipcRenderer.send('request-state'),
  onState: (cb) => ipcRenderer.on('pet-state', (_e, payload) => cb(payload)),
  quit: () => ipcRenderer.send('quit'),
  setChat: (open) => ipcRenderer.send('chat-toggle', !!open),
  onChat: (cb) => ipcRenderer.on('pet-chat', (_e, open) => cb(open)),
  initialState: process.env.PET_INITIAL_STATE || null,
  initialChat: process.env.PET_INITIAL_CHAT === '1'
});
