const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

// Create a write stream for the log file
const logFile = path.join(app.getPath('userData'), 'error.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Redirect console output to log file and to the original console
const log = (level, message) => {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  logStream.write(formattedMessage);
  process.stdout.write(formattedMessage);
};

console.log = (...args) => log('info', ...args);
console.error = (...args) => log('error', ...args);
console.warn = (...args) => log('warn', ...args);

// Handle uncaught exceptions
process.on('uncaughtException', (error, origin) => {
  log('fatal', `Caught exception: ${error}\n` + `Exception origin: ${origin}`);
  log('fatal', error.stack);
  app.quit();
});

log('info', 'Application starting...');

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  ipcMain.on('log-error', (event, error) => {
    log('error', '--- Renderer Process Error ---');
    log('error', `Message: ${error.message}`);
    log('error', `Stack: ${error.stack}`);
    if (error.componentStack) {
      log('error', `Component Stack: ${error.componentStack}`);
    }
    log('error', '--------------------------');
  });

  // Load the index.html of the app.
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../dist/index.html'),
    protocol: 'file:',
    slashes: true,
  });
  mainWindow.loadURL(startUrl);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
