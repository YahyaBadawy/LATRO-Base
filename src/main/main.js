const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { sshExecOnBastion, sftpWriteFileOnBastion } = require('./sshHelper');

function createWindow() {
  const win = new BrowserWindow({ width: 1400, height: 900, minWidth: 1100, minHeight: 700, frame: false, backgroundColor: '#0b1f21', webPreferences: { preload: path.join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true } });
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../../src/renderer/build/index.html')}`;
  win.loadURL(startUrl);
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
ipcMain.handle('eda:execCurl', async (_event, args) => { try { const result = await sshExecOnBastion(args.bastion, args.credentials, args.curlCommand); return { success: true, stdout: result.stdout, stderr: result.stderr }; } catch (err) { return { success: false, error: err.message, stderr: err.stderr || '' }; } });
ipcMain.handle('eda:writeRemoteBackup', async (_event, args) => { try { await sftpWriteFileOnBastion(args.bastion, args.credentials, args.remotePath, args.content, args.mode); return { success: true }; } catch (err) { return { success: false, error: err.message }; } });
