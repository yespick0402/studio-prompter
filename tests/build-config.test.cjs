const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const project = require('../package.json');

const here = path.resolve(__dirname, '..');
test('패키지에 필요한 앱 파일이 존재', () => {
  for (const name of ['main.js','preload.js','index.html','icon.icns','icon.ico','icon.png']) {
    assert.ok(fs.statSync(path.join(here,name)).size > 0, name);
  }
});
test('Camera DateShift 방식: Mac arm64 ad-hoc 서명, Apple 공증 요구 없음', () => {
  assert.equal(project.build.mac.identity, '-');
  assert.equal(project.build.mac.hardenedRuntime, false);
  assert.equal(project.build.mac.notarize, false);
  assert.deepEqual(project.build.mac.target.map(x=>x.target), ['dmg','zip']);
  assert.ok(project.build.mac.target.every(x=>x.arch.includes('arm64')));
  assert.match(project.scripts['build:mac'], /--arm64/);
});
test('Windows x64 빌드 유지', () => {
  assert.match(project.scripts['build:windows'], /--x64/);
  assert.ok(project.build.win.target.some(x=>x.target === 'portable'));
});
test('웹 렌더러에 Electron 간 파일 입출력 연결 유지', () => {
  const preload = fs.readFileSync(path.join(here,'preload.js'), 'utf8');
  assert.match(preload, /prompter-save-project/);
  assert.match(preload, /prompter-open-project/);
});
