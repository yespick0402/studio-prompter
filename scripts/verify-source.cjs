'use strict';
/**
 * Release integrity verification: verifies complete known-good application and
 * regression-test inputs were uploaded together. Not a security signature.
 * Regenerate manifest only when all release files are intentionally changed.
 */
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const manifestFile = path.join(__dirname,'release-files.json');
const outDir=path.join(root,'diagnostics');
fs.mkdirSync(outDir,{recursive:true});
const lines=[];
const note=(line)=>{const s=String(line);lines.push(s);console.log(s)};
const failed=(line)=>{const s=String(line);lines.push(s);console.error(s)};
const report=()=>fs.writeFileSync(path.join(outDir,'source-check.txt'),lines.join('\n')+'\n','utf8');
function sha256(data){return crypto.createHash('sha256').update(data).digest('hex')}
function reportError(file,message){
  failed(`❌ ${file}: ${message}`);
  if(process.env.GITHUB_ACTIONS==='true') {
    const safe=message.replace(/[\r\n]/g,' ').replace(/::/g,': :');
    console.error(`::error file=${file},title=프롬프터 업로드 불일치::${safe}`);
  }
}
note('=== StudioPrompterPro 소스/테스트 동일 버전 검사 ===');
note(`GitHub Commit: ${process.env.GITHUB_SHA || '(로컬 검사)'}`);
note(`Node: ${process.version}`);
if(!fs.existsSync(manifestFile)) {
  reportError('scripts/release-files.json','검증 목록이 없습니다. 새 ZIP의 scripts 폴더를 포함해 모든 파일을 업로드해야 합니다.');
  report();process.exit(1);
}
let manifest;
try { manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8')); }
catch(e){reportError('scripts/release-files.json',`검증 목록 읽기 실패: ${e.message}`); report();process.exit(1)}
const mismatches=[];
for(const [file,expected] of Object.entries(manifest.files||{})) {
  const target=path.resolve(root,file);
  if(!target.startsWith(root+path.sep)) { mismatches.push([file,'검증 경로가 올바르지 않습니다']);continue; }
  if(!fs.existsSync(target)) {mismatches.push([file,'파일이 없습니다']);continue;}
  const actual=sha256(fs.readFileSync(target));
  if(actual!==expected) mismatches.push([file,`버전이 일치하지 않습니다. 현재 SHA-256 ${actual.slice(0,16)}..., 배포본 ${expected.slice(0,16)}...`]);
  else note(`✅ ${file}`);
}
if(mismatches.length) {
  failed(`\n❌ ${mismatches.length}개 파일이 이번 ZIP과 일치하지 않습니다.`);
  for(const [file,why] of mismatches) reportError(file,why);
  failed('해결: ZIP 압축을 풀고 StudioPrompterPro 폴더 **안**의 파일들을 GitHub 저장소 루트에 경로 그대로 다시 업로드 후 Commit하세요.');
  failed('특히 index.html, tests/*.test.cjs, scripts/*, package.json을 한 번에 업로드해야 합니다.');
  report();process.exit(1);
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const checks=['id="settingsModal"','id="presetSelect"','id="presetFileInput"','function clonePresetValue(','function createPresetFromCurrent(','function loadImportedPresetJSON(','function applyConfigurationToCurrentDocument(','const PRESET_STORAGE_KEY'];
const missing=checks.filter(x=>!html.includes(x));
if(missing.length) {
  reportError('index.html',`프리셋 기능 코드가 없습니다: ${missing.join(', ')}`);
  report();process.exit(1);
}
note('\n✅ 모든 프로그램·테스트 파일이 검증된 동일 배포본입니다.');
report();
