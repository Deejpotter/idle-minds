/**
 * Expansion Dungeons - Elemental and dream-themed dungeons
 * Unlocked by completing prerequisite dungeons
 */

export const EXPANSION_DUNGEONS = {
  fire_pit: {
    id: 'fire_pit',
    name: 'The Fire Pit',
    levelRange: [8, 12],
    difficulty: 2,
    baseGoldReward: 220,
    theme: 'fire',
    unlockCondition: { type: 'dungeon_complete', dungeonId: 'goblin_caverns', count: 1 },
    rooms: [
      {
        index: 0,
        type: 'trash',
        theme: 'fire',
        enemies: [{ type: 'fire_imp', count: 4 }, { type: 'flame_elemental', count: 1 }]
      },
      {
        index: 1,
        type: 'trash',
        theme: 'fire',
        enemies: [{ type: 'flame_elemental', count: 3 }, { type: 'fire_imp', count: 3 }]
      },
      {
        index: 2,
        type: 'mini_boss',
        theme: 'fire',
        enemies: [{ type: 'flame_elemental', count: 2 }, { type: 'fire_imp', count: 4 }]
      },
      {
        index: 3,
        type: 'final_boss',
        theme: 'fire',
        enemies: [{ type: 'flame_elemental', count: 3 }, { type: 'fire_imp', count: 6 }]
      }
    ]
  },

  frozen_crypt: {
    id: 'frozen_crypt',
    name: 'The Frozen Crypt',
    levelRange: [12, 16],
    difficulty: 3,
    baseGoldReward: 380,
    theme: 'ice',
    unlockCondition: { type: 'dungeon_complete', dungeonId: 'undead_crypt', count: 1 },
    rooms: [
      {
        index: 0,
        type: 'trash',
        theme: 'ice',
        enemies: [{ type: 'frost_wraith', count: 3 }, { type: 'fire_imp', count: 2 }]
      },
      {
        index: 1,
        type: 'trash',
        theme: 'ice',
        enemies: [{ type: 'frost_wraith', count: 4 }, { type: 'ice_golem', count: 1 }]
      },
      {
        index: 2,
        type: 'mini_boss',
        theme: 'ice',
        enemies: [{ type: 'ice_golem', count: 1 }, { type: 'frost_wraith', count: 3 }]
      },
      {
        index: 3,
        type: 'final_boss',
        theme: 'ice',
        enemies: [{ type: 'ice_golem', count: 2 }, { type: 'frost_wraith', count: 4 }]
      }
    ]
  },

  dream_realm: {
    id: 'dream_realm',
    name: 'The Dream Realm',
    levelRange: [16, 20],
    difficulty: 4,
    baseGoldReward: 600,
    theme: 'dream',
    unlockCondition: { type: 'dungeon_complete', dungeonId: 'fire_pit', count: 1 },
    rooms: [
      {
        index: 0,
        type: 'trash',
        theme: 'dream',
        enemies: [{ type: 'dream_eater', count: 4 }, { type: 'frost_wraith', count: 2 }]
      },
      {
        index: 1,
        type: 'trash',
        theme: 'dream',
        enemies: [{ type: 'dream_eater', count: 5 }, { type: 'nightmare', count: 1 }]
      },
      {
        index: 2,
        type: 'mini_boss',
        theme: 'dream',
        enemies: [{ type: 'nightmare', count: 1 }, { type: 'dream_eater', count: 4 }]
      },
      {
        index: 3,
        type: 'final_boss',
        theme: 'dream',
        enemies: [{ type: 'nightmare', count: 2 }, { type: 'dream_eater', count: 6 }]
      }
    ]
  }
};

export const EXPANSION_DUNGEON_LIST = Object.values(EXPANSION_DUNGEONS);

export function mergeDungeons(baseDungeons) {
  return { ...baseDungeons, ...EXPANSION_DUNGEONS };
}