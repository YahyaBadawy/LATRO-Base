const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('latroApi', {
  execCurl: (args) => ipcRenderer.invoke('eda:execCurl', args),
  writeRemoteBackup: (args) => ipcRenderer.invoke('eda:writeRemoteBackup', args)
});
