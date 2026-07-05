import { EXPANSION_DUNGEONS } from './dungeonsExpansion.js';

export const DUNGEONS = {
  goblin_caverns: {
    id: 'goblin_caverns',
    name: 'Goblin Caverns',
    levelRange: [1, 3],
    difficulty: 1,
    baseGoldReward: 80,
    unlockCondition: null,
    rooms: [
      {
        index: 0,
        type: 'trash',
        theme: 'cavern',
        enemies: [
          { type: 'goblin', count: 5 }
        ]
      },
      {
        index: 1,
        type: 'trash',
        theme: 'cavern',
        enemies: [
          { type: 'goblin', count: 3 },
          { type: 'goblin_archer', count: 2 }
        ]
      },
      {
        index: 2,
        type: 'mini_boss',
        theme: 'cavern',
        enemies: [
          { type: 'goblin_warchief', count: 1 },
          { type: 'goblin', count: 2 }
        ]
      },
      {
        index: 3,
        type: 'trash',
        theme: 'cavern',
        enemies: [
          { type: 'goblin', count: 3 },
          { type: 'goblin_archer', count: 3 }
        ]
      },
      {
        index: 4,
        type: 'final_boss',
        theme: 'boss',
        enemies: [
          { type: 'goblin_king', count: 1 },
          { type: 'goblin_warchief', count: 1 }
        ]
      }
    ]
  },
  undead_crypt: {
    id: 'undead_crypt',
    name: 'Undead Crypt',
    levelRange: [4, 6],
    difficulty: 2,
    baseGoldReward: 180,
    unlockCondition: { type: 'dungeon_complete', dungeonId: 'goblin_caverns', count: 3 },
    rooms: [
      { index: 0, type: 'trash', theme: 'crypt', enemies: [{ type: 'skeleton', count: 4 }, { type: 'zombie', count: 2 }] },
      { index: 1, type: 'trash', theme: 'crypt', enemies: [{ type: 'skeleton', count: 3 }, { type: 'zombie', count: 3 }] },
      { index: 2, type: 'trash', theme: 'crypt', enemies: [{ type: 'zombie', count: 5 }] },
      { index: 3, type: 'mini_boss', theme: 'crypt', enemies: [{ type: 'bone_commander', count: 1 }, { type: 'skeleton', count: 3 }] },
      { index: 4, type: 'trash', theme: 'crypt', enemies: [{ type: 'skeleton', count: 4 }, { type: 'zombie', count: 3 }] },
      { index: 5, type: 'trash', theme: 'crypt', enemies: [{ type: 'skeleton', count: 5 }, { type: 'zombie', count: 2 }] },
      { index: 6, type: 'final_boss', theme: 'boss', enemies: [{ type: 'lich_lord', count: 1 }, { type: 'bone_commander', count: 1 }, { type: 'skeleton', count: 3 }] }
    ]
  },
  emerald_woods: {
    id: 'emerald_woods',
    name: 'Emerald Woods',
    levelRange: [4, 7],
    difficulty: 2,
    baseGoldReward: 150,
    unlockCondition: null,
    rooms: [
      { index: 0, type: 'trash', theme: 'forest', enemies: [{ type: 'goblin', count: 3 }, { type: 'goblin_archer', count: 3 }] },
      { index: 1, type: 'trash', theme: 'forest', enemies: [{ type: 'goblin', count: 4 }, { type: 'goblin_archer', count: 2 }] },
      { index: 2, type: 'trash', theme: 'forest', enemies: [{ type: 'goblin_archer', count: 5 }] },
      { index: 3, type: 'mini_boss', theme: 'forest', enemies: [{ type: 'goblin_warchief', count: 1 }, { type: 'goblin', count: 3 }] },
      { index: 4, type: 'trash', theme: 'forest', enemies: [{ type: 'goblin', count: 3 }, { type: 'goblin_archer', count: 4 }] },
      { index: 5, type: 'final_boss', theme: 'boss', enemies: [{ type: 'goblin_king', count: 1 }, { type: 'goblin_warchief', count: 1 }, { type: 'goblin_archer', count: 2 }] }
    ]
  },
  echo_caverns: {
    id: 'echo_caverns',
    name: 'Echo Caverns',
    levelRange: [7, 10],
    difficulty: 3,
    baseGoldReward: 280,
    unlockCondition: { type: 'dungeon_complete', dungeonId: 'undead_crypt', count: 2 },
    rooms: [
      { index: 0, type: 'trash', theme: 'ruins', enemies: [{ type: 'skeleton', count: 4 }, { type: 'zombie', count: 2 }] },
      { index: 1, type: 'trash', theme: 'ruins', enemies: [{ type: 'skeleton', count: 5 }] },
      { index: 2, type: 'trash', theme: 'ruins', enemies: [{ type: 'zombie', count: 4 }, { type: 'skeleton', count: 3 }] },
      { index: 3, type: 'mini_boss', theme: 'ruins', enemies: [{ type: 'bone_commander', count: 1 }, { type: 'zombie', count: 3 }] },
      { index: 4, type: 'trash', theme: 'ruins', enemies: [{ type: 'skeleton', count: 4 }, { type: 'zombie', count: 3 }] },
      { index: 5, type: 'trash', theme: 'ruins', enemies: [{ type: 'skeleton', count: 6 }] },
      { index: 6, type: 'mini_boss', theme: 'ruins', enemies: [{ type: 'bone_commander', count: 1 }, { type: 'skeleton', count: 4 }] },
      { index: 7, type: 'trash', theme: 'ruins', enemies: [{ type: 'zombie', count: 5 }, { type: 'skeleton', count: 2 }] },
      { index: 8, type: 'final_boss', theme: 'boss', enemies: [{ type: 'lich_lord', count: 1 }, { type: 'bone_commander', count: 2 }] }
    ]
  }
};

export const DUNGEON_LIST = Object.values(DUNGEONS);

export function isDungeonUnlocked(dungeonId, dungeonsCompleted) {
  const dungeon = DUNGEONS[dungeonId];
  if (!dungeon) return false;
  if (!dungeon.unlockCondition) return true;

  const { type, dungeonId: requiredId, count } = dungeon.unlockCondition;

  if (type === 'dungeon_complete') {
    const completed = dungeonsCompleted[requiredId] || 0;
    return completed >= count;
  }

  return false;
}

// ─── Expansion Pack (Phase 5A) ────────────────────────────────
import { EXPANSION_DUNGEONS } from './dungeonsExpansion.js';
Object.assign(DUNGEONS, EXPANSION_DUNGEONS);
DUNGEON_LIST.length = 0;
DUNGEON_LIST.push(...Object.values(DUNGEONS));
