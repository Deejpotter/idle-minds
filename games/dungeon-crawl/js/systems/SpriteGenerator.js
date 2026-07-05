const _ = null;

function drawPixels(scene, key, w, h, data) {
  const canvas = scene.textures.createCanvas(key, w, h);
  const ctx = canvas.getContext();
  for (let y = 0; y < data.length; y++) {
    for (let x = 0; x < data[y].length; x++) {
      if (data[y][x]) {
        ctx.fillStyle = data[y][x];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  canvas.refresh();
  return canvas;
}

function drawMultiFrame(scene, key, fw, fh, frames) {
  const totalW = fw * frames.length;
  const canvas = scene.textures.createCanvas(key, totalW, fh);
  const ctx = canvas.getContext();
  frames.forEach((frame, fi) => {
    const ox = fi * fw;
    for (let y = 0; y < frame.length; y++) {
      for (let x = 0; x < frame[y].length; x++) {
        if (frame[y][x]) {
          ctx.fillStyle = frame[y][x];
          ctx.fillRect(ox + x, y, 1, 1);
        }
      }
    }
  });
  canvas.refresh();
  const tex = scene.textures.get(key);
  for (let i = 0; i < frames.length; i++) {
    tex.add(i, 0, i * fw, 0, fw, fh);
  }
  return tex;
}

const D = '#1a1a2e';
const BK = '#000000';
const WH = '#ffffff';
const SK = '#f0c8a0';
const GD = '#ffd700';
const SV = '#c0c0c0';
const DS = '#808080';
const BL = '#4444cc';
const RD = '#cc3333';
const GN = '#33aa33';
const DG = '#336633';
const BR = '#8b4513';
const LB = '#8888cc';
const PG = '#aa55aa';
const DG2 = '#444444';
const GN2 = '#228b22';
const BK2 = '#333333';

const paladinIdle1 = [
  [_,_,_,_,GD,GD,GD,_,_,_,_,_,_,_,_,_],
  [_,_,_,GD,GD,GD,GD,GD,_,_,_,_,_,_,_,_],
  [_,_,_,_,SK,SK,SK,_,_,_,_,_,_,_,_,_],
  [_,_,_,SK,WH,BK,WH,SK,_,_,_,_,_,_,_,_],
  [_,_,_,_,SK,SK,SK,_,_,_,_,_,_,_,_,_],
  [_,_,SV,SV,SV,SV,SV,SV,SV,_,_,_,_,_,_,_],
  [_,_,SV,GD,SV,SV,SV,GD,SV,_,_,_,_,_,_,_],
  [_,_,_,SV,SV,SV,SV,SV,_,_,_,_,_,_,_,_],
  [_,_,_,SV,SV,SV,SV,SV,_,_,_,_,_,_,_,_],
  [_,_,_,_,SV,SV,SV,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,BL,BL,BL,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,BL,_,BL,_,_,_,_,_,_,_,_,_],
  [_,_,_,SV,SV,_,SV,SV,_,_,_,_,_,_,_,_],
  [_,_,_,_,BR,_,BR,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,BR,_,BR,_,_,_,_,_,_,_,_,_],
  [_,_,_,DS,DS,_,DS,DS,_,_,_,_,_,_,_,_]
];

const paladinIdle2 = [
  [_,_,_,_,GD,GD,GD,_,_,_,_,_,_,_,_,_],
  [_,_,_,GD,GD,GD,GD,GD,_,_,_,_,_,_,_,_],
  [_,_,_,_,SK,SK,SK,_,_,_,_,_,_,_,_,_],
  [_,_,_,SK,WH,BK,WH,SK,_,_,_,_,_,_,_,_],
  [_,_,_,_,SK,SK,SK,_,_,_,_,_,_,_,_,_],
  [_,_,SV,SV,SV,SV,SV,SV,SV,_,_,_,_,_,_,_],
  [_,_,SV,GD,SV,SV,SV,GD,SV,_,_,_,_,_,_,_],
  [_,_,_,SV,SV,SV,SV,SV,_,_,_,_,_,_,_,_],
  [_,_,_,SV,SV,SV,SV,SV,_,_,_,_,_,_,_,_],
  [_,_,_,_,SV,SV,SV,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,BL,BL,BL,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,BL,_,BL,_,_,_,_,_,_,_,_,_],
  [_,_,SV,SV,_,_,_,SV,SV,_,_,_,_,_,_,_],
  [_,_,_,BR,_,_,_,BR,_,_,_,_,_,_,_,_],
  [_,_,_,BR,_,_,_,BR,_,_,_,_,_,_,_,_],
  [_,_,DS,DS,_,_,_,DS,DS,_,_,_,_,_,_,_]
];

const paladinAtk1 = [
  [_,_,_,_,GD,GD,GD,_,_,_,_,_,_,_,_,_],
  [_,_,_,GD,GD,GD,GD,GD,_,_,_,_,_,_,_,_],
  [_,_,_,_,SK,SK,SK,_,_,_,_,_,_,_,_,_],
  [_,_,_,SK,WH,BK,WH,SK,_,_,_,_,_,_,_,_],
  [_,_,_,_,SK,SK,SK,_,_,_,_,_,_,_,_,_],
  [_,_,SV,SV,SV,SV,SV,SV,SV,SV,_,_,_,_,_,_],
  [_,_,SV,GD,SV,SV,SV,GD,SV,SV,_,_,_,_,_,_],
  [_,_,_,SV,SV,SV,SV,SV,_,_,_,_,_,_,_,_],
  [_,_,_,SV,SV,SV,SV,SV,_,_,_,_,_,_,_,_],
  [_,_,_,_,SV,SV,SV,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,BL,BL,BL,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,BL,_,BL,_,_,_,_,_,_,_,_,_],
  [_,_,_,SV,SV,_,SV,SV,_,_,_,_,_,_,_,_],
  [_,_,_,_,BR,_,BR,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,BR,_,BR,_,_,_,_,_,_,_,_,_],
  [_,_,_,DS,DS,_,DS,DS,_,_,_,_,_,_,_,_]
];

const paladinAtk2 = [
  [_,_,_,_,GD,GD,GD,_,_,_,_,_,_,_,_,_],
  [_,_,_,GD,GD,GD,GD,GD,_,_,_,_,_,_,_,_],
  [_,_,_,_,SK,SK,SK,_,_,_,_,_,_,_,_,_],
  [_,_,_,SK,WH,BK,WH,SK,_,_,_,_,_,_,_,_],
  [_,_,_,_,SK,SK,SK,_,_,_,_,_,_,_,_,_],
  [_,_,SV,SV,SV,SV,SV,SV,_,_,_,_,_,_,_,_],
  [_,_,SV,GD,SV,SV,SV,GD,_,_,_,_,_,_,_,_],
  [_,_,SV,SV,SV,SV,SV,_,_,_,_,_,_,_,_,_],
  [_,_,SV,SV,SV,SV,SV,_,_,_,_,_,_,_,_,_],
  [_,_,_,SV,SV,SV,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,BL,BL,BL,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,BL,_,BL,_,_,_,_,_,_,_,_,_],
  [_,_,_,SV,SV,_,SV,SV,_,_,_,_,_,_,_,_],
  [_,_,_,_,BR,_,BR,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,BR,_,BR,_,_,_,_,_,_,_,_,_],
  [_,_,_,DS,DS,_,DS,DS,_,_,_,_,_,_,_,_]
];

function createGoblin(color1, color2, eyeColor) {
  return [
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,DG2,DG2,DG2,_,_,_,_,_,_,_,_,_],
    [_,_,_,DG2,color1,color1,color1,DG2,_,_,_,_,_,_,_,_],
    [_,_,_,_,color1,color1,color1,_,_,_,_,_,_,_,_,_],
    [_,_,_,color1,eyeColor,BK,eyeColor,color1,_,_,_,_,_,_,_,_],
    [_,_,_,_,color1,color1,color1,_,_,_,_,_,_,_,_,_],
    [_,_,_,color2,color2,color2,color2,color2,_,_,_,_,_,_,_,_],
    [_,_,_,_,color2,color2,color2,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,color2,color2,color2,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,color2,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,color1,_,color1,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,color1,_,color1,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,DG2,_,DG2,_,_,_,_,_,_,_,_,_],
    [_,_,_,DG2,DG2,_,DG2,DG2,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_]
  ];
}

function createSkeleton(bodyColor, detailColor) {
  return [
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,WH,WH,WH,_,_,_,_,_,_,_,_,_],
    [_,_,_,WH,WH,WH,WH,WH,_,_,_,_,_,_,_,_],
    [_,_,_,WH,BK,BK,BK,WH,_,_,_,_,_,_,_,_],
    [_,_,_,_,BK,WH,BK,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,WH,WH,WH,_,_,_,_,_,_,_,_,_],
    [_,_,_,detailColor,WH,WH,WH,detailColor,_,_,_,_,_,_,_,_],
    [_,_,_,_,WH,WH,WH,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,WH,WH,WH,_,_,_,_,_,_,_,_,_],
    [_,_,_,WH,WH,WH,WH,WH,_,_,_,_,_,_,_,_],
    [_,_,_,_,WH,_,WH,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,WH,_,WH,_,_,_,_,_,_,_,_,_],
    [_,_,_,WH,WH,_,WH,WH,_,_,_,_,_,_,_,_],
    [_,_,_,_,WH,_,WH,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,WH,_,WH,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,WH,_,WH,_,_,_,_,_,_,_,_,_]
  ];
}

function createZombie() {
  return [
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,DG2,DG2,DG2,_,_,_,_,_,_,_,_,_],
    [_,_,_,DG2,'#667766','#667766','#667766',DG2,_,_,_,_,_,_,_,_],
    [_,_,_,_,'#667766','#667766','#667766',_,_,_,_,_,_,_,_,_],
    [_,_,_,_,'#667766',BK,'#667766',_,_,_,_,_,_,_,_,_],
    [_,_,_,_,'#667766','#667766','#667766',_,_,_,_,_,_,_,_,_],
    [_,_,_,'#445544','#667766','#667766','#667766','#445544',_,_,_,_,_,_,_,_],
    [_,_,_,_,'#445544','#445544','#445544',_,_,_,_,_,_,_,_,_],
    [_,_,_,_,'#445544','#445544','#445544',_,_,_,_,_,_,_,_,_],
    [_,_,_,'#445544','#445544','#445544','#445544','#445544',_,_,_,_,_,_,_,_],
    [_,_,_,_,_,BK,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,'#667766',_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,'#667766',_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,DG2,_,DG2,_,_,_,_,_,_,_,_,_],
    [_,_,_,DG2,DG2,_,DG2,DG2,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_]
  ];
}

function createBoss(crownColor, bodyColor, eyeColor) {
  return [
    [_,_,_,_,crownColor,_,crownColor,_,crownColor,_,_,_,_,_,_,_],
    [_,_,_,crownColor,crownColor,crownColor,crownColor,crownColor,crownColor,_,_,_,_,_,_,_],
    [_,_,_,_,GD,GD,GD,_,_,_,_,_,_,_,_,_],
    [_,_,_,GD,bodyColor,bodyColor,bodyColor,GD,_,_,_,_,_,_,_,_],
    [_,_,_,_,bodyColor,bodyColor,bodyColor,_,_,_,_,_,_,_,_,_],
    [_,_,_,bodyColor,eyeColor,BK,eyeColor,bodyColor,_,_,_,_,_,_,_,_],
    [_,_,_,_,bodyColor,bodyColor,bodyColor,_,_,_,_,_,_,_,_,_],
    [_,_,bodyColor,bodyColor,bodyColor,bodyColor,bodyColor,bodyColor,bodyColor,_,_,_,_,_,_,_],
    [_,_,_,bodyColor,bodyColor,bodyColor,bodyColor,bodyColor,_,_,_,_,_,_,_,_],
    [_,_,_,bodyColor,bodyColor,bodyColor,bodyColor,bodyColor,_,_,_,_,_,_,_,_],
    [_,_,_,_,bodyColor,bodyColor,bodyColor,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,bodyColor,_,bodyColor,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,bodyColor,_,bodyColor,_,_,_,_,_,_,_,_,_],
    [_,_,_,DG2,bodyColor,_,bodyColor,DG2,_,_,_,_,_,_,_,_],
    [_,_,DG2,DG2,_,_,_,DG2,DG2,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_]
  ];
}

function createTile(color1, color2, accent) {
  const d = [];
  for (let y = 0; y < 16; y++) {
    const row = [];
    for (let x = 0; x < 16; x++) {
      if (y === 0 || y === 15 || x === 0 || x === 15) {
        row.push(accent || color2);
      } else if ((x + y) % 4 === 0) {
        row.push(color2);
      } else {
        row.push(color1);
      }
    }
    d.push(row);
  }
  return d;
}

function createFloorTile() {
  const d = [];
  for (let y = 0; y < 16; y++) {
    const row = [];
    for (let x = 0; x < 16; x++) {
      if (y % 8 === 0 || x % 8 === 0) {
        row.push('#555555');
      } else if ((x + y) % 7 === 0) {
        row.push('#6a6a6a');
      } else {
        row.push('#606060');
      }
    }
    d.push(row);
  }
  return d;
}

function createWallTile() {
  const d = [];
  for (let y = 0; y < 16; y++) {
    const row = [];
    for (let x = 0; x < 16; x++) {
      if (y < 2) {
        row.push('#4a3a2a');
      } else if (y < 4) {
        row.push('#3a2a1a');
      } else if ((x + y) % 5 === 0) {
        row.push('#3a2a1a');
      } else {
        row.push('#2a1a0a');
      }
    }
    d.push(row);
  }
  return d;
}

function createDoorTile() {
  const d = [];
  for (let y = 0; y < 16; y++) {
    const row = [];
    for (let x = 0; x < 16; x++) {
      if (x < 2 || x > 13) {
        row.push('#5a3a1a');
      } else if (y < 2 || y > 13) {
        row.push('#6a4a2a');
      } else if (x === 7 || x === 8) {
        row.push('#4a2a0a');
      } else if (x === 4 && y === 8) {
        row.push('#ffd700');
      } else {
        row.push('#8b6533');
      }
    }
    d.push(row);
  }
  return d;
}

function createBossFloorTile() {
  const d = [];
  for (let y = 0; y < 16; y++) {
    const row = [];
    for (let x = 0; x < 16; x++) {
      if (y % 8 === 0 || x % 8 === 0) {
        row.push('#440000');
      } else if ((x + y) % 6 === 0) {
        row.push('#660000');
      } else {
        row.push('#330000');
      }
    }
    d.push(row);
  }
  return d;
}

function createCorridorTile() {
  const d = [];
  for (let y = 0; y < 16; y++) {
    const row = [];
    for (let x = 0; x < 16; x++) {
      if ((x + y) % 6 === 0) {
        row.push('#505050');
      } else {
        row.push('#484848');
      }
    }
    d.push(row);
  }
  return d;
}

function createForestFloorTile() {
  const d = [];
  for (let y = 0; y < 16; y++) {
    const row = [];
    for (let x = 0; x < 16; x++) {
      if (y % 8 === 0 || x % 8 === 0) {
        row.push('#2d5a1e');
      } else if ((x + y) % 5 === 0) {
        row.push('#3a6b28');
      } else {
        row.push('#336024');
      }
    }
    d.push(row);
  }
  return d;
}

function createForestWallTile() {
  const d = [];
  for (let y = 0; y < 16; y++) {
    const row = [];
    for (let x = 0; x < 16; x++) {
      if (y < 4) row.push('#1a3d0d');
      else if (y < 8) row.push('#2d5a1e');
      else if ((x + y) % 6 === 0) row.push('#4a2a0a');
      else row.push('#3a2210');
    }
    d.push(row);
  }
  return d;
}

function createDreamFloorTile() {
  const d = [];
  for (let y = 0; y < 16; y++) {
    const row = [];
    for (let x = 0; x < 16; x++) {
      if (y % 8 === 0 || x % 8 === 0) {
        row.push('#3a2a5a');
      } else if ((x + y) % 5 === 0) {
        row.push('#4a3a7a');
      } else {
        row.push('#352560');
      }
    }
    d.push(row);
  }
  return d;
}

function createDreamWallTile() {
  const d = [];
  for (let y = 0; y < 16; y++) {
    const row = [];
    for (let x = 0; x < 16; x++) {
      if (y < 3) row.push('#1a0d3d');
      else if (y < 7) row.push('#2a1a5a');
      else if ((x + y) % 5 === 0) row.push('#4a3a7a');
      else row.push('#251050');
    }
    d.push(row);
  }
  return d;
}

function createRuinsFloorTile() {
  const d = [];
  for (let y = 0; y < 16; y++) {
    const row = [];
    for (let x = 0; x < 16; x++) {
      if (y % 8 === 0 || x % 8 === 0) {
        row.push('#8a7a5a');
      } else if ((x + y) % 6 === 0) {
        row.push('#9a8a6a');
      } else {
        row.push('#7a6a4a');
      }
    }
    d.push(row);
  }
  return d;
}

function createRuinsWallTile() {
  const d = [];
  for (let y = 0; y < 16; y++) {
    const row = [];
    for (let x = 0; x < 16; x++) {
      if (y < 3) row.push('#4a3a1a');
      else if ((x + y) % 5 === 0) row.push('#6a5a3a');
      else row.push('#5a4a2a');
    }
    d.push(row);
  }
  return d;
}

function createVolcanicFloorTile() {
  const d = [];
  for (let y = 0; y < 16; y++) {
    const row = [];
    for (let x = 0; x < 16; x++) {
      if (y % 8 === 0 || x % 8 === 0) {
        row.push('#3a1a0a');
      } else if ((x + y) % 4 === 0) {
        row.push('#5a2010');
      } else {
        row.push('#2a1008');
      }
    }
    d.push(row);
  }
  return d;
}

function createVolcanicWallTile() {
  const d = [];
  for (let y = 0; y < 16; y++) {
    const row = [];
    for (let x = 0; x < 16; x++) {
      if (y < 3) row.push('#1a0800');
      else if (y < 7) row.push('#2a1008');
      else if ((x + y) % 4 === 0) row.push('#6a2010');
      else row.push('#3a1a0a');
    }
    d.push(row);
  }
  return d;
}

function createHealthBar(w, h, color) {
  const d = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) {
      if (y === 0 || y === h - 1 || x === 0 || x === w - 1) {
        row.push('#222222');
      } else {
        row.push(color);
      }
    }
    d.push(row);
  }
  return d;
}

function createButton(w, h, bg, border) {
  const d = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) {
      if (y === 0 || y === h - 1 || x === 0 || x === w - 1) {
        row.push(border);
      } else {
        row.push(bg);
      }
    }
    d.push(row);
  }
  return d;
}

function createPanelBg(w, h) {
  const d = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) {
      if (y === 0 || y === h - 1 || x === 0 || x === w - 1) {
        row.push('#555555');
      } else {
        row.push('#1a1a2e');
      }
    }
    d.push(row);
  }
  return d;
}

function createSword() {
  return [
    [_,_,_,_,_,_,_,WH,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,WH,SV,WH,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,WH,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,WH,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,WH,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,WH,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,WH,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,WH,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,WH,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,WH,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,WH,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,BR,BR,BR,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,BR,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,BR,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,GD,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,GD,_,_,_,_,_,_,_,_]
  ];
}

function createChestplate() {
  return [
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,SV,SV,SV,SV,SV,SV,_,_,_,_,_,_],
    [_,_,_,SV,SV,SV,SV,SV,SV,SV,SV,_,_,_,_,_],
    [_,_,SV,SV,_,_,SV,SV,_,_,SV,SV,_,_,_,_],
    [_,_,SV,SV,_,_,SV,SV,_,_,SV,SV,_,_,_,_],
    [_,_,_,SV,SV,SV,SV,SV,SV,SV,SV,_,_,_,_,_],
    [_,_,_,_,SV,SV,SV,SV,SV,SV,_,_,_,_,_,_],
    [_,_,_,_,_,SV,SV,SV,SV,_,_,_,_,_,_,_],
    [_,_,_,_,_,SV,SV,SV,SV,_,_,_,_,_,_,_],
    [_,_,_,_,_,SV,SV,SV,SV,_,_,_,_,_,_,_],
    [_,_,_,_,_,SV,SV,SV,SV,_,_,_,_,_,_,_],
    [_,_,_,_,_,SV,SV,SV,SV,_,_,_,_,_,_,_],
    [_,_,_,_,_,SV,SV,SV,SV,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,SV,SV,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_]
  ];
}

function createRing() {
  return [
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,GD,GD,GD,GD,_,_,_,_,_,_,_],
    [_,_,_,_,GD,_,_,_,_,GD,_,_,_,_,_,_],
    [_,_,_,GD,_,_,_,_,_,_,GD,_,_,_,_,_],
    [_,_,_,GD,_,_,_,_,_,_,GD,_,_,_,_,_],
    [_,_,_,GD,_,_,_,_,_,_,GD,_,_,_,_,_],
    [_,_,_,GD,_,_,_,_,_,_,GD,_,_,_,_,_],
    [_,_,_,GD,_,_,_,_,_,_,GD,_,_,_,_,_],
    [_,_,_,_,GD,_,_,_,_,GD,_,_,_,_,_,_],
    [_,_,_,_,_,GD,GD,GD,GD,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_]
  ];
}

const RARITY_COLORS = {
  common: '#aaaaaa',
  uncommon: '#1eff00',
  rare: '#0070dd',
  epic: '#a335ee',
  legendary: '#ff8000'
};

export function generateAllSprites(scene) {
  drawMultiFrame(scene, 'hero_paladin', 16, 16, [paladinIdle1, paladinIdle2, paladinAtk1, paladinAtk2]);

  const goblinFrames = [createGoblin('#33aa33', '#228822', '#ffff00')];
  drawMultiFrame(scene, 'enemy_goblin', 16, 16, [...goblinFrames, ...goblinFrames]);

  const archerFrames = [createGoblin('#44bb44', '#339933', '#ff6600')];
  drawMultiFrame(scene, 'enemy_goblin_archer', 16, 16, [...archerFrames, ...archerFrames]);

  drawMultiFrame(scene, 'enemy_skeleton', 16, 16, [
    createSkeleton(WH, DS),
    createSkeleton(WH, DS)
  ]);

  drawMultiFrame(scene, 'enemy_zombie', 16, 16, [
    createZombie(),
    createZombie()
  ]);

  const warchiefFrames = [createBoss(RD, '#228822', '#ffff00')];
  drawMultiFrame(scene, 'enemy_goblin_warchief', 16, 16, [...warchiefFrames, ...warchiefFrames]);

  const kingFrames = [createBoss(GD, '#228822', '#ff0000')];
  drawMultiFrame(scene, 'enemy_goblin_king', 16, 16, [...kingFrames, ...kingFrames]);

  const cmdrFrames = [createBoss(DS, WH, '#ff0000')];
  drawMultiFrame(scene, 'enemy_bone_commander', 16, 16, [...cmdrFrames, ...cmdrFrames]);

  const lichFrames = [createBoss(PG, PG, '#00ff00')];
  drawMultiFrame(scene, 'enemy_lich_lord', 16, 16, [...lichFrames, ...lichFrames]);

  drawPixels(scene, 'tile_floor', 16, 16, createFloorTile());
  drawPixels(scene, 'tile_wall', 16, 16, createWallTile());
  drawPixels(scene, 'tile_door', 16, 16, createDoorTile());
  drawPixels(scene, 'tile_boss_floor', 16, 16, createBossFloorTile());
  drawPixels(scene, 'tile_corridor', 16, 16, createCorridorTile());

  drawPixels(scene, 'tile_forest_floor', 16, 16, createForestFloorTile());
  drawPixels(scene, 'tile_forest_wall', 16, 16, createForestWallTile());
  drawPixels(scene, 'tile_dream_floor', 16, 16, createDreamFloorTile());
  drawPixels(scene, 'tile_dream_wall', 16, 16, createDreamWallTile());
  drawPixels(scene, 'tile_ruins_floor', 16, 16, createRuinsFloorTile());
  drawPixels(scene, 'tile_ruins_wall', 16, 16, createRuinsWallTile());
  drawPixels(scene, 'tile_volcanic_floor', 16, 16, createVolcanicFloorTile());
  drawPixels(scene, 'tile_volcanic_wall', 16, 16, createVolcanicWallTile());

  drawPixels(scene, 'health_bar_bg', 32, 6, createHealthBar(32, 6, '#333333'));
  drawPixels(scene, 'health_bar_fill', 32, 6, createHealthBar(32, 6, GN));
  drawPixels(scene, 'mana_bar_bg', 32, 6, createHealthBar(32, 6, '#333333'));
  drawPixels(scene, 'mana_bar_fill', 32, 6, createHealthBar(32, 6, '#2196f3'));
  drawPixels(scene, 'btn_normal', 120, 30, createButton(120, 30, '#2a2a4e', '#555577'));
  drawPixels(scene, 'btn_hover', 120, 30, createButton(120, 30, '#3a3a6e', '#7777aa'));
  drawPixels(scene, 'btn_pressed', 120, 30, createButton(120, 30, '#1a1a2e', '#444466'));
  drawPixels(scene, 'panel_bg', 200, 150, createPanelBg(200, 150));

  const sword = createSword();
  const chest = createChestplate();
  const ring = createRing();

  for (const [rarity, color] of Object.entries(RARITY_COLORS)) {
    const tintedSword = sword.map(row => row.map(p => p === WH ? color : p === SV ? color : p));
    const tintedChest = chest.map(row => row.map(p => p === SV ? color : p));
    const tintedRing = ring.map(row => row.map(p => p === GD ? color : p));

    drawPixels(scene, `loot_weapon_${rarity}`, 16, 16, tintedSword);
    drawPixels(scene, `loot_armor_${rarity}`, 16, 16, tintedChest);
    drawPixels(scene, `loot_accessory_${rarity}`, 16, 16, tintedRing);
  }
}
