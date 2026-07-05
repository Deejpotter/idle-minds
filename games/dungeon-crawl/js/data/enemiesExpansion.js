/**
 * Expansion Enemies - Elemental and dream-themed enemies
 * Designed for fire_pit, frozen_crypt, dream_realm dungeons
 */

export const EXPANSION_ENEMIES = {
  fire_imp: {
    name: 'Fire Imp',
    type: 'trash',
    baseStats: { hp: 80, attack: 14, defense: 4, speed: 5, critChance: 0.08, critMultiplier: 1.4 },
    abilities: [
      { id: 'fire_bolt', name: 'Fire Bolt', type: 'physical', power: 1.4, cooldown: 3, currentCooldown: 0, targeting: 'random_hero' }
    ],
    lootGold: { min: 8, max: 15 },
    xpReward: 18
  },
  flame_elemental: {
    name: 'Flame Elemental',
    type: 'trash',
    baseStats: { hp: 120, attack: 18, defense: 6, speed: 4, critChance: 0.05, critMultiplier: 1.3 },
    abilities: [
      { id: 'flame_burst', name: 'Flame Burst', type: 'physical', power: 1.6, cooldown: 4, currentCooldown: 0, targeting: 'all_heroes' }
    ],
    lootGold: { min: 10, max: 18 },
    xpReward: 22
  },
  frost_wraith: {
    name: 'Frost Wraith',
    type: 'trash',
    baseStats: { hp: 100, attack: 16, defense: 7, speed: 6, critChance: 0.1, critMultiplier: 1.5 },
    abilities: [
      { id: 'ice_shard', name: 'Ice Shard', type: 'physical', power: 1.5, cooldown: 3, currentCooldown: 0, targeting: 'highest_threat' },
      { id: 'frost_nova', name: 'Frost Nova', type: 'physical', power: 1.2, cooldown: 5, currentCooldown: 0, targeting: 'all_heroes' }
    ],
    lootGold: { min: 12, max: 20 },
    xpReward: 28
  },
  ice_golem: {
    name: 'Ice Golem',
    type: 'mini_boss',
    baseStats: { hp: 350, attack: 22, defense: 14, speed: 2, critChance: 0.05, critMultiplier: 1.3 },
    abilities: [
      { id: 'glacial_slam', name: 'Glacial Slam', type: 'physical', power: 2.2, cooldown: 4, currentCooldown: 0, targeting: 'highest_threat' },
      { id: 'frozen_armor', name: 'Frozen Armor', type: 'buff', power: 0, cooldown: 6, currentCooldown: 0, targeting: 'self' }
    ],
    lootGold: { min: 40, max: 75 },
    xpReward: 100
  },
  dream_eater: {
    name: 'Dream Eater',
    type: 'trash',
    baseStats: { hp: 110, attack: 19, defense: 5, speed: 7, critChance: 0.12, critMultiplier: 1.6 },
    abilities: [
      { id: 'night_terror', name: 'Night Terror', type: 'physical', power: 1.7, cooldown: 3, currentCooldown: 0, targeting: 'lowest_hp_hero' }
    ],
    lootGold: { min: 14, max: 22 },
    xpReward: 30
  },
  nightmare: {
    name: 'Nightmare',
    type: 'final_boss',
    baseStats: { hp: 600, attack: 28, defense: 10, speed: 8, critChance: 0.18, critMultiplier: 1.8 },
    abilities: [
      { id: 'shadow_eruption', name: 'Shadow Eruption', type: 'physical', power: 2.6, cooldown: 3, currentCooldown: 0, targeting: 'all_heroes' },
      { id: 'mind_rend', name: 'Mind Rend', type: 'physical', power: 3.0, cooldown: 5, currentCooldown: 0, targeting: 'highest_threat' },
      { id: 'dream_shift', name: 'Dream Shift', type: 'buff', power: 0, cooldown: 7, currentCooldown: 0, targeting: 'self' }
    ],
    enrageThreshold: 0.25,
    enrageMultiplier: 1.6,
    lootGold: { min: 120, max: 200 },
    xpReward: 350
  }
};

/**
 * Merge expansion enemies into the main ENEMIES dictionary
 * Used by importing this module's side effect
 */
export function getMergedEnemies(baseEnemies) {
  return { ...baseEnemies, ...EXPANSION_ENEMIES };
}