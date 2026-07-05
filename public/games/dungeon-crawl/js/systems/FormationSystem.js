/**
 * FormationSystem - Manages hero positioning and formation-based combat bonuses
 * Front row takes more damage, back row deals more damage
 */

export const FORMATION_POSITIONS = {
  front: {
    id: 'front',
    name: 'Front Row',
    description: 'Tanks and melee - takes more damage, protects back row',
    defenseMultiplier: 1.5,
    hpMultiplier: 1.2,
    damageMultiplier: 1.0,
    accuracyPenalty: 0,
    protectAlly: true,
    preferredRoles: ['tank', 'melee', 'warrior', 'paladin'],
    color: '#cc6644'
  },
  middle: {
    id: 'middle',
    name: 'Middle Row',
    description: 'Balanced position - moderate offense and defense',
    defenseMultiplier: 1.0,
    hpMultiplier: 1.0,
    damageMultiplier: 1.0,
    accuracyPenalty: 0,
    protectAlly: false,
    preferredRoles: ['hybrid', 'support'],
    color: '#aaaacc'
  },
  back: {
    id: 'back',
    name: 'Back Row',
    description: 'Ranged and magic - deals more damage but is vulnerable',
    defenseMultiplier: 0.7,
    hpMultiplier: 0.85,
    damageMultiplier: 1.3,
    accuracyPenalty: 0.05,
    protectAlly: false,
    preferredRoles: ['ranged', 'magic', 'mage', 'priest', 'rogue'],
    color: '#6688cc'
  }
};

export const FORMATION_PRESETS = {
  balanced: {
    id: 'balanced',
    name: 'Balanced Formation',
    description: 'Even split across rows',
    positions: {
      0: 'front',
      1: 'front',
      2: 'middle',
      3: 'back',
      4: 'back'
    }
  },
  defensive: {
    id: 'defensive',
    name: 'Defensive Wall',
    description: 'Maximum protection for back row',
    positions: {
      0: 'front',
      1: 'front',
      2: 'front',
      3: 'middle',
      4: 'back'
    }
  },
  aggressive: {
    id: 'aggressive',
    name: 'Aggressive Push',
    description: 'Maximum damage output',
    positions: {
      0: 'front',
      1: 'middle',
      2: 'back',
      3: 'back',
      4: 'back'
    }
  },
  protective: {
    id: 'protective',
    name: 'Bodyguard Formation',
    description: 'Tanks in front, damage dealers behind',
    positions: {
      0: 'front',
      1: 'front',
      2: 'middle',
      3: 'back',
      4: 'back'
    }
  }
};

export class FormationSystem {
  constructor() {
    this.formation = {}; // heroId -> position
    this.preset = 'balanced';
  }

  /**
   * Assign position to a hero
   * @param {string} heroId
   * @param {string} position - front, middle, or back
   */
  setHeroPosition(heroId, position) {
    if (!Object.keys(FORMATION_POSITIONS).includes(position)) {
      return false;
    }
    this.formation[heroId] = position;
    return true;
  }

  /**
   * Get hero's current position
   */
  getHeroPosition(heroId) {
    return this.formation[heroId] || 'middle';
  }

  /**
   * Apply a formation preset to the current party
   */
  applyPreset(presetId, heroes) {
    const preset = FORMATION_PRESETS[presetId];
    if (!preset) return false;

    this.preset = presetId;

    heroes.forEach((hero, index) => {
      const position = preset.positions[index] || 'middle';
      this.setHeroPosition(hero.id, position);
    });

    return true;
  }

  /**
   * Auto-assign positions based on hero roles
   */
  autoAssignPositions(heroes) {
    const rolePriority = {
      tank: 'front',
      warrior: 'front',
      paladin: 'front',
      rogue: 'middle',
      mage: 'back',
      priest: 'back',
      ranger: 'back'
    };

    // Sort heroes by role priority
    const sortedHeroes = [...heroes].sort((a, b) => {
      const aPos = rolePriority[a.className] || 'middle';
      const bPos = rolePriority[b.className] || 'middle';
      const order = { front: 0, middle: 1, back: 2 };
      return order[aPos] - order[bPos];
    });

    // Assign based on slot limits (2 front, 2 middle, 2 back)
    const limits = { front: 2, middle: 2, back: 2 };
    const counts = { front: 0, middle: 0, back: 0 };

    sortedHeroes.forEach(hero => {
      const preferred = rolePriority[hero.className] || 'middle';
      let position = preferred;

      // If preferred position is full, find alternative
      if (counts[preferred] >= limits[preferred]) {
        // Find next available position
        if (counts.front < limits.front) position = 'front';
        else if (counts.middle < limits.middle) position = 'middle';
        else position = 'back';
      }

      this.setHeroPosition(hero.id, position);
      counts[position]++;
    });

    return true;
  }

  /**
   * Calculate position-based stat modifications for a hero
   * @param {Object} hero - The hero object
   * @param {Object} baseStats - Hero's effective stats
   * @returns {Object} Modified stats based on formation position
   */
  getPositionModifiers(hero, baseStats) {
    const position = this.getHeroPosition(hero.id);
    const posConfig = FORMATION_POSITIONS[position];

    if (!posConfig) return baseStats;

    const modifiedStats = { ...baseStats };

    // Apply defense multiplier
    if (modifiedStats.defense !== undefined) {
      modifiedStats.defense = Math.floor(modifiedStats.defense * posConfig.defenseMultiplier);
    }

    // Apply HP multiplier
    if (modifiedStats.hp !== undefined) {
      modifiedStats.hp = Math.floor(modifiedStats.hp * posConfig.hpMultiplier);
    }

    // Apply damage multiplier
    if (modifiedStats.attack !== undefined && position === 'back') {
      modifiedStats.attack = Math.floor(modifiedStats.attack * posConfig.damageMultiplier);
    }

    if (modifiedStats.magic !== undefined && position === 'back') {
      modifiedStats.magic = Math.floor(modifiedStats.magic * posConfig.damageMultiplier);
    }

    return modifiedStats;
  }

  /**
   * Check if a hero in this position protects allies
   */
  doesHeroProtect(heroId) {
    const position = this.getHeroPosition(heroId);
    return FORMATION_POSITIONS[position]?.protectAlly || false;
  }

  /**
   * Get heroes in a specific position
   */
  getHeroesInPosition(heroes, position) {
    return heroes.filter(h => this.getHeroPosition(h.id) === position);
  }

  /**
   * Calculate damage taken with formation considerations
   * (front row intercepts attacks for back row)
   */
  calculateDamageWithFormation(attacker, target, baseDamage, heroes) {
    const targetPosition = this.getHeroPosition(target.id);

    // If target is in back row, check if front row heroes are alive
    if (targetPosition === 'back') {
      const frontRowHeroes = this.getHeroesInPosition(heroes, 'front').filter(h => h.isAlive());

      // 50% chance to hit back row through front row
      if (frontRowHeroes.length > 0 && Math.random() < 0.5) {
        // Redirect to a random front row hero
        const redirectedTarget = frontRowHeroes[Math.floor(Math.random() * frontRowHeroes.length)];
        const modifiers = this.getPositionModifiers(redirectedTarget, redirectedTarget.getEffectiveStats());
        const reducedDamage = Math.floor(baseDamage * 0.7); // Reduced damage through front line
        return {
          target: redirectedTarget,
          damage: Math.max(1, reducedDamage - modifiers.defense)
        };
      }
    }

    // Normal damage calculation
    const modifiers = this.getPositionModifiers(target, target.getEffectiveStats());
    return {
      target: target,
      damage: Math.max(1, baseDamage - modifiers.defense)
    };
  }

  /**
   * Get formation summary for UI
   */
  getFormationSummary(heroes) {
    const front = this.getHeroesInPosition(heroes, 'front').map(h => h.name);
    const middle = this.getHeroesInPosition(heroes, 'middle').map(h => h.name);
    const back = this.getHeroesInPosition(heroes, 'back').map(h => h.name);

    return {
      preset: this.preset,
      front,
      middle,
      back,
      totalHeroes: heroes.length
    };
  }

  serialize() {
    return {
      formation: { ...this.formation },
      preset: this.preset,
      version: 1
    };
  }

  load(data) {
    if (!data) return;
    if (data.formation) this.formation = { ...data.formation };
    if (data.preset) this.preset = data.preset;
  }
}