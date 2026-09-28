const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { sshExecOnBastion, sftpWriteFileOnBastion } = require('./sshHelper');

// Set AppUserModelId for Windows so taskbar icon groups correctly
if (process.platform === 'win32') {
  try { app.setAppUserModelId('com.latro.base'); } catch (e) {}
}

let keytar;
try {
  keytar = require('keytar');
} catch (e) {
  // keytar might not be available in some environments; we'll handle absence gracefully
  keytar = null;
}

function createWindow() {
  const iconPath = path.join(__dirname, 'assets', 'latro-icon.svg');
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    icon: iconPath,
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

ipcMain.handle('eda:execCurl', async (_event, args) => {
  try {
    const result = await sshExecOnBastion(args.bastion, args.credentials, args.curlCommand);
    return { success: true, stdout: result.stdout, stderr: result.stderr };
  } catch (err) {
    return { success: false, error: err.message, stderr: err.stderr || '' };
  }
});

ipcMain.handle('eda:writeRemoteBackup', async (_event, args) => {
  try {
    await sftpWriteFileOnBastion(args.bastion, args.credentials, args.remotePath, args.content, args.mode);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Keychain storage handlers (optional, requires keytar)
ipcMain.handle('eda:storeCredentials', async (_event, { service = 'latro-base', account = 'default', payload }) => {
  if (!keytar) throw new Error('Keytar unavailable');
  await keytar.setPassword(service, account, JSON.stringify(payload));
  return { success: true };
});

ipcMain.handle('eda:getCredentials', async (_event, { service = 'latro-base', account = 'default' }) => {
  if (!keytar) return { success: false, error: 'Keytar unavailable' };
  const raw = await keytar.getPassword(service, account);
  if (!raw) return { success: false, error: 'not found' };
  try { return { success: true, payload: JSON.parse(raw) }; } catch (e) { return { success: false, error: 'parse error' }; }
});

ipcMain.handle('eda:deleteCredentials', async (_event, { service = 'latro-base', account = 'default' }) => {
  if (!keytar) throw new Error('Keytar unavailable');
  const ok = await keytar.deletePassword(service, account);
  return { success: ok };
});

// Window control handlers
ipcMain.handle('window:minimize', async () => {
  const w = BrowserWindow.getFocusedWindow();
  if (w) w.minimize();
  return { success: true };
});

ipcMain.handle('window:maximize', async () => {
  const w = BrowserWindow.getFocusedWindow();
  if (w) {
    if (w.isMaximized()) w.unmaximize();
    else w.maximize();
  }
  return { success: true };
});

ipcMain.handle('window:close', async () => {
  const w = BrowserWindow.getFocusedWindow();
  if (w) w.close();
  return { success: true };
});
