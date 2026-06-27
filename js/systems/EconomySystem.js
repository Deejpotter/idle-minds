import { GEAR_TEMPLATES, GEAR_SLOTS, RARITIES, NAME_PREFIXES, NAME_SUFFIXES, LOOT_TABLES, SHOP_PRICES } from '../data/gear.js';

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

  static deserialize(data) {
    const eco = new EconomySystem();
    if (data) {
      eco.gold = data.gold || 0;
      eco.inventory = data.inventory || [];
      eco.shopInventory = data.shopInventory || [];
    }
    return eco;
  }
}
