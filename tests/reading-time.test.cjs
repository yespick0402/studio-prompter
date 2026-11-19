'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
function part(from, to) {
  const a = html.indexOf(from), b = html.indexOf(to, a + from.length);
  assert.ok(a !== -1 && b > a, `missing section: ${from}`);
  return html.slice(a, b);
}
function makeHarness() {
  let now=0;
  const nodes = new Map();
  for (const id of ['readingTimePanel','lblActualReadTime','lblElapsedReadTime','lblReadTimeStatus','btnPlayPause','speedSlider','scriptEditor']) {
    nodes.set(id,{textContent:'',className:'',scrollTop:0,classList:{set:new Set(),toggle(name,value){if(value)this.set.add(name);else this.set.delete(name)}}});
  }
  const notices=[];
  const context = vm.createContext({
    performance:{now:()=>now}, document:{getElementById:id=>nodes.get(id)},
    showToast:(msg)=>notices.push(msg), Math, JSON, console,
    getScrollBounds:()=>({startY:0,endY:900,totalDist:900}), getInitialScrollY:()=>0,
    applyScrollTransform:()=>{},updateSpeedInputUI:()=>{}, updateTimelineAndTimeDisplay:()=>{},
    saveStateToStorage:()=>{}, requestAnimationFrame:()=>{}, syncEditorScrollDuringPlayback:()=>{}
  });
  const init = `let readingRun={startedAt:null,activeFrom:null,activeMs:0,finishedAt:null,manualSeeked:false};
    let isPlaying=false, isScrubbingTimeline=false, isDraggingPreviewStage=false;
    let currentScrollY=0, currentVelocity=0,lastFrameTime=0;let config={targetSpeed:10,dampingSec:0.3,speedStep:2};`;
  const code=[
    init,
    part('function resetReadingTiming() {', 'function updateTimelineAndTimeDisplay() {'),
    part('function togglePlay(forceState) {', 'function changeSpeed(delta) {'),
    part('function animationLoop(now) {','function applyScrollTransform() {')
  ].join('\n');
  vm.runInContext(code,context);
  const run = s => vm.runInContext(s,context);
  const tick = ms => {now=ms;run('syncReadingTiming()');run('updateReadingTimingDisplay()');};
  return {run,tick,now:()=>now,nodes,notices};
}

test('실제 읽기 시간: 속도 변경은 지난 시간을 재계산하지 않고 누적',()=>{
  const h=makeHarness();
  h.run('togglePlay(true)');
  h.tick(10000);h.run('setTargetSpeed(80)');
  h.tick(20000);h.run('setTargetSpeed(-20)');
  h.tick(25000);
  const result=JSON.parse(h.run('JSON.stringify(getReadingTimingSnapshot())'));
  assert.equal(result.activeMs,25000);
  assert.equal(result.elapsedMs,25000);
  assert.equal(h.nodes.get('lblActualReadTime').textContent,'00분 25초');
});

test('일시정지 및 속도 0은 실제 읽기 시간에서 제외, 전체 경과에는 포함',()=>{
  const h=makeHarness();
  h.run('togglePlay(true)');
  h.tick(12000);h.run('togglePlay(false)');
  h.tick(20000);h.run('togglePlay(true)');
  h.tick(23000);h.run('setTargetSpeed(0)');
  h.tick(27000);h.run('setTargetSpeed(10)');
  h.tick(30000);
  const result=JSON.parse(h.run('JSON.stringify(getReadingTimingSnapshot())'));
  assert.equal(result.activeMs,18000);
  assert.equal(result.elapsedMs,30000);
  assert.equal(h.nodes.get('lblActualReadTime').textContent,'00분 18초');
  assert.equal(h.nodes.get('lblElapsedReadTime').textContent,'00분 30초');
});

test('처음에서 시작한 재생만 측정하고 수동 이동은 완료 결과에 명시',()=>{
  const h=makeHarness();
  h.run('currentScrollY=420;togglePlay(true)');
  h.tick(5000);
  assert.equal(h.run('getReadingTimingSnapshot().started'),false);
  h.run('togglePlay(false); resetToTop(); togglePlay(true)');
  h.tick(15000);h.run('markReadingTimingManualSeek()');
  h.tick(17000);h.run('currentScrollY=900; animationLoop(performance.now())');
  const result=JSON.parse(h.run('JSON.stringify(getReadingTimingSnapshot())'));
  assert.equal(result.finished,true);
  assert.equal(result.manualSeeked,true);
  assert.equal(result.activeMs,12000);
  assert.match(h.nodes.get('lblReadTimeStatus').textContent,/수동 이동 포함/);
  assert.match(h.notices.at(-1),/실제 읽기 00분 12초/);
  h.tick(30000);
  assert.equal(h.run('getReadingTimingSnapshot().activeMs'),12000);
});

test('완주 후 다시 재생, 처음으로 복귀하면 새로운 회차 측정',()=>{
  const h=makeHarness();
  h.run('togglePlay(true)');h.tick(3000);
  h.run('currentScrollY=900; animationLoop(performance.now())');
  assert.equal(h.run('getReadingTimingSnapshot().finished'),true);
  h.run('togglePlay(true)');
  assert.equal(h.run('currentScrollY'),0);
  assert.equal(h.run('getReadingTimingSnapshot().finished'),false);
  h.tick(5000);
  assert.equal(h.run('getReadingTimingSnapshot().activeMs'),2000);
  h.run('resetToTop()');
  assert.equal(h.run('getReadingTimingSnapshot().started'),false);
  assert.equal(h.run('isPlaying'),false);
});

test('화면 UI와 실제 시간 측정 연결, 프리셋/대본 저장과 독립',()=>{
  assert.match(html, /id="lblActualReadTime"/);
  assert.match(html, /id="lblElapsedReadTime"/);
  assert.match(html, /finishReadingTiming\(now\)/);
  assert.match(html, /function updateReadingTimingDisplay/);
  assert.match(part('function persistProjectState() {','function saveStateToStorage() {'), /project:/);
  assert.doesNotMatch(part('function persistProjectState() {','function saveStateToStorage() {'), /readingRun/);
  assert.doesNotMatch(part('function getPresetSettingsFromCurrent() {','function createPresetRecord('), /readingRun/);
});

test('진행바·프리뷰를 드래그하는 동안은 실제 읽기 시간에 넣지 않음',()=>{
  const h=makeHarness();
  h.run('togglePlay(true)'); h.tick(4000);
  h.run('isScrubbingTimeline=true; syncReadingTiming()');h.tick(9000);
  h.run('isScrubbingTimeline=false; syncReadingTiming()');h.tick(12000);
  const result=JSON.parse(h.run('JSON.stringify(getReadingTimingSnapshot())'));
  assert.equal(result.activeMs,7000);
  assert.equal(result.elapsedMs,12000);
});
