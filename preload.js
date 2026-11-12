'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('prompterAPI', {
  setDirty: (dirty) => ipcRenderer.send('prompter-dirty', !!dirty),
  saveProject: (details) => ipcRenderer.invoke('prompter-save-project', details),
  openProject: () => ipcRenderer.invoke('prompter-open-project'),
  exportPreset: (details) => ipcRenderer.invoke('prompter-export-preset', details),
  importPreset: () => ipcRenderer.invoke('prompter-import-preset'),
  confirmReplace: () => ipcRenderer.invoke('prompter-confirm-replace'),
  requestExit: () => ipcRenderer.send('prompter-request-exit'),
  setBroadcastNativeFullscreen: (fullscreen, screenBounds = null) =>
    ipcRenderer.invoke('prompter-broadcast-native-fullscreen', { fullscreen: !!fullscreen, screenBounds })
});
