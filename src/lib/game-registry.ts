import fs from 'fs/promises';
import path from 'path';

export interface Game {
  id: string;
  name: string;
  version: string;
  description: string;
  thumbnail: string;
  tags: string[];
  author: string;
}

export async function listGames(): Promise<Game[]> {
  const dir = path.join(process.cwd(), 'games');
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const games: Game[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      const manifestPath = path.join(dir, entry.name, 'manifest.json');
      const raw = await fs.readFile(manifestPath, 'utf-8');
      games.push(JSON.parse(raw));
    } catch {
      // Skip invalid game dirs
    }
  }
  return games;
}
