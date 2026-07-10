import fs from 'fs/promises';
import path from 'path';

const SAVE_DIR = process.env.SAVE_DIR || '/data/saves';

function savePath(userId: string, gameId: string, slot: string) {
  if (!/^user_[a-zA-Z0-9]+$/.test(userId)) throw new Error('Invalid userId');
  if (!/^[a-z0-9-]+$/.test(gameId)) throw new Error('Invalid gameId');
  if (!/^[a-z0-9-]+$/.test(slot)) throw new Error('Invalid slot');
  return path.join(SAVE_DIR, userId, gameId, `${slot}.json`);
}

export async function readSave(userId: string, gameId: string, slot: string) {
  try {
    const raw = await fs.readFile(savePath(userId, gameId, slot), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function writeSave(userId: string, gameId: string, slot: string, data: unknown) {
  const target = savePath(userId, gameId, slot);
  await fs.mkdir(path.dirname(target), { recursive: true });
  const tmp = target + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, target);
}

export async function deleteSave(userId: string, gameId: string, slot: string) {
  try {
    await fs.unlink(savePath(userId, gameId, slot));
    return true;
  } catch {
    return false;
  }
}

export async function listSaves(userId: string, gameId: string) {
  const dir = path.join(SAVE_DIR, userId, gameId);
  try {
    const files = await fs.readdir(dir);
    return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
  } catch {
    return [];
  }
}
