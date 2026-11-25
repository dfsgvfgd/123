const { app, BrowserWindow } = require('electron');
const path = require('path');

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 960,
    minHeight: 580,
    backgroundColor: '#09090E',
    title: 'Velvera: Abyssal Slasher (BETA)',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.ELECTRON_START_URL;
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
