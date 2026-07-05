/**
 * PrestigeSystem - Ascension mechanics
 * Heroes can prestige at max level for permanent bonuses
 */

export const MAX_LEVEL = 50;
export const PRESTIGE_LEVEL_RESET = 1;

export const PRESTIGE_UPGRADES = {
  // === Combat Upgrades ===
  combatPower: {
    id: 'combatPower',
    name: 'Combat Mastery',
    description: '+5% damage per rank',
    maxRank: 10,
    costPerRank: 1,
    effect: { type: 'damageMultiplier', valuePerRank: 0.05 }
  },
  criticalStrike: {
    id: 'criticalStrike',
    name: 'Critical Strike',
    description: '+3% crit chance per rank',
    maxRank: 10,
    costPerRank: 1,
    effect: { type: 'critChance', valuePerRank: 0.03 }
  },
  healthBoost: {
    id: 'healthBoost',
    name: 'Vitality',
    description: '+10 max HP per rank',
    maxRank: 10,
    costPerRank: 1,
    effect: { type: 'hp', valuePerRank: 10 }
  },
  manaBoost: {
    id: 'manaBoost',
    name: 'Arcane Power',
    description: '+5 max MP per rank',
    maxRank: 10,
    costPerRank: 1,
    effect: { type: 'mp', valuePerRank: 5 }
  },

  // === Economy Upgrades ===
  goldFind: {
    id: 'goldFind',
    name: 'Treasure Hunter',
    description: '+10% gold found per rank',
    maxRank: 10,
    costPerRank: 1,
    effect: { type: 'goldMultiplier', valuePerRank: 0.1 }
  },
  xpBoost: {
    id: 'xpBoost',
    name: 'Quick Learner',
    description: '+15% XP gained per rank',
    maxRank: 10,
    costPerRank: 1,
    effect: { type: 'xpMultiplier', valuePerRank: 0.15 }
  },

  // === Quality of Life ===
  expeditionSlots: {
    id: 'expeditionSlots',
    name: 'Expedition Coordinator',
    description: '+1 expedition slot per rank',
    maxRank: 3,
    costPerRank: 2,
    effect: { type: 'expeditionSlots', valuePerRank: 1 }
  },
  offlineCap: {
    id: 'offlineCap',
    name: 'Extended Absence',
    description: '+2 hours offline cap per rank',
    maxRank: 4,
    costPerRank: 2,
    effect: { type: 'offlineCapHours', valuePerRank: 2 }
  },
  deathResist: {
    id: 'deathResist',
    name: 'Second Chance',
    description: '+5% death resistance per rank',
    maxRank: 10,
    costPerRank: 1,
    effect: { type: 'deathResistance', valuePerRank: 0.05 }
  }
};

/**
 * Calculate ascension points earned from a prestige
 * Based on hero level achieved and any bonuses
 */
export function calculateAscensionPoints(hero) {
  if (!hero || hero.level < MAX_LEVEL) return 0;

  // Base: 1 point per prestige
  let points = 1;

  // Bonus: 1 point per 10 levels above MAX_LEVEL (capped)
  const overLevel = Math.min(hero.level - MAX_LEVEL, 50);
  points += Math.floor(overLevel / 10);

  // Bonus: Equipped gear bonuses
  let gearBonus = 0;
  if (hero.gear) {
    Object.values(hero.gear).forEach(item => {
      if (item && item.rarity) {
        const rarityBonus = {
          common: 0,
          uncommon: 0,
          rare: 0.2,
          epic: 0.5,
          legendary: 1.0
        };
        gearBonus += rarityBonus[item.rarity] || 0;
      }
    });
  }

  points += Math.floor(gearBonus);

  return Math.max(1, points);
}

/**
 * Calculate total prestige rank for a hero
 */
export function calculatePrestigeRank(hero) {
  if (!hero || !hero.prestige) return 0;
  return hero.prestige.times || 0;
}

export class PrestigeSystem {
  constructor() {
    this.globalPrestigePoints = 0; // Shared across all heroes
    this.globalUpgrades = {}; // upgradeId -> rank
  }

  /**
   * Check if a hero can prestige
   */
  canPrestige(hero) {
    return hero && hero.level >= MAX_LEVEL && hero.isAlive();
  }

  /**
   * Perform prestige for a hero
   * Returns ascension points gained
   */
  prestigeHero(hero) {
    if (!this.canPrestige(hero)) return 0;

    const pointsEarned = calculateAscensionPoints(hero);

    // Reset hero level and XP
    hero.level = PRESTIGE_LEVEL_RESET;
    hero.xp = 0;
    hero.xpToNext = 100;

    // Recalculate base stats (level 1 stats)
    hero.baseStats = hero.calculateBaseStats();

    // Restore HP/MP to full
    const effectiveStats = hero.getEffectiveStats();
    hero.currentHp = effectiveStats.hp;
    hero.currentMp = effectiveStats.mp;

    // Increment prestige rank
    if (!hero.prestige) {
      hero.prestige = { times: 0, pointsEarned: 0 };
    }
    hero.prestige.times++;
    hero.prestige.pointsEarned += pointsEarned;

    // Add to global pool
    this.globalPrestigePoints += pointsEarned;

    return pointsEarned;
  }

  /**
   * Purchase a prestige upgrade
   * @param {string} upgradeId - The upgrade ID from PRESTIGE_UPGRADES
   * @returns {boolean} Success
   */
  purchaseUpgrade(upgradeId) {
    const upgrade = PRESTIGE_UPGRADES[upgradeId];
    if (!upgrade) return false;

    const currentRank = this.globalUpgrades[upgradeId] || 0;

    // Check max rank
    if (currentRank >= upgrade.maxRank) return false;

    // Check points
    if (this.globalPrestigePoints < upgrade.costPerRank) return false;

    // Spend points and increment rank
    this.globalPrestigePoints -= upgrade.costPerRank;
    this.globalUpgrades[upgradeId] = currentRank + 1;

    return true;
  }

  /**
   * Get current rank of an upgrade
   */
  getUpgradeRank(upgradeId) {
    return this.globalUpgrades[upgradeId] || 0;
  }

  /**
   * Calculate total effect value for an upgrade type
   */
  getUpgradeEffect(upgradeId) {
    const upgrade = PRESTIGE_UPGRADES[upgradeId];
    if (!upgrade) return 0;

    const rank = this.getUpgradeRank(upgradeId);
    return rank * upgrade.effect.valuePerRank;
  }

  /**
   * Apply all prestige bonuses to a hero's effective stats
   */
  applyPrestigeBonuses(baseStats, hero) {
    const modified = { ...baseStats };

    // Combat Mastery
    const combatMult = 1 + this.getUpgradeEffect('combatPower');
    if (modified.attack) modified.attack *= combatMult;
    if (modified.magic) modified.magic *= combatMult;

    // Crit Chance
    const critBonus = this.getUpgradeEffect('criticalStrike');
    modified.critChance = (modified.critChance || 0) + critBonus;

    // Health
    const hpBoost = this.getUpgradeEffect('healthBoost');
    if (modified.hp) modified.hp += hpBoost;

    // Mana
    const mpBoost = this.getUpgradeEffect('manaBoost');
    if (modified.mp) modified.mp += mpBoost;

    // Death Resistance (tracked separately)
    modified.deathResistance = this.getUpgradeEffect('deathResist');

    return modified;
  }

  /**
   * Get gold multiplier from prestige upgrades
   */
  getGoldMultiplier() {
    return 1 + this.getUpgradeEffect('goldFind');
  }

  /**
   * Get XP multiplier from prestige upgrades
   */
  getXPMultiplier() {
    return 1 + this.getUpgradeEffect('xpBoost');
  }

  /**
   * Get additional expedition slots
   */
  getExpeditionSlots() {
    return this.getUpgradeEffect('expeditionSlots');
  }

  /**
   * Get offline cap hours bonus
   */
  getOfflineCapHours() {
    return 8 + this.getUpgradeEffect('offlineCap'); // Base 8 hours + bonus
  }

  /**
   * Get available upgrades for UI display
   */
  getAvailableUpgrades() {
    return Object.values(PRESTIGE_UPGRADES).map(upgrade => {
      const currentRank = this.getUpgradeRank(upgrade.id);
      const canPurchase = currentRank < upgrade.maxRank &&
        this.globalPrestigePoints >= upgrade.costPerRank;
      const isMaxed = currentRank >= upgrade.maxRank;

      return {
        ...upgrade,
        currentRank,
        canPurchase,
        isMaxed
      };
    });
  }

  serialize() {
    return {
      globalPrestigePoints: this.globalPrestigePoints,
      globalUpgrades: { ...this.globalUpgrades },
      version: 1
    };
  }

  load(data) {
    if (!data) return;
    if (data.globalPrestigePoints !== undefined) {
      this.globalPrestigePoints = data.globalPrestigePoints;
    }
    if (data.globalUpgrades) {
      this.globalUpgrades = { ...data.globalUpgrades };
    }
  }
}