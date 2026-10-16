const { app, BrowserWindow, session } = require('electron');

// 다중 모니터 감지(Window Placement API) 활성화
app.commandLine.appendSwitch('enable-features', 'WindowPlacement');

let mainWindow;

function createWindow() {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });
  session.defaultSession.setPermissionCheckHandler(() => true);

  mainWindow = new BrowserWindow({
    width: 1540,
    height: 920,
    minWidth: 960,
    minHeight: 600,
    title: '프로페셔널 스튜디오 프롬프터 PRO',
    backgroundColor: '#13141c',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      nativeWindowOpen: true
    }
  });

  mainWindow.loadFile('index.html');

  // 송출창 생성 설정: 윈도우/맥 모두 창모드에서 크기 조절(resizable) 및 이동(movable), 전체화면(fullscreenable) 완벽 지원
  mainWindow.webContents.setWindowOpenHandler(() => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        frame: false,
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
