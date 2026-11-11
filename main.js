'use strict';
const { app, BrowserWindow, dialog, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs/promises');

app.commandLine.appendSwitch('enable-features', 'WindowPlacement');
let mainWindow = null;
let hasUnsavedChanges = false;
let allowExit = false;
let exitDialogOpen = false;

const filters = [{ name: '프롬프터 TXT 프로젝트', extensions: ['txt'] }];

function createWindow() {
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(true));
  session.defaultSession.setPermissionCheckHandler(() => true);

  mainWindow = new BrowserWindow({
    width: 1540, height: 920, minWidth: 960, minHeight: 600,
    title: '프로페셔널 스튜디오 프롬프터 PRO',
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#13141c',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      nativeWindowOpen: true
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith('about:blank')) return { action: 'deny' };
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        frame: false,
        icon: path.join(__dirname, 'icon.png'),
        resizable: true, movable: true, minimizable: true, maximizable: true,
        fullscreenable: true, autoHideMenuBar: true,
        backgroundColor: '#000000',
        webPreferences: { nodeIntegration: false, contextIsolation: true }
      }
    };
  });

  mainWindow.on('close', (event) => {
    if (allowExit || !hasUnsavedChanges) return;
    event.preventDefault();
    if (exitDialogOpen) return;
    exitDialogOpen = true;
    // 브라우저 beforeunload와 달리 세 선택지 모두 구분합니다.
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: '프롬프터 대본 저장 확인',
      message: '마지막 저장 이후 대본 또는 설정이 변경되었습니다.',
      detail: '프로그램을 종료하기 전에 변경사항을 저장하시겠습니까?',
      buttons: ['저장', '저장하지 않음', '취소'],
      defaultId: 0, cancelId: 2, noLink: true
    }).then(async ({ response }) => {
      exitDialogOpen = false;
      if (!mainWindow || mainWindow.isDestroyed() || response === 2) return;
      if (response === 1) {
        // '저장하지 않음'은 파일뿐 아니라 다음 실행에 복원될 자동 저장 캐시도 되돌립니다.
        try { await mainWindow.webContents.executeJavaScript('discardUnsavedChangesForExit()'); }
        catch (err) { console.warn('Discard cache cleanup failed:', err); }
        allowExit = true;
        mainWindow.close();
        return;
      }
      try {
        const success = await mainWindow.webContents.executeJavaScript('saveProjectToTxt(true)');
        if (success && mainWindow && !mainWindow.isDestroyed()) {
          allowExit = true;
          mainWindow.close();
        }
      } catch (err) {
        dialog.showErrorBox('저장 실패', `대본을 저장하지 못해 종료를 취소했습니다.\n${err.message}`);
      }
    }).catch(() => { exitDialogOpen = false; });
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

ipcMain.on('prompter-dirty', (event, dirty) => {
  if (!mainWindow || event.sender !== mainWindow.webContents) return;
  hasUnsavedChanges = Boolean(dirty);
});

ipcMain.on('prompter-request-exit', (event) => {
  if (mainWindow && event.sender === mainWindow.webContents) mainWindow.close();
});

ipcMain.handle('prompter-save-project', async (event, data) => {
  if (!mainWindow || event.sender !== mainWindow.webContents) throw new Error('잘못된 창에서 요청했습니다.');
  if (typeof data?.content !== 'string') throw new Error('저장할 내용이 없습니다.');
  let filepath = typeof data.currentPath === 'string' && path.isAbsolute(data.currentPath) ? data.currentPath : null;
  if (!filepath) {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '프롬프터 대본 저장',
      defaultPath: path.join(app.getPath('documents'), path.basename(data.suggestedName || '프롬프터_대본.txt')),
      buttonLabel: '저장', filters
    });
    if (result.canceled || !result.filePath) return { ok: false, canceled: true };
    filepath = result.filePath;
  }
  await fs.writeFile(filepath, data.content, 'utf8');
  return { ok: true, path: filepath };
});

ipcMain.handle('prompter-open-project', async (event) => {
  if (!mainWindow || event.sender !== mainWindow.webContents) throw new Error('잘못된 창에서 요청했습니다.');
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '프롬프터 대본 불러오기',
    properties: ['openFile'], filters
  });
  if (result.canceled || !result.filePaths.length) return { ok: false, canceled: true };
  const filepath = result.filePaths[0];
  const content = await fs.readFile(filepath, 'utf8');
  return { ok: true, path: filepath, content };
});

ipcMain.handle('prompter-confirm-replace', async (event) => {
  if (!mainWindow || event.sender !== mainWindow.webContents) throw new Error('잘못된 창에서 요청했습니다.');
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'question', title: '기존 대본 변경사항 확인',
    message: '현재 대본에 저장되지 않은 변경사항이 있습니다.',
    detail: '다른 대본을 불러오기 전에 저장하시겠습니까?',
    buttons: ['저장', '저장하지 않고 불러오기', '취소'],
    defaultId: 0, cancelId: 2, noLink: true
  });
  return ['save', 'discard', 'cancel'][response] || 'cancel';
});

app.whenReady().then(createWindow);
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on('window-all-closed', () => { app.quit(); });
