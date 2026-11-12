'use strict';

// Native fullscreen is deliberately handled in Electron's main process.
// Screen.workArea excludes the Windows taskbar; Screen.bounds does not.
function validRectangle(rect) {
  if (!rect || typeof rect !== 'object') return null;
  const x = Number(rect.x), y = Number(rect.y);
  const width = Number(rect.width), height = Number(rect.height);
  if (![x, y, width, height].every(Number.isFinite) || width < 1 || height < 1) return null;
  if (Math.abs(x) > 100000 || Math.abs(y) > 100000 || width > 100000 || height > 100000) return null;
  return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
}

function selectDisplay(screen, preferredBounds) {
  const displays = screen.getAllDisplays();
  if (!displays.length) throw new Error('연결된 모니터를 찾을 수 없습니다.');
  const rect = validRectangle(preferredBounds);
  if (rect) return screen.getDisplayMatching(rect);

  // Default: use the first non-primary monitor, when one exists.
  const primary = screen.getPrimaryDisplay();
  return displays.find(display => display.id !== primary.id) || primary;
}

function createBroadcastFullscreenController(screen, platform) {
  let currentWindow = null;
  let normalBounds = null;
  let intendedFullscreen = false;

  function attach(win) {
    currentWindow = win;
    normalBounds = validRectangle(win.getBounds());
    intendedFullscreen = false;
    win.on('closed', () => {
      if (currentWindow === win) {
        currentWindow = null;
        normalBounds = null;
        intendedFullscreen = false;
      }
    });
  }

  function hasWindow() {
    return !!currentWindow && !currentWindow.isDestroyed();
  }

  function isFullscreen() {
    if (!hasWindow()) return false;
    return Boolean(currentWindow.isFullScreen() || (platform === 'darwin' && currentWindow.isSimpleFullScreen()) || intendedFullscreen);
  }

  function change(fullscreen, preferredBounds) {
    if (!hasWindow()) return { ok: false, error: '송출창을 찾을 수 없습니다.' };
    const win = currentWindow;
    try {
      if (fullscreen) {
        if (!isFullscreen()) normalBounds = validRectangle(win.getBounds()) || normalBounds;
        const display = selectDisplay(screen, preferredBounds);
        // Do not use display.workArea: it reserves space for the taskbar/Dock.
        if (!isFullscreen()) win.setBounds(display.bounds);
        if (platform === 'darwin') win.setSimpleFullScreen(true);
        else win.setFullScreen(true);
        intendedFullscreen = true;
        win.show();
        win.focus();
        return { ok: true, fullscreen: true, displayBounds: display.bounds };
      }
      // Return to a movable window without restoring the screen's workArea
      // in place of its exact previous normal bounds.
      if (platform === 'darwin') win.setSimpleFullScreen(false);
      else win.setFullScreen(false);
      intendedFullscreen = false;
      if (normalBounds) win.setBounds(normalBounds);
      return { ok: true, fullscreen: false, normalBounds };
    } catch (error) {
      intendedFullscreen = false;
      return { ok: false, error: error?.message || String(error) };
    }
  }

  function getWindow() { return hasWindow() ? currentWindow : null; }
  return { attach, change, hasWindow, isFullscreen, getWindow };
}

module.exports = { validRectangle, selectDisplay, createBroadcastFullscreenController };
