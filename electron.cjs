const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const MAX_DB_BYTES = 10 * 1024 * 1024;

let mainWindow;

const appDataPath = app.getPath('appData');
const userDataPath = path.join(appDataPath, 'josimar-cell-inventory(accesorio)');
app.setPath('userData', userDataPath);
const dbPath = path.join(userDataPath, 'josimar-cell-db.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'icon.jpg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: true,
      webSecurity: true,
      webviewTag: false,
      allowRunningInsecureContent: false
    },
    backgroundColor: '#FAFAFA',
    show: false,
    frame: true,
    titleBarStyle: 'default',
    autoHideMenuBar: true
  });

  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173').catch((err) => {
      console.error('Failed to load dev server:', err);
    });
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (!fs.existsSync(indexPath)) {
      console.error('index.html not found at:', indexPath);
      mainWindow.loadURL(`data:text/html,<h1>Error: Application files not found</h1>`);
    } else {
      mainWindow.loadFile(indexPath).catch((err) => {
        console.error('Failed to load index.html:', err);
      });
    }
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Log para debugging
  mainWindow.webContents.on('crashed', () => {
    console.error('Renderer process crashed');
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const isExternal = !url.startsWith('http://localhost') && !url.startsWith('file://');
    if (isExternal) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  
  mainWindow.webContents.on('will-navigate', (e, url) => {
    // Evitar navegación externa no deseada
    if (!url.startsWith('http://localhost') && !url.startsWith('file://')) {
      e.preventDefault();
    }
  });
}

app.whenReady().then(() => {
  try {
    createWindow();
  } catch (error) {
    console.error('Error creating window:', error);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch((err) => {
  console.error('App ready error:', err);
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('read-db', async () => {
  try {
    const exists = fs.existsSync(dbPath);
    if (!exists) return null;

    const stat = await fs.promises.stat(dbPath);
    if (stat.size > MAX_DB_BYTES) {
      console.error('Database file too large');
      return null;
    }

    const data = await fs.promises.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return null;
  }
});

ipcMain.handle('write-db', async (event, data) => {
  try {
    const payload = JSON.stringify(data, null, 2);
    if (Buffer.byteLength(payload, 'utf8') > MAX_DB_BYTES) {
      return { success: false, error: 'Database payload too large' };
    }

    const dirPath = path.dirname(dbPath);
    if (!fs.existsSync(dirPath)) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }

    await fs.promises.writeFile(dbPath, payload, 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('Error writing database:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-db-path', async () => {
  return dbPath;
});

ipcMain.handle('print-html-to-pdf', async (_event, payload) => {
  try {
    const { html, suggestedFileName } = payload || {};
    if (!html || typeof html !== 'string') {
      return { success: false, error: 'Invalid HTML payload' };
    }

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Guardar PDF',
      defaultPath: suggestedFileName || `orden-${Date.now()}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    const pdfWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    const pdfBuffer = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      preferCSSPageSize: true,
    });

    await fs.promises.writeFile(filePath, pdfBuffer);
    pdfWindow.destroy();

    return { success: true, filePath };
  } catch (error) {
    console.error('Error generating PDF from HTML:', error);
    return { success: false, error: error.message };
  }
});

// Manejo global de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});





