const { app, BrowserWindow, session } = require('electron');
const path = require('path');

app.commandLine.appendSwitch('enable-features', 'WindowPlacement');

let mainWindow;

function createWindow() {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });
  session.defaultSession.setPermissionCheckHandler(() => true);

  const iconPath = path.join(__dirname, 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1540,
    height: 920,
    minWidth: 960,
    minHeight: 600,
    title: '프로페셔널 스튜디오 프롬프터 PRO',
    icon: iconPath,
    backgroundColor: '#13141c',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      nativeWindowOpen: true
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.webContents.setWindowOpenHandler(() => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        frame: false,
        icon: iconPath,
        resizable: true,
        movable: true,
        minimizable: true,
        maximizable: true,
        fullscreenable: true,
        autoHideMenuBar: true,
        backgroundColor: '#000000',
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      }
    };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
