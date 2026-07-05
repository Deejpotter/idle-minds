/**
 * Expedition Definitions
 * Timed missions that heroes can be sent on for rewards
 */

export const EXPEDITION_TYPES = {
  gold: {
    id: 'gold',
    name: 'Treasure Hunt',
    description: 'Search for gold and valuables',
    icon: 'gold',
    color: '#ddaa00'
  },
  xp: {
    id: 'xp',
    name: 'Training Mission',
    description: 'Train heroes to gain experience',
    icon: 'xp',
    color: '#88cc88'
  },
  gear: {
    id: 'gear',
    name: 'Equipment Scavenging',
    description: 'Search for weapons and armor',
    icon: 'gear',
    color: '#8888cc'
  },
  materials: {
    id: 'materials',
    name: 'Resource Gathering',
    description: 'Gather materials for guild upgrades',
    icon: 'materials',
    color: '#cc88cc'
  }
};

export const EXPEDITION_DURATIONS = {
  short: {
    id: 'short',
    name: 'Quick Expedition',
    minutes: 15,
    riskMultiplier: 0.8,
    rewardMultiplier: 0.5
  },
  medium: {
    id: 'medium',
    name: 'Standard Expedition',
    minutes: 60,
    riskMultiplier: 1.0,
    rewardMultiplier: 1.0
  },
  long: {
    id: 'long',
    name: 'Extended Expedition',
    minutes: 240,
    riskMultiplier: 1.3,
    rewardMultiplier: 1.5
  },
  epic: {
    id: 'epic',
    name: 'Epic Journey',
    minutes: 480,
    riskMultiplier: 1.5,
    rewardMultiplier: 2.0
  }
};

export const EXPEDITION_DIFFICULTY = {
  easy: {
    id: 'easy',
    name: 'Easy',
    minPartyLevel: 1,
    maxPartyLevel: 5,
    successChance: 0.95,
    injuryChance: 0.05,
    deathChance: 0
  },
  normal: {
    id: 'normal',
    name: 'Normal',
    minPartyLevel: 3,
    maxPartyLevel: 10,
    successChance: 0.85,
    injuryChance: 0.15,
    deathChance: 0.01
  },
  hard: {
    id: 'hard',
    name: 'Hard',
    minPartyLevel: 8,
    maxPartyLevel: 20,
    successChance: 0.75,
    injuryChance: 0.25,
    deathChance: 0.05
  },
  expert: {
    id: 'expert',
    name: 'Expert',
    minPartyLevel: 15,
    maxPartyLevel: 50,
    successChance: 0.65,
    injuryChance: 0.35,
    deathChance: 0.1
  },
  master: {
    id: 'master',
    name: 'Master',
    minPartyLevel: 30,
    maxPartyLevel: 99,
    successChance: 0.55,
    injuryChance: 0.45,
    deathChance: 0.15
  }
};

export class ExpeditionDefinition {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description || '';
    this.type = config.type; // gold, xp, gear, materials
    this.duration = config.duration; // short, medium, long, epic
    this.difficulty = config.difficulty; // easy, normal, hard, expert, master
    this.minHeroes = config.minHeroes || 1;
    this.maxHeroes = config.maxHeroes || 5;
    this.requiredLevel = config.requiredLevel || 1;
    this.unlockedBy = config.unlockedBy || null; // dungeon or achievement
  }

  getDurationMinutes() {
    return EXPEDITION_DURATIONS[this.duration]?.minutes || 60;
  }

  getSuccessChance(partyLevel) {
    const diff = EXPEDITION_DIFFICULTY[this.difficulty];
    if (!diff) return 0.5;

    // Adjust success chance based on party level vs difficulty
    const levelDiff = partyLevel - diff.minPartyLevel;
    let chance = diff.successChance;

    if (levelDiff > 0) {
      chance += Math.min(levelDiff * 0.02, 0.2); // Up to +20% for overleveling
    } else if (levelDiff < 0) {
      chance += Math.max(levelDiff * 0.05, -0.3); // Up to -30% for underleveling
    }

    return Math.max(0.1, Math.min(0.99, chance));
  }

  calculateRewards(partyLevel, partySize) {
    const duration = EXPEDITION_DURATIONS[this.duration];
    const type = EXPEDITION_TYPES[this.type];
    const difficulty = EXPEDITION_DIFFICULTY[this.difficulty];

    const baseMultiplier = duration?.rewardMultiplier || 1.0;
    const riskMultiplier = duration?.riskMultiplier || 1.0;

    // Calculate base rewards
    let rewards = {
      gold: 0,
      xp: 0,
      gear: [],
      materials: []
    };

    switch (this.type) {
      case 'gold':
        rewards.gold = Math.floor(
          (20 + difficulty.minPartyLevel * 5) *
          baseMultiplier *
          (1 + partySize * 0.2)
        );
        break;

      case 'xp':
        rewards.xp = Math.floor(
          (50 + difficulty.minPartyLevel * 10) *
          baseMultiplier *
          (1 + partySize * 0.15)
        );
        break;

      case 'gear':
        // Chance for gear based on difficulty and party
        const gearChance = 0.3 * baseMultiplier * (1 + partySize * 0.1);
        const numGear = Math.floor(gearChance) + (Math.random() < (gearChance % 1) ? 1 : 0);
        for (let i = 0; i < numGear; i++) {
          rewards.gear.push({
            level: difficulty.minPartyLevel + Math.floor(Math.random() * 3),
            rarity: this._rollRarity(difficulty, baseMultiplier)
          });
        }
        break;

      case 'materials':
        const baseMaterials = 2 + Math.floor(difficulty.minPartyLevel / 5);
        const numMaterials = Math.floor(baseMaterials * baseMultiplier * (1 + partySize * 0.25));
        for (let i = 0; i < numMaterials; i++) {
          rewards.materials.push({
            type: this._rollMaterialType(),
            amount: 1 + Math.floor(Math.random() * 2)
          });
        }
        break;
    }

    return rewards;
  }

  _rollRarity(difficulty, multiplier) {
    const roll = Math.random();
    const bonus = (multiplier - 1) * 0.1;

    if (roll < 0.01 + bonus) return 'legendary';
    if (roll < 0.05 + bonus) return 'epic';
    if (roll < 0.15 + bonus) return 'rare';
    if (roll < 0.40 + bonus) return 'uncommon';
    return 'common';
  }

  _rollMaterialType() {
    const types = ['wood', 'stone', 'iron', 'cloth', 'leather', 'crystal'];
    return types[Math.floor(Math.random() * types.length)];
  }
}

// Predefined expeditions
export const PREDEFINED_EXPEDITIONS = [
  // Easy expeditions
  new ExpeditionDefinition({
    id: 'exp_gold_easy_1',
    name: 'Bandit Camp Raid',
    description: 'Raid a small bandit camp for quick gold.',
    type: 'gold',
    duration: 'short',
    difficulty: 'easy',
    minHeroes: 1,
    maxHeroes: 3,
    requiredLevel: 1
  }),
  new ExpeditionDefinition({
    id: 'exp_xp_easy_1',
    name: 'Wilderness Training',
    description: 'Train in the wilderness to gain experience.',
    type: 'xp',
    duration: 'medium',
    difficulty: 'easy',
    minHeroes: 1,
    maxHeroes: 5,
    requiredLevel: 1
  }),
  new ExpeditionDefinition({
    id: 'exp_gear_easy_1',
    name: 'Abandoned Armory',
    description: 'Search an abandoned armory for equipment.',
    type: 'gear',
    duration: 'medium',
    difficulty: 'easy',
    minHeroes: 2,
    maxHeroes: 3,
    requiredLevel: 3
  }),

  // Normal expeditions
  new ExpeditionDefinition({
    id: 'exp_gold_normal_1',
    name: 'Merchant Escort',
    description: 'Escort a wealthy merchant for a hefty reward.',
    type: 'gold',
    duration: 'long',
    difficulty: 'normal',
    minHeroes: 2,
    maxHeroes: 4,
    requiredLevel: 5
  }),
  new ExpeditionDefinition({
    id: 'exp_xp_normal_1',
    name: 'Monster Hunt',
    description: 'Hunt dangerous monsters for combat experience.',
    type: 'xp',
    duration: 'long',
    difficulty: 'normal',
    minHeroes: 3,
    maxHeroes: 5,
    requiredLevel: 5
  }),
  new ExpeditionDefinition({
    id: 'exp_materials_normal_1',
    name: 'Resource Gathering',
    description: 'Gather materials for guild upgrades.',
    type: 'materials',
    duration: 'epic',
    difficulty: 'normal',
    minHeroes: 2,
    maxHeroes: 5,
    requiredLevel: 5
  }),

  // Hard expeditions
  new ExpeditionDefinition({
    id: 'exp_gear_hard_1',
    name: 'Dragon\'s Hoard',
    description: 'Brave the lair of a dragon for legendary equipment.',
    type: 'gear',
    duration: 'epic',
    difficulty: 'hard',
    minHeroes: 4,
    maxHeroes: 5,
    requiredLevel: 10,
    unlockedBy: { type: 'dungeon', id: 'goblin_caverns' }
  }),
  new ExpeditionDefinition({
    id: 'exp_gold_hard_1',
    name: 'Royal Treasury',
    description: 'Infiltrate a royal treasury for immense wealth.',
    type: 'gold',
    duration: 'epic',
    difficulty: 'hard',
    minHeroes: 4,
    maxHeroes: 5,
    requiredLevel: 10,
    unlockedBy: { type: 'dungeon', id: 'undead_crypt' }
  })
];

// Helper to get available expeditions for a party
export function getAvailableExpeditions(partyLevel, partySize, completedDungeons = {}) {
  return PREDEFINED_EXPEDITIONS.filter(exp => {
    // Check level requirement
    if (exp.requiredLevel > partyLevel) return false;

    // Check party size
    if (exp.minHeroes > partySize || exp.maxHeroes < partySize) return false;

    // Check unlock requirement
    if (exp.unlockedBy) {
      if (exp.unlockedBy.type === 'dungeon') {
        if (!completedDungeons[exp.unlockedBy.id]) return false;
      }
    }

    return true;
  });
}

// Helper to format duration for display
export function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  } else {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
}
