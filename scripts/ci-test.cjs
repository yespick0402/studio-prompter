'use strict';
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'diagnostics');
fs.mkdirSync(dir,{recursive:true});
const tests=fs.readdirSync(path.join(root,'tests')).filter(name=>name.endsWith('.test.cjs')).sort().map(name=>path.join(root,'tests',name));
const args=['--test','--test-reporter=spec',...tests];
const run=cp.spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',maxBuffer:20*1024*1024,env:{...process.env,NO_COLOR:'1'}});
const report=[`StudioPrompterPro CI test report`, `OS: ${process.platform} ${process.arch}`,`Node: ${process.version}`,`Commit: ${process.env.GITHUB_SHA || 'local'}`,`Process: ${process.execPath} ${args.join(' ')}`,`Status: ${run.status}`,`Signal: ${run.signal||'none'}`,`Exception: ${run.error?.message||'none'}`,'',run.stdout||'',run.stderr||''].join('\n');
fs.writeFileSync(path.join(dir,'test-results.txt'),report,'utf8');
if(run.stdout) process.stdout.write(run.stdout);
if(run.stderr) process.stderr.write(run.stderr);
if(run.error) console.error(run.error);
if(run.status!==0) {
  console.error('❌ 자동 테스트 실패. 위 테스트 이름과 오류를 확인하세요.');
  console.error('GitHub 실행 화면 아래에서 StudioPrompter-Diagnostics 파일을 받아 test-results.txt를 열면 전체 오류가 나옵니다.');
  console.error('업로드된 프로그램/테스트 버전 일치 여부는 앞 단계의 source-check.txt로도 확인할 수 있습니다.');
  process.exit(run.status||1);
}
console.log('✅ 모든 자동 테스트 통과. Windows/macOS 실행 파일 빌드는 다음 단계에서 진행됩니다.');
