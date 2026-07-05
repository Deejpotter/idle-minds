/**
 * Skill Trees - Per-class skill progression
 * Each class has 3 branches: Offense, Defense, Utility
 */

export const SKILL_TREES = {
  warrior: {
    className: 'warrior',
    branches: {
      offense: {
        name: 'Berserker',
        description: 'Increase damage and crit chance',
        skills: [
          { id: 'w_off_1', name: 'Power Strike', cost: 1, requires: null, effect: { attack: 3 } },
          { id: 'w_off_2', name: 'Battle Fury', cost: 2, requires: 'w_off_1', effect: { critChance: 0.03 } },
          { id: 'w_off_3', name: 'Whirlwind', cost: 3, requires: 'w_off_2', effect: { attack: 8, critMultiplier: 1.1 } },
          { id: 'w_off_4', name: 'Berserker Rage', cost: 5, requires: 'w_off_3', isUltimate: true,
            effect: { attack: 15, critChance: 0.1, hp: -20 } }
        ]
      },
      defense: {
        name: 'Guardian',
        description: 'Increase defense and HP',
        skills: [
          { id: 'w_def_1', name: 'Shield Wall', cost: 1, requires: null, effect: { defense: 3 } },
          { id: 'w_def_2', name: 'Fortitude', cost: 2, requires: 'w_def_1', effect: { hp: 20 } },
          { id: 'w_def_3', name: 'Iron Skin', cost: 3, requires: 'w_def_2', effect: { defense: 8, hp: 30 } },
          { id: 'w_def_4', name: 'Last Stand', cost: 5, requires: 'w_def_3', isUltimate: true,
            effect: { defense: 20, hp: 80, deathResist: 0.25 } }
        ]
      },
      utility: {
        name: 'Tactician',
        description: 'Speed and team support',
        skills: [
          { id: 'w_utl_1', name: 'Battle Cry', cost: 1, requires: null, effect: { speed: 2 } },
          { id: 'w_utl_2', name: 'Inspire', cost: 2, requires: 'w_utl_1', effect: { teamAttack: 5 } },
          { id: 'w_utl_3', name: 'Quick Reflexes', cost: 3, requires: 'w_utl_2', effect: { speed: 5, dodgeChance: 0.05 } },
          { id: 'w_utl_4', name: 'Commander', cost: 5, requires: 'w_utl_3', isUltimate: true,
            effect: { teamAttack: 15, teamDefense: 10, speed: 5 } }
        ]
      }
    }
  },

  mage: {
    className: 'mage',
    branches: {
      offense: {
        name: 'Pyromancer',
        description: 'Fire magic and damage',
        skills: [
          { id: 'm_off_1', name: 'Fire Bolt', cost: 1, requires: null, effect: { magic: 3 } },
          { id: 'm_off_2', name: 'Flame Shield', cost: 2, requires: 'm_off_1', effect: { magic: 5, mpRegen: 0.5 } },
          { id: 'm_off_3', name: 'Meteor', cost: 3, requires: 'm_off_2', effect: { magic: 12, critChance: 0.05 } },
          { id: 'm_off_4', name: 'Inferno', cost: 5, requires: 'm_off_3', isUltimate: true,
            effect: { magic: 25, critMultiplier: 1.3, mp: 30 } }
        ]
      },
      defense: {
        name: 'Frost Mage',
        description: 'Ice magic and protection',
        skills: [
          { id: 'm_def_1', name: 'Frost Armor', cost: 1, requires: null, effect: { defense: 2, mp: 10 } },
          { id: 'm_def_2', name: 'Ice Barrier', cost: 2, requires: 'm_def_1', effect: { defense: 5, hp: 15 } },
          { id: 'm_def_3', name: 'Frozen Heart', cost: 3, requires: 'm_def_2', effect: { defense: 10, magic: 5, hp: 30 } },
          { id: 'm_def_4', name: 'Glacial Aegis', cost: 5, requires: 'm_def_3', isUltimate: true,
            effect: { defense: 25, hp: 60, reflectDamage: 0.15 } }
        ]
      },
      utility: {
        name: 'Arcanist',
        description: 'Mana efficiency and versatility',
        skills: [
          { id: 'm_utl_1', name: 'Meditation', cost: 1, requires: null, effect: { mp: 15, mpRegen: 0.3 } },
          { id: 'm_utl_2', name: 'Mana Flow', cost: 2, requires: 'm_utl_1', effect: { mpRegen: 1.0, mp: 20 } },
          { id: 'm_utl_3', name: 'Spell Echo', cost: 3, requires: 'm_utl_2', effect: { magic: 8, mpRegen: 0.5 } },
          { id: 'm_utl_4', name: 'Archmage', cost: 5, requires: 'm_utl_3', isUltimate: true,
            effect: { magic: 20, mp: 50, mpRegen: 2.0, critChance: 0.1 } }
        ]
      }
    }
  },

  paladin: {
    className: 'paladin',
    branches: {
      offense: {
        name: 'Crusader',
        description: 'Holy damage and smiting',
        skills: [
          { id: 'p_off_1', name: 'Holy Strike', cost: 1, requires: null, effect: { attack: 2, magic: 2 } },
          { id: 'p_off_2', name: 'Divine Judgment', cost: 2, requires: 'p_off_1', effect: { attack: 5, magic: 5 } },
          { id: 'p_off_3', name: 'Righteousness', cost: 3, requires: 'p_off_2', effect: { attack: 8, magic: 8, critChance: 0.05 } },
          { id: 'p_off_4', name: 'Avatar of Light', cost: 5, requires: 'p_off_3', isUltimate: true,
            effect: { attack: 15, magic: 15, critMultiplier: 1.3 } }
        ]
      },
      defense: {
        name: 'Sentinel',
        description: 'Protection and team defense',
        skills: [
          { id: 'p_def_1', name: 'Aegis', cost: 1, requires: null, effect: { defense: 4 } },
          { id: 'p_def_2', name: 'Guardian Angel', cost: 2, requires: 'p_def_1', effect: { defense: 8, teamDefense: 5 } },
          { id: 'p_def_3', name: 'Divine Shield', cost: 3, requires: 'p_def_2', effect: { defense: 15, hp: 40 } },
          { id: 'p_def_4', name: 'Unbreakable', cost: 5, requires: 'p_def_3', isUltimate: true,
            effect: { defense: 30, hp: 100, teamDefense: 20, deathResist: 0.5 } }
        ]
      },
      utility: {
        name: 'Healer',
        description: 'Healing and support',
        skills: [
          { id: 'p_utl_1', name: 'Lay on Hands', cost: 1, requires: null, effect: { healingPower: 1.15 } },
          { id: 'p_utl_2', name: 'Blessing', cost: 2, requires: 'p_utl_1', effect: { healingPower: 1.3, mp: 15 } },
          { id: 'p_utl_3', name: 'Divine Light', cost: 3, requires: 'p_utl_2', effect: { healingPower: 1.5, teamHp: 30 } },
          { id: 'p_utl_4', name: 'Resurrection', cost: 5, requires: 'p_utl_3', isUltimate: true,
            effect: { healingPower: 2.0, teamHp: 50, deathResist: 0.5 } }
        ]
      }
    }
  },

  priest: {
    className: 'priest',
    branches: {
      offense: {
        name: 'Shadow Priest',
        description: 'Shadow magic and damage',
        skills: [
          { id: 'pr_off_1', name: 'Shadow Bolt', cost: 1, requires: null, effect: { magic: 3 } },
          { id: 'pr_off_2', name: 'Mind Blast', cost: 2, requires: 'pr_off_1', effect: { magic: 6, critChance: 0.03 } },
          { id: 'pr_off_3', name: 'Vampiric Touch', cost: 3, requires: 'pr_off_2', effect: { magic: 10, lifesteal: 0.1 } },
          { id: 'pr_off_4', name: 'Void Embrace', cost: 5, requires: 'pr_off_3', isUltimate: true,
            effect: { magic: 20, critChance: 0.1, lifesteal: 0.25, mp: 40 } }
        ]
      },
      defense: {
        name: 'Light Weaver',
        description: 'Healing and protection',
        skills: [
          { id: 'pr_def_1', name: 'Heal', cost: 1, requires: null, effect: { healingPower: 1.2 } },
          { id: 'pr_def_2', name: 'Renew', cost: 2, requires: 'pr_def_1', effect: { healingPower: 1.4, mp: 20 } },
          { id: 'pr_def_3', name: 'Prayer of Healing', cost: 3, requires: 'pr_def_2', effect: { healingPower: 1.7, teamHp: 40 } },
          { id: 'pr_def_4', name: 'Divine Hymn', cost: 5, requires: 'pr_def_3', isUltimate: true,
            effect: { healingPower: 2.5, teamHp: 80, mp: 50 } }
        ]
      },
      utility: {
        name: 'Oracle',
        description: 'Mana and team support',
        skills: [
          { id: 'pr_utl_1', name: 'Inner Focus', cost: 1, requires: null, effect: { mpRegen: 0.5 } },
          { id: 'pr_utl_2', name: 'Spirit Link', cost: 2, requires: 'pr_utl_1', effect: { teamMpRegen: 1.0, mpRegen: 0.5 } },
          { id: 'pr_utl_3', name: 'Fortune', cost: 3, requires: 'pr_utl_2', effect: { teamCritChance: 0.05, mpRegen: 1.0 } },
          { id: 'pr_utl_4', name: 'Destiny Weaver', cost: 5, requires: 'pr_utl_3', isUltimate: true,
            effect: { teamCritChance: 0.1, teamCritMultiplier: 1.2, mpRegen: 2.0 } }
        ]
      }
    }
  },

  rogue: {
    className: 'rogue',
    branches: {
      offense: {
        name: 'Assassin',
        description: 'Critical strikes and burst damage',
        skills: [
          { id: 'r_off_1', name: 'Precision', cost: 1, requires: null, effect: { critChance: 0.05 } },
          { id: 'r_off_2', name: 'Backstab', cost: 2, requires: 'r_off_1', effect: { attack: 4, critMultiplier: 1.15 } },
          { id: 'r_off_3', name: 'Shadow Strike', cost: 3, requires: 'r_off_2', effect: { attack: 8, critChance: 0.1, critMultiplier: 1.3 } },
          { id: 'r_off_4', name: 'Death Mark', cost: 5, requires: 'r_off_3', isUltimate: true,
            effect: { attack: 15, critChance: 0.2, critMultiplier: 1.5 } }
        ]
      },
      defense: {
        name: 'Trickster',
        description: 'Evasion and survivability',
        skills: [
          { id: 'r_def_1', name: 'Evasion', cost: 1, requires: null, effect: { dodgeChance: 0.05 } },
          { id: 'r_def_2', name: 'Shadow Step', cost: 2, requires: 'r_def_1', effect: { dodgeChance: 0.1, speed: 3 } },
          { id: 'r_def_3', name: 'Blur', cost: 3, requires: 'r_def_2', effect: { dodgeChance: 0.15, defense: 5 } },
          { id: 'r_def_4', name: 'Phantom', cost: 5, requires: 'r_def_3', isUltimate: true,
            effect: { dodgeChance: 0.3, defense: 15, speed: 10 } }
        ]
      },
      utility: {
        name: 'Scoundrel',
        description: 'Gold and loot finding',
        skills: [
          { id: 'r_utl_1', name: 'Lucky Strike', cost: 1, requires: null, effect: { goldFind: 0.1 } },
          { id: 'r_utl_2', name: 'Treasure Sense', cost: 2, requires: 'r_utl_1', effect: { goldFind: 0.2, lootBonus: 0.05 } },
          { id: 'r_utl_3', name: 'Master Thief', cost: 3, requires: 'r_utl_2', effect: { goldFind: 0.4, lootBonus: 0.1, critChance: 0.05 } },
          { id: 'r_utl_4', name: 'Kingpin', cost: 5, requires: 'r_utl_3', isUltimate: true,
            effect: { goldFind: 0.8, lootBonus: 0.2, teamGoldFind: 0.3 } }
        ]
      }
    }
  }
};

/**
 * Calculate total skill points needed for a hero to reach a level
 * 1 skill point per level up (simplified)
 */
export function calculateSkillPointsForLevel(level) {
  return level;
}

/**
 * Check if a skill can be unlocked
 */
export function canUnlockSkill(skillTree, branchKey, skillIndex, unlockedSkills) {
  const branch = skillTree?.branches?.[branchKey];
  if (!branch || !branch.skills[skillIndex]) return false;

  const skill = branch.skills[skillIndex];

  // Check if already unlocked
  if (unlockedSkills.includes(skill.id)) return false;

  // Check prerequisite
  if (skill.requires && !unlockedSkills.includes(skill.requires)) return false;

  return true;
}

/**
 * Get all skills for a class
 */
export function getClassSkills(className) {
  return SKILL_TREES[className] || null;
}

/**
 * Apply skill effects to base stats
 */
export function applySkillEffects(baseStats, unlockedSkills, className) {
  const skillTree = SKILL_TREES[className];
  if (!skillTree) return baseStats;

  const modifiedStats = { ...baseStats };

  // Iterate through all branches and skills
  for (const branchKey in skillTree.branches) {
    const branch = skillTree.branches[branchKey];

    for (const skill of branch.skills) {
      if (!unlockedSkills.includes(skill.id)) continue;

      for (const [stat, value] of Object.entries(skill.effect)) {
        if (typeof value === 'number') {
          if (modifiedStats[stat] !== undefined) {
            modifiedStats[stat] += value;
          } else {
            modifiedStats[stat] = value;
          }
        } else if (typeof value === 'string' && value.includes('+')) {
          const percent = parseFloat(value) / 100;
          if (modifiedStats[stat] !== undefined) {
            modifiedStats[stat] *= (1 + percent);
          }
        }
      }
    }
  }

  return modifiedStats;
}

/**
 * Get skill point cost for respec
 */
export function getRespecCost(heroLevel) {
  return Math.floor(heroLevel * 10);
}

/**
 * Get total skill points spent
 */
export function getTotalSkillPointsSpent(unlockedSkills, className) {
  const skillTree = SKILL_TREES[className];
  if (!skillTree) return 0;

  let total = 0;

  for (const branchKey in skillTree.branches) {
    const branch = skillTree.branches[branchKey];
    for (const skill of branch.skills) {
      if (unlockedSkills.includes(skill.id)) {
        total += skill.cost;
      }
    }
  }

  return total;
}