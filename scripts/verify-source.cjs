'use strict';
/**
 * Release integrity verification: verifies known-good app and test sources across Windows/macOS.
 * CRLF and LF are treated identically for text files.
 * Verifies complete known-good application and
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
  // Git can check out text files with CRLF on Windows and LF on macOS.
  // Hash the original bytes first; only if they differ, retry with normalized
  // line endings. A real content change must still be reported as a mismatch.
  const raw=fs.readFileSync(target);
  const actual=sha256(raw);
  const normalized=sha256(Buffer.from(raw.toString('utf8').replace(/\r\n/g,'\n'),'utf8'));
  if(actual===expected) note(`✅ ${file}`);
  else if(normalized===expected) note(`✅ ${file} (Windows CRLF 줄바꿈 차이만 확인됨)`);
  else mismatches.push([file,`파일 내용이 다릅니다. 현재 SHA-256 ${actual.slice(0,16)}..., 줄바꿈 정규화 ${normalized.slice(0,16)}..., 배포본 ${expected.slice(0,16)}...`]);
}
if(mismatches.length) {
  failed(`\n❌ ${mismatches.length}개 파일의 내용이 이번 ZIP과 일치하지 않습니다 (CRLF/LF 차이는 무시했습니다).`);
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
