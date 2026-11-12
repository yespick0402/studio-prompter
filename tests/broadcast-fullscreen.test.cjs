'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { selectDisplay, createBroadcastFullscreenController } = require('../broadcast-fullscreen.cjs');

const primary = {
  id: 1,
  bounds: { x: 0, y: 0, width: 1920, height: 1080 },
  workArea: { x: 0, y: 0, width: 1920, height: 1040 }
};
const secondary = {
  id: 2,
  bounds: { x: 1920, y: 0, width: 1920, height: 1200 },
  workArea: { x: 1920, y: 0, width: 1920, height: 1160 }
};
const screen = {
  getAllDisplays: () => [primary, secondary],
  getPrimaryDisplay: () => primary,
  getDisplayMatching: rect => rect.x >= 1920 ? secondary : primary
};
function mockWindow() {
  const events = {};
  const calls = [];
  let fullscreen = false;
  let simpleFullscreen = false;
  let bounds = { x: 2400, y: 150, width: 800, height: 520 };
  return {
    calls,
    on: (event, fn) => { events[event] = fn; },
    getBounds: () => ({ ...bounds }),
    setBounds: next => { bounds = { ...next }; calls.push(['bounds', { ...next }]); },
    setFullScreen: next => { fullscreen = next; calls.push(['native-fullscreen', next]); },
    setSimpleFullScreen: next => { simpleFullscreen = next; calls.push(['native-simple-fullscreen', next]); },
    isFullScreen: () => fullscreen,
    isSimpleFullScreen: () => simpleFullscreen,
    isDestroyed: () => false,
    show: () => calls.push(['show']),
    focus: () => calls.push(['focus']),
    emitClosed: () => events.closed?.()
  };
}

test('Windows: 처음 송출부터 전체 해상도로 native fullscreen, 작업표시줄 제외 크기 사용 금지', () => {
  const controller = createBroadcastFullscreenController(screen, 'win32');
  const win = mockWindow(); controller.attach(win);
  const result = controller.change(true);
  assert.equal(result.ok, true);
  assert.deepEqual(win.calls[0], ['bounds', secondary.bounds]);
  assert.deepEqual(win.calls[1], ['native-fullscreen', true]);
  assert.equal(win.calls.some(x => x[0] === 'native-simple-fullscreen'), false);
  assert.equal(controller.isFullscreen(), true);
});

test('F11/더블클릭으로 창 모드 전환 시 원래 창 크기 복귀 후 다시 native fullscreen 가능', () => {
  const controller = createBroadcastFullscreenController(screen, 'win32');
  const win = mockWindow(); controller.attach(win);
  assert.equal(controller.change(true).ok, true);
  assert.equal(controller.change(false).ok, true);
  assert.deepEqual(win.calls.at(-1), ['bounds', { x: 2400, y: 150, width: 800, height: 520 }]);
  assert.equal(controller.isFullscreen(), false);
  assert.equal(controller.change(true).ok, true);
  assert.equal(win.calls.filter(x => x[0] === 'native-fullscreen' && x[1]).length, 2);
});

test('선택한 주 모니터 힌트가 있으면 자동 보조 모니터보다 우선', () => {
  assert.equal(selectDisplay(screen, { x: 0, y: 0, width: 1920, height: 1080 }).id, 1);
  assert.equal(selectDisplay(screen).id, 2);
});

test('macOS에서는 native simpleFullscreen 사용', () => {
  const controller = createBroadcastFullscreenController(screen, 'darwin');
  const win = mockWindow(); controller.attach(win);
  controller.change(true);
  assert.deepEqual(win.calls[1], ['native-simple-fullscreen', true]);
  controller.change(false);
  assert.ok(win.calls.some(x => x[0] === 'native-simple-fullscreen' && x[1] === false));
});

test('기존 v1.2.4 기능과 Camera DateShift GitHub 빌드 설정 그대로 유지', () => {
  const dir = path.join(__dirname, '..');
  const pkg = require('../package.json');
  assert.equal(pkg.version, '1.2.6');
  assert.ok(pkg.build.files.includes('broadcast-fullscreen.cjs'));
  const main = fs.readFileSync(path.join(dir, 'main.js'), 'utf8');
  const preload = fs.readFileSync(path.join(dir, 'preload.js'), 'utf8');
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  assert.match(main, /did-create-window/);
  assert.match(main, /prompter-broadcast-native-fullscreen/);
  assert.match(preload, /setBroadcastNativeFullscreen/);
  assert.match(html, /getNativeBroadcastScreenHint/);
  assert.match(html, /setBroadcastFullscreenState\(true\);/);
  assert.doesNotMatch(html, /setTimeout\(\(\) => setBroadcastFullscreenState\(true\), 150\)/);
});
