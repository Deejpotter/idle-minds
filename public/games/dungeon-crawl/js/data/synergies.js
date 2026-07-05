/**
 * Class Synergies and Combos
 * Bonuses granted when certain class combinations are present in the party
 */

export const SYNERGIES = {
  holy_alliance: {
    id: 'holy_alliance',
    name: 'Holy Alliance',
    description: 'Paladin and Priest working together',
    classes: ['paladin', 'priest'],
    minCount: 2,
    bonuses: { healingPower: 1.25, defense: 5 },
    color: '#ffdd66'
  },
  arcane_scholars: {
    id: 'arcane_scholars',
    name: 'Arcane Scholars',
    description: 'Mage and Priest share mystical knowledge',
    classes: ['mage', 'priest'],
    minCount: 2,
    bonuses: { magic: 8, mpRegen: 1.5 },
    color: '#aa88ff'
  },
  shadow_pact: {
    id: 'shadow_pact',
    name: 'Shadow Pact',
    description: 'Rogue and Priest walk the line between light and dark',
    classes: ['rogue', 'priest'],
    minCount: 2,
    bonuses: { critChance: 0.05, speed: 2 },
    color: '#888899'
  },
  front_line: {
    id: 'front_line',
    name: 'Front Line',
    description: 'Paladin and Warrior hold the line',
    classes: ['paladin', 'warrior'],
    minCount: 2,
    bonuses: { defense: 10, hp: 30 },
    color: '#ddaa88'
  },
  blade_dancers: {
    id: 'blade_dancers',
    name: 'Blade Dancers',
    description: 'Warrior and Rogue fight as one',
    classes: ['warrior', 'rogue'],
    minCount: 2,
    bonuses: { attack: 8, critChance: 0.05 },
    color: '#dd6644'
  },
  mystic_strike: {
    id: 'mystic_strike',
    name: 'Mystic Strike',
    description: 'Mage and Rogue combine magic and steel',
    classes: ['mage', 'rogue'],
    minCount: 2,
    bonuses: { magic: 5, attack: 5, critMultiplier: 1.1 },
    color: '#cc88aa'
  },
  balanced_party: {
    id: 'balanced_party',
    name: 'Balanced Party',
    description: 'Three different classes bring balance',
    classes: null,
    minCount: 3,
    requiresUnique: true,
    bonuses: { hp: 15, attack: 3, defense: 3 },
    color: '#88aacc'
  },
  rainbow_squad: {
    id: 'rainbow_squad',
    name: 'Rainbow Squad',
    description: 'All 5 classes together - ultimate diversity',
    classes: ['paladin', 'warrior', 'mage', 'priest', 'rogue'],
    minCount: 5,
    requiresUnique: true,
    bonuses: {
      hp: 50, mp: 30, attack: 10, magic: 10,
      defense: 10, speed: 5, critChance: 0.05, critMultiplier: 1.2
    },
    color: '#ffaa44'
  },
  twin_blades: {
    id: 'twin_blades',
    name: 'Twin Blades',
    description: 'Two of the same combat class',
    classes: null,
    minCount: 2,
    sameClass: true,
    bonuses: { attack: 3, defense: 3 },
    color: '#888899'
  },
  triple_threat: {
    id: 'triple_threat',
    name: 'Triple Threat',
    description: 'Three of the same class',
    classes: null,
    minCount: 3,
    sameClass: true,
    bonuses: { attack: 5, defense: 5, diminishing: true },
    color: '#777788'
  }
};

export function calculateActiveSynergies(partyClasses) {
  if (!partyClasses || partyClasses.length === 0) return [];

  const activeSynergies = [];
  const classCounts = {};

  partyClasses.forEach(cls => {
    classCounts[cls] = (classCounts[cls] || 0) + 1;
  });

  for (const synergy of Object.values(SYNERGIES)) {
    if (synergy.requiresUnique) {
      const uniqueClasses = Object.keys(classCounts);
      if (uniqueClasses.length >= synergy.minCount) {
        if (synergy.classes && synergy.classes.length > 0) {
          const hasAllClasses = synergy.classes.every(cls =>
            partyClasses.includes(cls)
          );
          if (hasAllClasses) {
            activeSynergies.push({ ...synergy, memberCount: uniqueClasses.length });
          }
        } else {
          activeSynergies.push({ ...synergy, memberCount: uniqueClasses.length });
        }
      }
    } else if (synergy.sameClass) {
      const maxSameClassCount = Math.max(...Object.values(classCounts));
      if (maxSameClassCount >= synergy.minCount) {
        activeSynergies.push({ ...synergy, memberCount: maxSameClassCount });
      }
    } else if (synergy.classes) {
      const presentClasses = synergy.classes.filter(cls => partyClasses.includes(cls));
      if (presentClasses.length >= synergy.minCount) {
        activeSynergies.push({ ...synergy, memberCount: presentClasses.length });
      }
    }
  }

  return activeSynergies;
}

export function applySynergyBonuses(baseStats, activeSynergies) {
  if (!activeSynergies || activeSynergies.length === 0) {
    return { ...baseStats };
  }

  const modifiedStats = { ...baseStats };

  for (const synergy of activeSynergies) {
    if (!synergy.bonuses) continue;

    for (const [stat, bonus] of Object.entries(synergy.bonuses)) {
      if (stat === 'diminishing') continue;

      if (typeof bonus === 'number') {
        modifiedStats[stat] = (modifiedStats[stat] || 0) + bonus;
      } else if (typeof bonus === 'string' && bonus.includes('+')) {
        const percent = parseFloat(bonus) / 100;
        if (modifiedStats[stat]) {
          modifiedStats[stat] *= (1 + percent);
        }
      }
    }
  }

  return modifiedStats;
}

export function getAllSynergies() {
  return Object.values(SYNERGIES);
}

export function getSynergySummary(partyClasses) {
  const active = calculateActiveSynergies(partyClasses);
  if (active.length === 0) return 'No active synergies';
  return active.map(s => s.name).join(', ');
}