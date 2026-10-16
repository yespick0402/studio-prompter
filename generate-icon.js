const fs = require('fs');
const zlib = require('zlib');

const width = 512;
const height = 512;
const rawData = Buffer.alloc(height * (1 + width * 4));

for (let y = 0; y < height; y++) {
  const rowStart = y * (1 + width * 4);
  rawData[rowStart] = 0; // PNG Filter type 0

  for (let x = 0; x < width; x++) {
    const px = rowStart + 1 + x * 4;
    const dx = Math.abs(x - 256);
    const dy = Math.abs(y - 256);

    // 둥근 사각형 아이콘 외곽선 마스크
    const rx = Math.max(0, dx - 166);
    const ry = Math.max(0, dy - 166);
    const dist = Math.sqrt(rx * rx + ry * ry);

    if (dist > 60) {
      rawData[px] = 0; rawData[px + 1] = 0; rawData[px + 2] = 0; rawData[px + 3] = 0;
      continue;
    }

    // 기본 배경: 다크 네이비 스튜디오 컬러 (#161829)
    let r = 22, g = 24, b = 41, a = 255;

    // 테두리 포인트 (#3d59a1)
    if (dist > 46) {
      r = 61; g = 89; b = 161;
    }

    // 중앙 빨간색 프롬프터 리드선 (#ff2244)
    if (y >= 246 && y <= 266 && x >= 64 && x <= 448) {
      r = 255; g = 34; b = 68;
    }

    // 좌측 리드 삼각형 마커 (▶)
    if (x >= 68 && x <= 112 && Math.abs(y - 256) <= (112 - x) * 0.85) {
      r = 255; g = 50; b = 80;
    }
    // 우측 리드 삼각형 마커 (◀)
    if (x >= 400 && x <= 444 && Math.abs(y - 256) <= (x - 400) * 0.85) {
      r = 255; g = 50; b = 80;
    }

    // 상단 대본 텍스트 라인 2줄 (하늘색)
    if (((y >= 130 && y <= 156 && x >= 120 && x <= 392) ||
         (y >= 182 && y <= 208 && x >= 150 && x <= 362))) {
      r = 122; g = 162; b = 247;
    }

    // 하단 대본 텍스트 라인 2줄 (흰색)
    if (((y >= 304 && y <= 330 && x >= 110 && x <= 402) ||
         (y >= 356 && y <= 382 && x >= 160 && x <= 352))) {
      r = 220; g = 228; b = 255;
    }

    rawData[px] = r;
    rawData[px + 1] = g;
    rawData[px + 2] = b;
    rawData[px + 3] = a;
  }
}

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

const idat = zlib.deflateSync(rawData);
const png = Buffer.concat([
  sig,
  makeChunk('IHDR', ihdr),
  makeChunk('IDAT', idat),
  makeChunk('IEND', Buffer.alloc(0))
]);

fs.writeFileSync('icon.png', png);
console.log('Custom Studio Prompter icon.png generated successfully.');
