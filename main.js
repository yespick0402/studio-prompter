const { app, BrowserWindow, session } = require('electron');

// 다중 모니터 감지(Window Placement API) 활성화
app.commandLine.appendSwitch('enable-features', 'WindowPlacement');

let mainWindow;

function createWindow() {
  // 다중 모니터 및 전체화면 권한을 묻지 않고 자동 승인
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });
  session.defaultSession.setPermissionCheckHandler(() => true);

  mainWindow = new BrowserWindow({
    width: 1500,
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

  // [프롬프터 송출] 클릭 시 열리는 송출창을 상단바/메뉴바 없는 순수 방송용 창으로 생성
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        frame: false,
        autoHideMenuBar: true,
        backgroundColor: '#000000',
        fullscreenable: true,
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
