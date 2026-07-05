/**
 * Expansion Gear - Legendary items with unique effects
 * Drop only from expansion dungeon final bosses
 */

export const EXPANSION_GEAR = {
  inferno_blade: {
    id: 'inferno_blade',
    name: 'Inferno Blade',
    slot: 'weapon',
    rarity: 'legendary',
    level: 10,
    statBonus: { attack: 18, magic: 12, critChance: 0.08 },
    uniqueEffect: {
      id: 'fire_damage',
      name: 'Fire Damage',
      description: 'Deals additional fire damage equal to 50% of magic stat',
      scaleStat: 'magic',
      multiplier: 0.5
    },
    color: '#ff4400'
  },

  eternal_aegis: {
    id: 'eternal_aegis',
    name: 'Eternal Aegis',
    slot: 'armor',
    rarity: 'legendary',
    level: 14,
    statBonus: { defense: 25, hp: 80 },
    uniqueEffect: {
      id: 'damage_reflection',
      name: 'Damage Reflection',
      description: 'Reflects 20% of incoming damage back to attackers',
      reflectPercent: 0.2
    },
    color: '#4488ff'
  },

  dreamweaver_ring: {
    id: 'dreamweaver_ring',
    name: 'Dreamweaver Ring',
    slot: 'accessory',
    rarity: 'legendary',
    level: 18,
    statBonus: { magic: 15, mp: 40, mpRegen: 1.5 },
    uniqueEffect: {
      id: 'mana_efficiency',
      name: 'Mana Efficiency',
      description: 'Reduces ability mana cost by 30%',
      manaReduction: 0.3
    },
    color: '#cc88ff'
  }
};

/**
 * List of expansion item IDs for random selection
 */
export const EXPANSION_GEAR_IDS = Object.keys(EXPANSION_GEAR);

/**
 * Get expansion gear by ID
 */
export function getExpansionGear(id) {
  return EXPANSION_GEAR[id] || null;
}

/**
 * Pick a random expansion gear appropriate for the given level range
 */
export function rollExpansionGear(minLevel = 1, maxLevel = 99) {
  const eligible = Object.values(EXPANSION_GEAR).filter(
    item => item.level >= minLevel && item.level <= maxLevel
  );

  if (eligible.length === 0) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}