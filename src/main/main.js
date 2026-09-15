const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { sshExecOnBastion, sftpWriteFileOnBastion } = require('./sshHelper');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
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

ipcMain.handle('eda:execCurl', async (event, { bastion, credentials, curlCommand }) => {
  try {
    const res = await sshExecOnBastion(bastion, credentials, curlCommand);
    return { success: true, stdout: res.stdout, stderr: res.stderr };
  } catch (err) {
    return { success: false, error: err.message, stderr: err.stderr || '' };
  }
});

// Write a file on the remote bastion (SFTP) with given content and mode (e.g., 0o600)
ipcMain.handle('eda:writeRemoteBackup', async (event, { bastion, credentials, remotePath, content, mode }) => {
  try {
    await sftpWriteFileOnBastion(bastion, credentials, remotePath, content, mode);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
