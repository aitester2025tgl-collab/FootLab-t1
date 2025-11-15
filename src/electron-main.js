const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 820,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the local index.html
  const indexPath = path.join(__dirname, 'index.html');
  win.loadFile(indexPath).catch((err) => {
    console.error('Failed to load index.html in Electron:', err);
  });

  // Open devtools when ELECTRON_DEV env var is set
  if (process.env.ELECTRON_DEV) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// small ipc helper to open devtools from renderer (if needed)
ipcMain.on('open-devtools', (ev) => {
  const w = BrowserWindow.fromWebContents(ev.sender);
  if (w) w.webContents.openDevTools();
});

// Expose app version on demand
ipcMain.handle('get-app-info', async () => ({
  version: app.getVersion(),
  path: app.getAppPath(),
}));
