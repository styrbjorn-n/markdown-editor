const { app, BrowserWindow } = require('electron');
const { initialize } = require('@electron/remote/main');

initialize();

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      //@ts-ignore
      enableRemoteModule: true,
      nodeIntegration: true,
    },
  });

  win.loadURL('http://localhost:3000');
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
