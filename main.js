const { app, BrowserWindow, Menu, shell, nativeTheme } = require('electron');
const path = require('path');
const http = require('http');

const PORT = 3847;
let mainWindow;
let httpServer;

// ── Démarre le serveur Express local ────────────────────────────────────────
function startServer() {
  return new Promise((resolve, reject) => {
    const expressApp = require('./server');
    httpServer = http.createServer(expressApp);
    httpServer.listen(PORT, '127.0.0.1', () => {
      console.log(`✓ Serveur local → http://127.0.0.1:${PORT}`);
      resolve();
    });
    httpServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port déjà utilisé → l'app tourne peut-être déjà
        console.log(`Port ${PORT} déjà occupé, on réutilise.`);
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

// ── Crée la fenêtre principale ───────────────────────────────────────────────
function createWindow() {
  nativeTheme.themeSource = 'light'; // force thème clair

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#F7F4EF',
    titleBarStyle: 'hiddenInset',          // traffic lights dans la fenêtre
    trafficLightPosition: { x: 16, y: 20 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
    },
    title: 'Marchés Boursiers',
    show: false, // n'affiche qu'après le chargement
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Optionnel : DevTools en développement
    // mainWindow.webContents.openDevTools();
  });

  // Liens externes → navigateur par défaut
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Menu natif macOS ─────────────────────────────────────────────────────────
function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { label: 'À propos de Marchés Boursiers', role: 'about' },
        { type: 'separator' },
        { label: 'Services', role: 'services' },
        { type: 'separator' },
        { label: 'Masquer Marchés Boursiers', role: 'hide' },
        { label: 'Masquer les autres', role: 'hideOthers' },
        { label: 'Tout afficher', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quitter', role: 'quit' },
      ],
    }] : []),
    {
      label: 'Affichage',
      submenu: [
        { label: 'Recharger', role: 'reload' },
        { type: 'separator' },
        { label: 'Zoom avant', role: 'zoomIn' },
        { label: 'Zoom arrière', role: 'zoomOut' },
        { label: 'Taille normale', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Plein écran', role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Fenêtre',
      submenu: [
        { label: 'Réduire', role: 'minimize' },
        { label: 'Agrandir', role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { label: 'Mettre toutes les fenêtres au premier plan', role: 'front' },
        ] : []),
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── Cycle de vie de l'app ────────────────────────────────────────────────────
app.whenReady().then(async () => {
  buildMenu();
  try {
    await startServer();
    createWindow();
  } catch (err) {
    console.error('Erreur de démarrage :', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (httpServer) httpServer.close();
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('will-quit', () => {
  if (httpServer) httpServer.close();
});
