'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const from = (a,b) => {
  const i=html.indexOf(a),j=html.indexOf(b,i+a.length);
  assert.ok(i>=0 && j>i,`section missing ${a}`);
  return html.slice(i,j);
};
function makeHarness() {
  const saved = new Map();
  const notices=[];
  const editor = { innerHTML:'', focus:()=>{} };
  const nodes = new Map([['scriptEditor',editor]]);
  const document = {
    getElementById(id) { return nodes.get(id) || null; },
    createElement(tag) {
      return {tagName:tag.toUpperCase(),value:'',textContent:'',disabled:false,classList:{toggle:()=>{}},children:[],appendChild(c){this.children.push(c)}};
    }
  };
  const select = {
    options:[], _value:'', get value(){ return this._value; }, set value(val) { this._value=val; },
    replaceChildren() { this.options=[]; this._value=''; },
    appendChild(node) { this.options.push(node); if (this.options.length===1) this.value=node.value; }
  };
  nodes.set('presetSelect',select);
  nodes.set('presetStatus',{textContent:''});
  nodes.set('presetDefaultButton',{textContent:'',disabled:false});
  let nextPrompt='스튜디오 연설 기본값';
  let accepted=true;
  const context=vm.createContext({document,console,Math,Date,JSON,Set,showToast:(x)=>notices.push(x),
    localStorage:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)},
    window:{}, prompt:()=>nextPrompt,confirm:()=>accepted,
    clearLockedPartialSelection:()=>{},
    captureEditorHistory:()=>{}, renderPrompterDOM:()=>{}, updatePreviewScale:()=>{},
    setViewMode:()=>{},saveStateToStorage:()=>{} });
  const defaults=from('const defaultConfig = {','const defaultSampleScript');
  const core=from('function clonePresetValue(value)', 'function getProjectFileName(pathOrName)');
  vm.runInContext([defaults,
    "let config = JSON.parse(JSON.stringify(defaultConfig)); let presetLibrary = {version:1,defaultId:null,presets:[]};",
    "const PRESET_STORAGE_KEY = 'TEST_PRESETS'; const STORAGE_KEY = 'TEST_WORKSPACE';",
    "const PRESET_EXCLUDED_KEYS = new Set(['selectedScreenIdx','leftPaneWidthPct','viewMode','toastPosition','toastDurationSec']);",
    "let savedScriptHTML=''; let historyReady=false; let suspendHistory=false;",
    "function cleanEditorHTML(){return document.getElementById('scriptEditor').innerHTML}",
    "function initUIValues(){document.getElementById('scriptEditor').innerHTML = savedScriptHTML}",core].join('\n'),context);
  return {run:js=>vm.runInContext(js,context),saved,notices,editor,select,
    setPrompt:x=>nextPrompt=x,allowConfirm:x=>accepted=x};
}
test('프리셋은 서체·리드선·여백·단축키를 보관하되 UI/모니터 번호 제외',()=>{
  const h=makeHarness();
  h.run("config.fontSize=176; config.leadOpacity=32; config.padLeft=185; config.endMode='topScreen'; config.hotkeys.playPause='p';");
  const data=JSON.parse(h.run('JSON.stringify(getPresetSettingsFromCurrent())'));
  assert.equal(data.fontSize,176); assert.equal(data.padLeft,185);
  assert.equal(data.leadOpacity,32); assert.equal(data.endMode,'topScreen');
  assert.equal(data.hotkeys.playPause,'p');
  for(const k of ['selectedScreenIdx','viewMode','toastPosition','toastDurationSec','leftPaneWidthPct']) assert.equal(Object.hasOwn(data,k),false);
});
test('새 프리셋 저장·복제·이름변경·삭제·기본값 선택',()=>{
  const h=makeHarness();
  h.run('config.fontSize=121; createPresetFromCurrent()');
  assert.equal(h.run('presetLibrary.presets.length'),1);
  h.run('toggleDefaultPreset()');
  assert.equal(h.run('presetLibrary.defaultId === presetLibrary.presets[0].id'),true);
  h.setPrompt('방송 특별용');h.run('duplicateSelectedPreset()');
  assert.equal(h.run('presetLibrary.presets.length'),2);
  assert.equal(h.run('presetLibrary.presets[1].name'),'방송 특별용');
  h.setPrompt('뉴스 진행용');h.run('renameSelectedPreset()');
  assert.equal(h.run('presetLibrary.presets[1].name'),'뉴스 진행용');
  h.run('deleteSelectedPreset()');
  assert.equal(h.run('presetLibrary.presets.length'),1);
  assert.equal(h.run('presetLibrary.defaultId === presetLibrary.presets[0].id'),true);
  h.run('config.fontSize=90; applyDefaultPresetToConfig()');
  assert.equal(h.run('config.fontSize'),121);
});
test('프리셋 적용·공장초기화에서 대본 유지, 프리셋과 기본값 지정도 유지',()=>{
  const h=makeHarness();
  h.editor.innerHTML='실제 대본 수정내용';
  h.run('config.fontSize=143; createPresetFromCurrent(); toggleDefaultPreset()');
  h.run('config.fontSize=90; applySelectedPreset()');
  assert.equal(h.editor.innerHTML,'실제 대본 수정내용');
  assert.equal(h.run('config.fontSize'),143);
  h.run('applyConfigurationToCurrentDocument(defaultConfig,true)');
  assert.equal(h.editor.innerHTML,'실제 대본 수정내용');
  assert.equal(h.run('config.fontSize'),90);
  assert.equal(h.run('presetLibrary.presets.length'),1);
  assert.equal(h.run('presetLibrary.defaultId === presetLibrary.presets[0].id'),true);
});
test('외부 JSON 가져오기 후 동일 이름이면 사본으로 저장, 악성/잘못된 설정은 거부',()=>{
  const h=makeHarness();
  h.run('createPresetFromCurrent()');
  const exported=h.run('serializeSelectedPreset()');
  assert.equal(JSON.parse(exported).format,'studio-prompter-preset');
  h.run('loadImportedPresetJSON('+JSON.stringify(exported)+')');
  assert.equal(h.run('presetLibrary.presets.length'),2);
  assert.match(h.run('presetLibrary.presets[1].name'),/가져옴/);
  h.run('loadImportedPresetJSON('+JSON.stringify('{"format":"not-our-program","version":1,"name":"Test","settings":{"fontSize":300}}')+')');
  assert.equal(h.run('presetLibrary.presets.length'),2);
  h.run('loadImportedPresetJSON('+JSON.stringify('{"format":"studio-prompter-preset","version":1,"name":"Unsafe","settings":{"fontSize":99999,"unknown":"malicious","textColor":"url(javascript:1)"}}')+')');
  assert.equal(h.run('presetLibrary.presets.length'),3);
  assert.equal(h.run('presetLibrary.presets[2].settings.fontSize'),999);
  assert.equal(h.run('presetLibrary.presets[2].settings.unknown'),undefined);
  assert.equal(h.run('presetLibrary.presets[2].settings.textColor'),undefined);
});
test('프리셋 저장소는 대본 작업 영역과 다른 키에 저장되며, 재실행 후 복구',()=>{
  const h=makeHarness();
  h.run('createPresetFromCurrent();toggleDefaultPreset()');
  assert.ok(h.saved.has('TEST_PRESETS'));
  assert.ok(!h.saved.has('TEST_WORKSPACE'));
  const oldDefault=h.run('presetLibrary.defaultId');
  h.run('presetLibrary={version:1,defaultId:null,presets:[]}; loadPresetLibrary()');
  assert.equal(h.run('presetLibrary.presets.length'),1);
  assert.equal(h.run('presetLibrary.defaultId'),oldDefault);
});
