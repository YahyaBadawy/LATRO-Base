const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { sshExecOnBastion, sftpWriteFileOnBastion } = require('./sshHelper');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    backgroundColor: '#0b1f21',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../../src/renderer/build/index.html')}`;
  win.loadURL(startUrl);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('eda:execCurl', async (_event, { bastion, credentials, curlCommand }) => {
  try {
    const result = await sshExecOnBastion(bastion, credentials, curlCommand);
    return { success: true, stdout: result.stdout, stderr: result.stderr };
  } catch (err) {
    return { success: false, error: err.message, stderr: err.stderr || '' };
  }
});

ipcMain.handle('eda:writeRemoteBackup', async (_event, { bastion, credentials, remotePath, content, mode }) => {
  try {
    await sftpWriteFileOnBastion(bastion, credentials, remotePath, content, mode);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
