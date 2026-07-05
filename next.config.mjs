import fs from 'fs';
import path from 'path';

function copyGames() {
  const src = path.join(process.cwd(), 'games');
  const dest = path.join(process.cwd(), 'public', 'games');
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
}

const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
if (isBuild) copyGames();

const nextConfig = {
  output: 'standalone',
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  }
};

export default nextConfig;
