'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

function block(start, end) {
  const i = html.indexOf(start);
  const j = html.indexOf(end, i + start.length);
  assert.ok(i >= 0 && j > i, `code block missing: ${start}`);
  return html.slice(i, j);
}

function makeHarness() {
  const storage = new Map();
  const editor = {
    innerHTML: '',
    cloneNode: () => ({ innerHTML: editor.innerHTML, querySelectorAll: () => [] })
  };
  const label = { textContent: '', title: '', classList: { toggle: () => {} } };
  const elements = {
    scriptEditor: editor,
    projectFileLabel: label,
    frFindInput: { value: 'prior' },
    frReplaceInput: { value: 'prior' },
    frStatusText: { textContent: '' }
  };
  let chosenPath = '/Users/example/Documents/대본 A.txt';
  const saves = [];
  const toasts = [];
  let acceptedReplacement = true;
  const sandbox = {
    STORAGE_KEY: 'TEST_PROMPTER_STATE',
    defaultConfig: { fontSize: 90, hotkeys: { playPause: 'Space' } },
    config: { fontSize: 90, hotkeys: { playPause: 'Space' } },
    savedScriptHTML: '', currentProjectPath: null, currentProjectName: '새 파일',
    browserFileHandle: null, lastSavedSignature: null, isProjectDirty: false,
    restoredLegacyWorkspace: false, saveInProgress: false,
    historyReady: false, suspendHistory: false,
    window: { prompterAPI: {
      setDirty: () => {},
      saveProject: async details => { saves.push(details); return { ok: true, path: details.currentPath || chosenPath }; }
    } },
    document: { title: '', getElementById: id => elements[id] },
    localStorage: {
      setItem: (k, v) => storage.set(k, v),
      getItem: k => storage.get(k) ?? null
    },
    showToast: message => toasts.push(message),
    makeProjectText: () => editor.innerHTML,
    suggestProjectFilename: () => '프롬프터_대본.txt',
    getProjectSignature: () => JSON.stringify({ h: editor.innerHTML, c: sandbox.config }),
    normalizeEditorDOMStructure: () => {}, clearLockedPartialSelection: () => {},
    applyDefaultPresetToConfig: () => {},
    confirmReplaceProjectIfDirty: async () => acceptedReplacement,
    initUIValues: () => { editor.innerHTML = sandbox.savedScriptHTML; },
    setViewMode: () => {}, renderPrompterDOM: () => {}, resetToTop: () => {},
    updatePreviewScale: () => {}, resetEditorHistory: () => {},
    convertPlainTextToCleanHTML: text => text,
    COMPACT_META_HEADER: '\n\n--- [프롬프터 설정값] ---\n',
    LEGACY_META_DELIMITER: '\n\n=== [STUDIO_PROMPTER_PROJECT_SETTINGS_DO_NOT_EDIT_BELOW] ===\n',
    JSON, console
  };
  const context = vm.createContext(sandbox);
  vm.runInContext([
    block('function getProjectFileName(pathOrName) {', '\nfunction resetAllSettings() {'),
    block('async function saveProjectToTxt(fromClose = false) {', '\nasync function triggerLoadTxt() {'),
    block('async function loadProjectFromText(content, pathOrName = \'\') {', '\n/* =========================================================================='),
    block('function showProjectFileStatus() {', '\nfunction updateToastSettings(')
  ].join('\n'), context);
  const run = script => vm.runInContext(script, context);
  return {
    run, editor, label, saves, toasts, storage,
    setNextPath: p => { chosenPath = p; },
    acceptReplace: v => { acceptedReplacement = v; }
  };
}

test('새 파일 → 수정됨 → 첫 저장 → 같은 이름으로 덮어쓰기', async () => {
  const h = makeHarness();
  h.run('markProjectAsSaved()');
  assert.equal(h.label.textContent, '새 파일');
  h.editor.innerHTML = '첫 문장';
  h.run('saveStateToStorage()');
  assert.equal(h.label.textContent, '새 파일 - [수정됨]');
  assert.equal(await h.run('saveProjectToTxt()'), true);
  assert.equal(h.saves[0].currentPath, null);
  assert.equal(h.label.textContent, '대본 A.txt');
  h.editor.innerHTML = '첫 문장 변경';
  h.run('saveStateToStorage()');
  assert.equal(h.label.textContent, '대본 A.txt - [수정됨]');
  assert.equal(await h.run('saveProjectToTxt()'), true);
  assert.equal(h.saves[1].currentPath, '/Users/example/Documents/대본 A.txt');
  assert.equal(h.label.textContent, '대본 A.txt');
});

test('재실행 후 원본 파일 경로와 저장 기준점 복구', async () => {
  const h = makeHarness();
  h.run('markProjectAsSaved()');
  h.editor.innerHTML = '기록'; h.run('saveStateToStorage()');
  await h.run('saveProjectToTxt()');
  h.editor.innerHTML = '기록 수정'; h.run('saveStateToStorage()');
  h.run("currentProjectPath = null; currentProjectName = '새 파일'; lastSavedSignature = null; isProjectDirty = false");
  h.run('loadStateFromStorage(); updateProjectDirtyState()');
  assert.equal(h.label.textContent, '대본 A.txt - [수정됨]');
  await h.run('saveProjectToTxt()');
  assert.equal(h.saves.at(-1).currentPath, '/Users/example/Documents/대본 A.txt');
  assert.equal(h.label.textContent, '대본 A.txt');
});

test('새 파일 생성은 저장 경로를 해제하고 기본값과 빈 편집창으로', async () => {
  const h = makeHarness();
  h.run('markProjectAsSaved()');
  h.editor.innerHTML = '기존 기록'; h.run('saveStateToStorage()');
  await h.run('saveProjectToTxt()');
  h.editor.innerHTML = '기존 기록 수정'; h.run('saveStateToStorage()');
  h.acceptReplace(false);
  assert.equal(await h.run('createNewProject()'), false);
  assert.equal(h.label.textContent, '대본 A.txt - [수정됨]');
  h.acceptReplace(true);
  assert.equal(await h.run('createNewProject()'), true);
  assert.equal(h.label.textContent, '새 파일');
  assert.equal(h.editor.innerHTML, '');
  assert.equal(h.run('currentProjectPath'), null);
  assert.equal(h.run('config.fontSize'), 90);
  h.editor.innerHTML = '새 대본 작성'; h.run('saveStateToStorage()');
  assert.equal(h.label.textContent, '새 파일 - [수정됨]');
  h.setNextPath('/Users/example/Documents/새 대본.txt');
  await h.run('saveProjectToTxt()');
  assert.equal(h.saves.at(-1).currentPath, null);
  assert.equal(h.label.textContent, '새 대본.txt');
});

test('기존 TXT 불러오기 후 수정·저장은 불러온 파일을 사용', async () => {
  const h = makeHarness();
  h.run('markProjectAsSaved()');
  const success = await h.run("loadProjectFromText('대본 내용', '/Users/example/Documents/기존연설문.txt')");
  assert.equal(success, true);
  assert.equal(h.label.textContent, '기존연설문.txt');
  h.editor.innerHTML = '대본 내용 수정'; h.run('saveStateToStorage()');
  assert.equal(h.label.textContent, '기존연설문.txt - [수정됨]');
  await h.run('saveProjectToTxt()');
  assert.equal(h.saves[0].currentPath, '/Users/example/Documents/기존연설문.txt');
  assert.equal(h.label.textContent, '기존연설문.txt');
});
