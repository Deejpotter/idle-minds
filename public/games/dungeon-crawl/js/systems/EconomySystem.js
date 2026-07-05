import { GEAR_TEMPLATES, GEAR_SLOTS, RARITIES, NAME_PREFIXES, NAME_SUFFIXES, LOOT_TABLES, SHOP_PRICES } from '../data/gear.js';
import { IdleProgressSystem } from './IdleProgressSystem.js';

let gearIdCounter = 0;

function generateGearId() {
  return 'gear_' + (++gearIdCounter).toString(16).padStart(8, '0');
}

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function scaleStats(baseStats, multiplier) {
  const scaled = {};
  for (const [key, value] of Object.entries(baseStats)) {
    scaled[key] = key.includes('Chance') || key.includes('Multiplier')
      ? Math.round(value * multiplier * 100) / 100
      : Math.round(value * multiplier);
  }
  return scaled;
}

export class EconomySystem {
  constructor() {
    this.gold = 0;
    this.inventory = [];
    this.shopInventory = [];
    this.idleProgressSystem = new IdleProgressSystem();
    this.materials = {}; // Guild upgrade materials
    this.passiveIncomeHistory = []; // Track passive income for analytics
  }

  addGold(amount) {
    this.gold += amount;
    return this.gold;
  }

  spendGold(amount) {
    if (this.gold < amount) return false;
    this.gold -= amount;
    return true;
  }

  getGold() {
    return this.gold;
  }

  rollLoot(roomType) {
    const table = LOOT_TABLES[roomType];
    if (!table) return null;
    if (Math.random() > table.dropChance) return null;

    let rarity = table.minRarity;
    if (roomType === 'final_boss' && Math.random() < (table.epicChance || 0)) {
      rarity = 'epic';
    } else {
      const rarityKeys = Object.keys(RARITIES);
      const minIdx = rarityKeys.indexOf(table.minRarity);
      const maxIdx = rarityKeys.indexOf(table.maxRarity);
      const roll = minIdx + Math.floor(Math.random() * (maxIdx - minIdx + 1));
      rarity = rarityKeys[roll];
    }

    return this.generateGear(rarity);
  }

  generateGear(rarity = 'common', slot = null) {
    if (!slot) slot = randomFromArray(GEAR_SLOTS);
    const template = randomFromArray(GEAR_TEMPLATES[slot]);
    const rarityData = RARITIES[rarity];
    const prefix = randomFromArray(NAME_PREFIXES[rarity]);
    const suffix = randomFromArray(NAME_SUFFIXES[rarity]);

    return {
      id: generateGearId(),
      templateId: template.id,
      name: `${prefix} ${template.name} ${suffix}`,
      slot: slot,
      rarity: rarity,
      statBonus: scaleStats(template.baseStats, rarityData.statMultiplier),
      sellPrice: Math.floor(SHOP_PRICES[rarity] * 0.25),
      buyPrice: SHOP_PRICES[rarity]
    };
  }

  addToInventory(item) {
    this.inventory.push(item);
  }

  removeFromInventory(itemId) {
    const idx = this.inventory.findIndex(i => i.id === itemId);
    if (idx === -1) return null;
    return this.inventory.splice(idx, 1)[0];
  }

  sellGear(itemId) {
    const item = this.removeFromInventory(itemId);
    if (!item) return false;
    this.addGold(item.sellPrice);
    return item;
  }

  refreshShop(guildLevel = 1) {
    this.shopInventory = [];
    const rarityPool = ['common', 'common', 'uncommon', 'uncommon', 'rare', 'rare'];
    if (guildLevel >= 3) {
      rarityPool.push('rare', 'epic');
    }
    if (guildLevel >= 5) {
      rarityPool.push('epic', 'legendary');
    }

    for (let i = 0; i < 6; i++) {
      const rarity = randomFromArray(rarityPool);
      this.shopInventory.push(this.generateGear(rarity));
    }
    return this.shopInventory;
  }

  buyGear(itemId) {
    const idx = this.shopInventory.findIndex(i => i.id === itemId);
    if (idx === -1) return null;
    const item = this.shopInventory[idx];
    if (!this.spendGold(item.buyPrice)) return null;
    this.shopInventory.splice(idx, 1);
    this.addToInventory(item);
    return item;
  }

  getInventoryBySlot(slot) {
    return this.inventory.filter(i => i.slot === slot);
  }

  serialize() {
    return {
      gold: this.gold,
      inventory: this.inventory,
      shopInventory: this.shopInventory
    };
  }

  // === Passive Gold Generation ===

  /**
   * Calculate passive gold generation per minute
   * @param {Object} guildState - Guild state with level and upgrades
   * @returns {number} Gold per minute
   */
  calculatePassiveGoldPerMinute(guildState = { level: 1, upgrades: {} }) {
    const baseRate = 1; // 1 gold per minute base
    const guildLevel = guildState.level || 1;
    const upgrades = guildState.upgrades || {};

    // Guild level bonus: +0.5 gold per level
    let goldPerMinute = baseRate + (guildLevel - 1) * 0.5;

    // Gold generation upgrade bonus: +10% per level
    if (upgrades.goldGeneration) {
      goldPerMinute *= (1 + upgrades.goldGeneration * 0.1);
    }

    // Guild hall upgrade bonus: +20% per level
    if (upgrades.guildHall) {
      goldPerMinute *= (1 + upgrades.guildHall * 0.2);
    }

    // Cap at 100 gold per minute to prevent excessive generation
    return Math.min(goldPerMinute, 100);
  }

  /**
   * Calculate total passive gold for a given time period
   * @param {number} minutes - Time period in minutes
   * @param {Object} guildState - Guild state
   * @returns {number} Total gold generated
   */
  calculatePassiveGold(minutes, guildState) {
    const goldPerMinute = this.calculatePassiveGoldPerMinute(guildState);
    return Math.floor(goldPerMinute * minutes);
  }

  /**
   * Apply offline/idle gold generation
   * @param {number} offlineMinutes - Minutes offline
   * @param {Object} guildState - Guild state
   * @returns {Object} Result with gold earned and rate info
   */
  applyOfflineGold(offlineMinutes, guildState) {
    const goldPerMinute = this.calculatePassiveGoldPerMinute(guildState);
    const goldEarned = this.calculatePassiveGold(offlineMinutes, guildState);

    // Add gold to economy
    this.addGold(goldEarned);

    // Track for analytics
    this.trackPassiveIncome(goldEarned, offlineMinutes, goldPerMinute);

    return {
      goldEarned,
      goldPerMinute,
      offlineMinutes,
      newTotal: this.gold
    };
  }

  /**
   * Track passive income for analytics
   * @param {number} goldEarned
   * @param {number} minutes
   * @param {number} rate
   */
  trackPassiveIncome(goldEarned, minutes, rate) {
    this.passiveIncomeHistory.push({
      timestamp: Date.now(),
      goldEarned,
      minutes,
      rate
    });

    // Keep only last 100 entries
    if (this.passiveIncomeHistory.length > 100) {
      this.passiveIncomeHistory.shift();
    }
  }

  /**
   * Get passive income statistics
   * @returns {Object} Stats object
   */
  getPassiveIncomeStats() {
    if (this.passiveIncomeHistory.length === 0) {
      return {
        totalGold: 0,
        totalMinutes: 0,
        averageRate: 0,
        entries: 0
      };
    }

    const totalGold = this.passiveIncomeHistory.reduce((sum, entry) => sum + entry.goldEarned, 0);
    const totalMinutes = this.passiveIncomeHistory.reduce((sum, entry) => sum + entry.minutes, 0);

    return {
      totalGold,
      totalMinutes,
      averageRate: totalMinutes > 0 ? totalGold / totalMinutes : 0,
      entries: this.passiveIncomeHistory.length
    };
  }

  // === Material Management ===

  /**
   * Add materials to inventory
   * @param {string} type - Material type
   * @param {number} amount - Amount to add
   */
  addMaterial(type, amount) {
    if (!this.materials[type]) {
      this.materials[type] = 0;
    }
    this.materials[type] += amount;
  }

  /**
   * Remove materials from inventory
   * @param {string} type - Material type
   * @param {number} amount - Amount to remove
   * @returns {boolean} Success
   */
  removeMaterial(type, amount) {
    if (!this.materials[type] || this.materials[type] < amount) {
      return false;
    }
    this.materials[type] -= amount;
    return true;
  }

  /**
   * Get material count
   * @param {string} type - Material type (or null for all)
   * @returns {number|Object} Count or all materials
   */
  getMaterials(type = null) {
    if (type) {
      return this.materials[type] || 0;
    }
    return { ...this.materials };
  }

  // === Enhanced Serialization ===

  serialize() {
    return {
      gold: this.gold,
      inventory: this.inventory,
      shopInventory: this.shopInventory,
      materials: this.materials,
      passiveIncomeHistory: this.passiveIncomeHistory,
      idleProgressSystem: this.idleProgressSystem ? this.idleProgressSystem.serialize() : null
    };
  }

  static deserialize(data) {
    const eco = new EconomySystem();
    if (data) {
      eco.gold = data.gold || 0;
      eco.inventory = data.inventory || [];
      eco.shopInventory = data.shopInventory || [];
      eco.materials = data.materials || {};
      eco.passiveIncomeHistory = data.passiveIncomeHistory || [];

      if (data.idleProgressSystem) {
        eco.idleProgressSystem.load(data.idleProgressSystem);
      }
    }
    return eco;
  }
}
