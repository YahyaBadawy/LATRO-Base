const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('latroApi', {
  execCurl: (args) => ipcRenderer.invoke('eda:execCurl', args),
  writeRemoteBackup: (args) => ipcRenderer.invoke('eda:writeRemoteBackup', args),
  storeCredentials: (args) => ipcRenderer.invoke('eda:storeCredentials', args),
  getCredentials: (args) => ipcRenderer.invoke('eda:getCredentials', args),
  deleteCredentials: (args) => ipcRenderer.invoke('eda:deleteCredentials', args)
});
