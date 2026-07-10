import { EXPANSION_ENEMIES } from './enemiesExpansion.js';

let nextId = 0;

function generateId() {
  nextId++;
  return 'enemy_' + nextId.toString(16).padStart(8, '0');
}

export const ENEMIES = {
  goblin: {
    name: 'Goblin',
    type: 'trash',
    baseStats: { hp: 30, attack: 5, defense: 2, speed: 3, critChance: 0.05, critMultiplier: 1.3 },
    abilities: [],
    lootGold: { min: 2, max: 5 },
    xpReward: 5
  },
  goblin_archer: {
    name: 'Goblin Archer',
    type: 'trash',
    baseStats: { hp: 20, attack: 8, defense: 1, speed: 4, critChance: 0.1, critMultiplier: 1.5 },
    abilities: [],
    lootGold: { min: 3, max: 6 },
    xpReward: 6
  },
  skeleton: {
    name: 'Skeleton',
    type: 'trash',
    baseStats: { hp: 40, attack: 6, defense: 3, speed: 2, critChance: 0.05, critMultiplier: 1.3 },
    abilities: [],
    lootGold: { min: 3, max: 7 },
    xpReward: 8
  },
  zombie: {
    name: 'Zombie',
    type: 'trash',
    baseStats: { hp: 60, attack: 4, defense: 1, speed: 1, critChance: 0, critMultiplier: 1.0 },
    abilities: [],
    lootGold: { min: 4, max: 8 },
    xpReward: 10
  },
  goblin_warchief: {
    name: 'Goblin Warchief',
    type: 'mini_boss',
    baseStats: { hp: 100, attack: 8, defense: 3, speed: 3, critChance: 0.1, critMultiplier: 1.5 },
    abilities: [
      { id: 'cleave', name: 'Cleave', type: 'physical', power: 1.5, cooldown: 3, currentCooldown: 0, targeting: 'random_hero' }
    ],
    lootGold: { min: 20, max: 40 },
    xpReward: 50
  },
  bone_commander: {
    name: 'Bone Commander',
    type: 'mini_boss',
    baseStats: { hp: 200, attack: 14, defense: 8, speed: 2, critChance: 0.1, critMultiplier: 1.5 },
    abilities: [
      { id: 'bone_spike', name: 'Bone Spike', type: 'physical', power: 1.8, cooldown: 3, currentCooldown: 0, targeting: 'highest_threat' }
    ],
    lootGold: { min: 30, max: 60 },
    xpReward: 80
  },
  goblin_king: {
    name: 'Goblin King',
    type: 'final_boss',
    baseStats: { hp: 180, attack: 12, defense: 4, speed: 3, critChance: 0.1, critMultiplier: 1.5 },
    abilities: [
      { id: 'royal_slam', name: 'Royal Slam', type: 'physical', power: 2.0, cooldown: 4, currentCooldown: 0, targeting: 'highest_threat' },
      { id: 'summon_guards', name: 'Summon Guards', type: 'summon', power: 0, cooldown: 6, currentCooldown: 0, targeting: 'self' }
    ],
    enrageThreshold: 0.25,
    enrageMultiplier: 1.5,
    lootGold: { min: 50, max: 100 },
    xpReward: 150
  },
  lich_lord: {
    name: 'Lich Lord',
    type: 'final_boss',
    baseStats: { hp: 400, attack: 22, defense: 10, speed: 4, critChance: 0.15, critMultiplier: 1.7 },
    abilities: [
      { id: 'shadow_bolt', name: 'Shadow Bolt', type: 'physical', power: 2.5, cooldown: 3, currentCooldown: 0, targeting: 'lowest_hp_hero' },
      { id: 'death_coil', name: 'Death Coil', type: 'physical', power: 3.0, cooldown: 6, currentCooldown: 0, targeting: 'highest_threat' }
    ],
    enrageThreshold: 0.25,
    enrageMultiplier: 1.5,
    lootGold: { min: 80, max: 150 },
    xpReward: 250
  }
};

export function createEnemy(typeKey, levelScaling = 1) {
  const def = ENEMIES[typeKey];
  if (!def) {
    throw new Error(`Unknown enemy type: ${typeKey}`);
  }

  const stats = {};
  const statKeys = Object.keys(def.baseStats);
  for (const stat of statKeys) {
    stats[stat] = Math.floor(def.baseStats[stat] * levelScaling);
  }

  const maxHp = Math.floor(def.baseStats.hp * levelScaling);

  const abilities = def.abilities.map(a => ({ ...a }));

  const isBoss = def.type === 'mini_boss' || def.type === 'final_boss';

  return {
    id: generateId(),
    type: typeKey,
    name: def.name,
    enemyType: def.type,
    currentHp: maxHp,
    maxHp: maxHp,
    stats: stats,
    abilities: abilities,
    isBoss: isBoss,
    enrageThreshold: def.enrageThreshold || null,
    enrageMultiplier: def.enrageMultiplier || null,
    isEnraged: false,
    lootGold: { ...def.lootGold },
    xpReward: def.xpReward,
    takeDamage(amount) {
      this.currentHp = Math.max(0, this.currentHp - amount);
    },
    isAlive() {
      return this.currentHp > 0;
    }
  };
}

// ─── Expansion Pack (Phase 5B) ────────────────────────────────
Object.assign(ENEMIES, EXPANSION_ENEMIES);
