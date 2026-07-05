export const CLASSES = {
  paladin: {
    name: 'Paladin',
    role: 'tank',
    primaryStat: 'strength',
    baseStats: {
      hp: 170, mp: 60, attack: 14, magic: 5,
      defense: 20, speed: 5, critChance: 0.05, critMultiplier: 1.5
    },
    growthPerLevel: {
      hp: 20, mp: 5, attack: 2, magic: 1,
      defense: 3, speed: 0.5, critChance: 0.005, critMultiplier: 0.02
    },
    abilities: [
      {
        id: 'basic_attack',
        name: 'Basic Attack',
        type: 'physical',
        power: 1.0,
        cooldown: 0,
        currentCooldown: 0,
        manaCost: 0,
        targeting: 'enemy_threat',
        description: 'A basic melee attack'
      },
      {
        id: 'holy_shield',
        name: 'Holy Shield',
        type: 'heal_self',
        power: 1.2,
        cooldown: 3,
        currentCooldown: 0,
        manaCost: 5,
        targeting: 'self',
        description: 'Raise your shield, blocking damage and healing yourself'
      }
    ],
    talents: [
      { level: 5, ability: { id: 'divine_smite', name: 'Divine Smite', type: 'damage', power: 2.0, cooldown: 4, currentCooldown: 0, manaCost: 10, targeting: 'enemy_threat', description: 'Smite an enemy with divine power' } },
      { level: 10, ability: { id: 'holy_light', name: 'Holy Light', type: 'heal_self', power: 2.0, cooldown: 5, currentCooldown: 0, manaCost: 15, targeting: 'self', description: 'Bask in holy light, restoring massive HP' } },
      { level: 15, ability: { id: 'shield_wall', name: 'Shield Wall', type: 'heal_self', power: 3.0, cooldown: 8, currentCooldown: 0, manaCost: 20, targeting: 'self', description: 'Raise an impenetrable shield, fully healing yourself' } }
    ]
  },

  warrior: {
    name: 'Warrior',
    role: 'tank',
    primaryStat: 'strength',
    baseStats: {
      hp: 190, mp: 30, attack: 16, magic: 3,
      defense: 16, speed: 4, critChance: 0.08, critMultiplier: 1.5
    },
    growthPerLevel: {
      hp: 22, mp: 3, attack: 3, magic: 0,
      defense: 2, speed: 0.3, critChance: 0.008, critMultiplier: 0.02
    },
    abilities: [
      {
        id: 'basic_attack',
        name: 'Basic Attack',
        type: 'physical',
        power: 1.0,
        cooldown: 0,
        currentCooldown: 0,
        manaCost: 0,
        targeting: 'enemy_threat',
        description: 'A powerful melee swing'
      },
      {
        id: 'shield_slam',
        name: 'Shield Slam',
        type: 'damage',
        power: 2.0,
        cooldown: 4,
        currentCooldown: 0,
        manaCost: 8,
        targeting: 'enemy_threat',
        description: 'Slam your shield into the enemy for massive damage'
      }
    ],
    talents: [
      { level: 5, ability: { id: 'whirlwind', name: 'Whirlwind', type: 'aoe_damage', power: 1.2, cooldown: 3, currentCooldown: 0, manaCost: 10, targeting: 'all_enemies', description: 'Spin and hit all enemies' } },
      { level: 10, ability: { id: 'battle_cry', name: 'Battle Cry', type: 'heal_self', power: 1.5, cooldown: 5, currentCooldown: 0, manaCost: 12, targeting: 'self', description: 'Rally yourself with a mighty war cry' } },
      { level: 15, ability: { id: 'berserk', name: 'Berserk', type: 'damage', power: 3.5, cooldown: 8, currentCooldown: 0, manaCost: 15, targeting: 'enemy_threat', description: 'Go berserk for devastating damage' } }
    ]
  },

  mage: {
    name: 'Mage',
    role: 'dps',
    primaryStat: 'intelligence',
    baseStats: {
      hp: 90, mp: 100, attack: 5, magic: 20,
      defense: 6, speed: 6, critChance: 0.1, critMultiplier: 1.8
    },
    growthPerLevel: {
      hp: 10, mp: 10, attack: 1, magic: 4,
      defense: 1, speed: 0.5, critChance: 0.01, critMultiplier: 0.03
    },
    abilities: [
      {
        id: 'basic_attack',
        name: 'Arcane Bolt',
        type: 'magic',
        power: 1.0,
        cooldown: 0,
        currentCooldown: 0,
        manaCost: 0,
        targeting: 'lowest_hp_enemy',
        description: 'Hurl a bolt of arcane energy'
      },
      {
        id: 'fireball',
        name: 'Fireball',
        type: 'aoe_magic',
        power: 1.5,
        cooldown: 3,
        currentCooldown: 0,
        manaCost: 12,
        targeting: 'all_enemies',
        description: 'Hurl a fireball that damages all enemies'
      }
    ],
    talents: [
      { level: 5, ability: { id: 'lightning', name: 'Chain Lightning', type: 'aoe_magic', power: 1.8, cooldown: 4, currentCooldown: 0, manaCost: 15, targeting: 'all_enemies', description: 'Lightning bounces between enemies' } },
      { level: 10, ability: { id: 'arcane_blast', name: 'Arcane Blast', type: 'magic', power: 3.0, cooldown: 5, currentCooldown: 0, manaCost: 20, targeting: 'lowest_hp_enemy', description: 'A devastating arcane explosion' } },
      { level: 15, ability: { id: 'meteor', name: 'Meteor', type: 'aoe_magic', power: 2.5, cooldown: 8, currentCooldown: 0, manaCost: 30, targeting: 'all_enemies', description: 'Call down a meteor on all enemies' } }
    ]
  },

  priest: {
    name: 'Priest',
    role: 'healer',
    primaryStat: 'wisdom',
    baseStats: {
      hp: 100, mp: 120, attack: 6, magic: 12,
      defense: 8, speed: 5, critChance: 0.05, critMultiplier: 1.5
    },
    growthPerLevel: {
      hp: 12, mp: 12, attack: 1, magic: 3,
      defense: 1, speed: 0.4, critChance: 0.005, critMultiplier: 0.02
    },
    abilities: [
      {
        id: 'smite',
        name: 'Smite',
        type: 'magic',
        power: 0.8,
        cooldown: 0,
        currentCooldown: 0,
        manaCost: 0,
        targeting: 'lowest_hp_enemy',
        description: 'Smite an enemy with holy energy'
      },
      {
        id: 'holy_light',
        name: 'Holy Light',
        type: 'heal_ally',
        power: 1.5,
        cooldown: 2,
        currentCooldown: 0,
        manaCost: 10,
        targeting: 'lowest_hp_ally',
        description: 'Heal the most injured ally'
      }
    ],
    talents: [
      { level: 5, ability: { id: 'heal_circle', name: 'Healing Circle', type: 'heal_self', power: 1.0, cooldown: 4, currentCooldown: 0, manaCost: 15, targeting: 'self', description: 'Channel a healing aura that restores the priest' } },
      { level: 10, ability: { id: 'smite_plus', name: 'Holy Smite', type: 'magic', power: 2.0, cooldown: 3, currentCooldown: 0, manaCost: 12, targeting: 'lowest_hp_enemy', description: 'A devastating holy strike' } },
      { level: 15, ability: { id: 'resurrection', name: 'Greater Heal', type: 'heal_ally', power: 3.0, cooldown: 6, currentCooldown: 0, manaCost: 25, targeting: 'lowest_hp_ally', description: 'A massive heal on the most injured ally' } }
    ]
  },

  rogue: {
    name: 'Rogue',
    role: 'dps',
    primaryStat: 'agility',
    baseStats: {
      hp: 110, mp: 50, attack: 18, magic: 3,
      defense: 8, speed: 8, critChance: 0.2, critMultiplier: 2.0
    },
    growthPerLevel: {
      hp: 12, mp: 4, attack: 3, magic: 0,
      defense: 1, speed: 0.6, critChance: 0.015, critMultiplier: 0.04
    },
    abilities: [
      {
        id: 'basic_attack',
        name: 'Quick Strike',
        type: 'physical',
        power: 0.8,
        cooldown: 0,
        currentCooldown: 0,
        manaCost: 0,
        targeting: 'lowest_hp_enemy',
        description: 'A fast strike against the weakest enemy'
      },
      {
        id: 'backstab',
        name: 'Backstab',
        type: 'damage',
        power: 2.5,
        cooldown: 3,
        currentCooldown: 0,
        manaCost: 8,
        targeting: 'lowest_hp_enemy',
        description: 'Strike from the shadows for massive crit damage'
      }
    ],
    talents: [
      { level: 5, ability: { id: 'poison', name: 'Poison Strike', type: 'damage', power: 1.8, cooldown: 2, currentCooldown: 0, manaCost: 6, targeting: 'lowest_hp_enemy', description: 'Strike with a poisoned blade' } },
      { level: 10, ability: { id: 'shadow_step', name: 'Shadow Step', type: 'damage', power: 3.0, cooldown: 4, currentCooldown: 0, manaCost: 10, targeting: 'lowest_hp_enemy', description: 'Teleport behind and strike for massive damage' } },
      { level: 15, ability: { id: 'assassinate', name: 'Assassinate', type: 'damage', power: 5.0, cooldown: 8, currentCooldown: 0, manaCost: 20, targeting: 'lowest_hp_enemy', description: 'Execute a weakened enemy instantly' } }
    ]
  }
};

export const HERO_NAMES = {
  paladin: ['Auriel', 'Theron', 'Lyria', 'Bran'],
  warrior: ['Gromm', 'Kael', 'Thrain', 'Durgan'],
  mage: ['Zael', 'Morwen', 'Elara', 'Thalindra'],
  priest: ['Elara', 'Seraphina', 'Aldric', 'Mira'],
  rogue: ['Shadow', 'Vex', 'Kira', 'Finn']
};
