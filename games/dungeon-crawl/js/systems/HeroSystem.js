import { CLASSES } from '../data/classes.js';

let nextId = 0;

function generateId() {
  nextId++;
  return 'hero_' + nextId.toString(16).padStart(8, '0');
}

export class Hero {
  constructor(className, level = 1, name = 'Hero') {
    const classDef = CLASSES[className];
    if (!classDef) {
      throw new Error(`Unknown class: ${className}`);
    }

    this.id = generateId();
    this.name = name;
    this.className = className;
    this.level = level;
    this.xp = 0;
    this.xpToNext = this.getXpToNext();

    this.baseStats = {};
    const stats = Object.keys(classDef.baseStats);
    for (const stat of stats) {
      this.baseStats[stat] = classDef.baseStats[stat] + classDef.growthPerLevel[stat] * (level - 1);
    }

    this.gear = { weapon: null, armor: null, accessory: null };

    this.abilities = classDef.abilities.map(ability => ({ ...ability }));

    this.currentHp = this.baseStats.hp;
    this.currentMp = this.baseStats.mp;
  }

  getEffectiveStats() {
    const stats = { ...this.baseStats };
    const gearSlots = Object.keys(this.gear);
    for (const slot of gearSlots) {
      const item = this.gear[slot];
      if (item && item.statBonus) {
        const bonusStats = Object.keys(item.statBonus);
        for (const stat of bonusStats) {
          if (stats[stat] !== undefined) {
            stats[stat] += item.statBonus[stat];
          } else {
            stats[stat] = item.statBonus[stat];
          }
        }
      }
    }
    return stats;
  }

  getXpToNext() {
    return Math.floor(100 * Math.pow(this.level, 1.5));
  }

  gainXP(amount) {
    this.xp += amount;
    while (this.xp >= this.getXpToNext()) {
      this.xp -= this.getXpToNext();
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    const classDef = CLASSES[this.className];
    const growth = classDef.growthPerLevel;
    const stats = Object.keys(growth);
    for (const stat of stats) {
      this.baseStats[stat] += growth[stat];
    }
    this.xpToNext = this.getXpToNext();
    this.currentHp = this.getEffectiveStats().hp;
    this.currentMp = this.getEffectiveStats().mp;

    if (classDef.talents) {
      for (const talent of classDef.talents) {
        if (talent.level === this.level) {
          const alreadyHas = this.abilities.some(a => a.id === talent.ability.id);
          if (!alreadyHas) {
            this.abilities.push({ ...talent.ability });
          }
        }
      }
    }
  }

  equip(slot, gearItem) {
    if (!(slot in this.gear)) {
      throw new Error(`Invalid gear slot: ${slot}`);
    }
    const old = this.gear[slot];
    this.gear[slot] = gearItem;
    return old;
  }

  unequip(slot) {
    if (!(slot in this.gear)) {
      throw new Error(`Invalid gear slot: ${slot}`);
    }
    const item = this.gear[slot];
    this.gear[slot] = null;
    return item;
  }

  isAlive() {
    return this.currentHp > 0;
  }

  takeDamage(amount) {
    this.currentHp = Math.max(0, this.currentHp - amount);
  }

  heal(amount) {
    const effective = this.getEffectiveStats();
    this.currentHp = Math.min(effective.hp, this.currentHp + amount);
  }

  useMana(cost) {
    if (this.currentMp < cost) {
      return false;
    }
    this.currentMp -= cost;
    return true;
  }

  // === Idle & Expedition Methods ===

  /**
   * Check if hero is available for expeditions
   * @param {ExpeditionSystem} expeditionSystem - The expedition system
   * @returns {boolean}
   */
  isAvailableForExpedition(expeditionSystem) {
    // Hero must be alive
    if (!this.isAlive()) return false;

    // Hero must not be on an expedition
    if (expeditionSystem && expeditionSystem.isHeroOnExpedition(this.id)) return false;

    return true;
  }

  /**
   * Apply idle XP gain
   * @param {number} xpAmount - Amount of XP to gain
   */
  applyIdleXP(xpAmount) {
    if (xpAmount <= 0) return;
    this.gainXP(xpAmount);
  }

  /**
   * Apply expedition rewards to hero
   * @param {Object} expeditionResult - Result from expedition completion
   */
  applyExpeditionRewards(expeditionResult) {
    if (!expeditionResult || !expeditionResult.heroOutcomes) return;

    const outcome = expeditionResult.heroOutcomes.find(o => o.heroId === this.id);
    if (!outcome) return;

    // Apply XP
    if (outcome.xpGained > 0) {
      this.applyIdleXP(outcome.xpGained);
    }

    // Apply injuries (reduce current HP to 1)
    if (outcome.injured && this.isAlive()) {
      this.currentHp = 1;
    }

    // Handle death
    if (outcome.died) {
      this.currentHp = 0;
    }
  }

  /**
   * Get hero status summary for UI
   * @param {ExpeditionSystem} expeditionSystem - Optional expedition system
   * @returns {Object} Status summary
   */
  getStatusSummary(expeditionSystem = null) {
    const summary = {
      id: this.id,
      name: this.name,
      className: this.className,
      level: this.level,
      isAlive: this.isAlive(),
      currentHp: this.currentHp,
      currentMp: this.currentMp,
      hpPercent: this.getEffectiveStats().hp > 0 ? this.currentHp / this.getEffectiveStats().hp : 0,
      onExpedition: expeditionSystem ? expeditionSystem.isHeroOnExpedition(this.id) : false,
      available: true
    };

    summary.available = summary.isAlive && !summary.onExpedition;

    return summary;
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      className: this.className,
      level: this.level,
      xp: this.xp,
      xpToNext: this.xpToNext,
      baseStats: { ...this.baseStats },
      gear: { ...this.gear },
      abilities: this.abilities.map(a => ({ ...a })),
      currentHp: this.currentHp,
      currentMp: this.currentMp
    };
  }

  static deserialize(data) {
    const hero = new Hero(data.className, 1, data.name);
    hero.id = data.id;
    hero.level = data.level;
    hero.xp = data.xp;
    hero.xpToNext = data.xpToNext;
    hero.baseStats = { ...data.baseStats };
    hero.gear = { ...data.gear };
    hero.abilities = data.abilities.map(a => ({ ...a }));
    hero.currentHp = data.currentHp;
    hero.currentMp = data.currentMp;
    return hero;
  }

export function createStarterHero() {
  const hero = new Hero('paladin', 1, 'Auriel');

  hero.equip('weapon', {
    id: 'rusty_sword',
    name: 'Rusty Sword',
    slot: 'weapon',
    rarity: 'common',
    statBonus: { attack: 2 },
    sellPrice: 5
  });

  hero.equip('armor', {
    id: 'torn_shirt',
    name: 'Torn Shirt',
    slot: 'armor',
    rarity: 'common',
    statBonus: { defense: 1, hp: 10 },
    sellPrice: 5
  });

  return hero;
}
