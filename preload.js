'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('prompterAPI', {
  setDirty: (dirty) => ipcRenderer.send('prompter-dirty', !!dirty),
  saveProject: (details) => ipcRenderer.invoke('prompter-save-project', details),
  openProject: () => ipcRenderer.invoke('prompter-open-project'),
  confirmReplace: () => ipcRenderer.invoke('prompter-confirm-replace'),
  requestExit: () => ipcRenderer.send('prompter-request-exit')
});
