/**
 * AutoEquipSystem - Picks the best gear from inventory for a hero based on class priorities
 * Pure logic — no Phaser dependencies, easy to test.
 */

const CLASS_STAT_WEIGHTS = {
  warrior: { attack: 3, defense: 2, hp: 2, critChance: 1.5, magic: 0.5, mp: 0.2, speed: 1 },
  mage:    { magic: 3, mp: 2, attack: 0.5, defense: 0.5, hp: 1, critChance: 1, speed: 1 },
  paladin: { defense: 2, attack: 1.5, magic: 1.5, hp: 2, critChance: 1, speed: 0.5, mp: 1 },
  priest:  { magic: 2, mp: 2.5, hp: 1.5, defense: 1, attack: 0.5, critChance: 1, speed: 1 },
  rogue:   { attack: 2, critChance: 2.5, speed: 2, hp: 1, defense: 0.5, magic: 0.5, mp: 0.5 }
};

const SLOT_BONUS = {
  weapon: 1.0,
  armor: 0.8,
  accessory: 0.6
};

/**
 * Score an item for a hero based on weighted stat bonuses
 */
function scoreItem(hero, item) {
  if (!item || !item.statBonus) return 0;
  const weights = CLASS_STAT_WEIGHTS[hero.className] || CLASS_STAT_WEIGHTS.warrior;
  let score = 0;

  for (const [stat, value] of Object.entries(item.statBonus)) {
    const weight = weights[stat] !== undefined ? weights[stat] : 0.5;
    score += value * weight;
  }

  // Slot weighting — primary slots valued higher
  score *= (SLOT_BONUS[item.slot] || 0.7);

  // Rarity bonus
  const rarityMultiplier = {
    common: 1.0, uncommon: 1.15, rare: 1.35, epic: 1.6, legendary: 2.0
  };
  score *= (rarityMultiplier[item.rarity] || 1.0);

  return score;
}

/**
 * Find the best item in inventory for a given hero + slot
 */
function findBestItem(hero, slot, inventory) {
  if (!inventory || inventory.length === 0) return null;

  let best = null;
  let bestScore = -Infinity;

  for (const item of inventory) {
    if (item.slot !== slot) continue;

    // Skip if already equipped
    if (hero.gear && hero.gear[slot] && hero.gear[slot].id === item.id) continue;

    const score = scoreItem(hero, item);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return best;
}

/**
 * Auto-equip best gear for a hero from inventory.
 * Returns an array of swap operations to be executed by the caller.
 *
 * Each swap operation: { slot, oldItem, newItem }
 * The caller is responsible for actually swapping inventory ↔ gear.
 *
 * @param {Object} hero - Hero instance with .className and .gear
 * @param {Object} economy - Economy instance with .inventory array
 * @returns {Array} swap operations
 */
export function autoEquipBest(hero, economy) {
  if (!hero || !economy || !economy.inventory) return [];

  const slots = ['weapon', 'armor', 'accessory'];
  const swaps = [];

  for (const slot of slots) {
    const candidate = findBestItem(hero, slot, economy.inventory);
    if (!candidate) continue;

    const current = hero.gear[slot];
    const newScore = scoreItem(hero, candidate);
    const currentScore = current ? scoreItem(hero, current) : -Infinity;

    // Only swap if strictly better
    if (newScore > currentScore) {
      swaps.push({
        slot,
        oldItem: current || null,
        newItem: candidate
      });
    }
  }

  return swaps;
}

/**
 * Score item for hero — exposed for UI tooltips
 */
export function getItemScoreForHero(hero, item) {
  return scoreItem(hero, item);
}

/**
 * Get a list of inventory items ranked for a hero (best first)
 */
export function rankInventoryForHero(hero, inventory, slot = null) {
  if (!inventory) return [];

  const items = slot
    ? inventory.filter(i => i.slot === slot)
    : [...inventory];

  return items
    .map(item => ({ item, score: scoreItem(hero, item) }))
    .sort((a, b) => b.score - a.score)
    .map(x => x.item);
}