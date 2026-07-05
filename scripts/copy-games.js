const fs = require('fs');
const path = require('path');

const src = path.join(process.cwd(), 'games');
const dest = path.join(process.cwd(), 'public', 'games');

if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true });
}

fs.mkdirSync(dest, { recursive: true });

for (const dir of fs.readdirSync(src, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const gameSrc = path.join(src, dir.name);
  const target = path.join(dest, dir.name);
  fs.mkdirSync(target, { recursive: true });

  const gamePublic = path.join(gameSrc, 'public');
  if (fs.existsSync(gamePublic)) {
    fs.cpSync(gamePublic, target, { recursive: true });
  }

  const jsDir = path.join(gameSrc, 'js');
  if (fs.existsSync(jsDir)) {
    fs.cpSync(jsDir, path.join(target, 'js'), { recursive: true });
  }

  const indexHtml = path.join(gameSrc, 'index.html');
  if (fs.existsSync(indexHtml)) {
    fs.copyFileSync(indexHtml, path.join(target, 'index.html'));
  }
}

console.log('Game files copied to public/games/');
