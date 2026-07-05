export const GEAR_SLOTS = ['weapon', 'armor', 'accessory'];

export const RARITIES = {
  common:    { name: 'Common',    color: '#aaaaaa', statMultiplier: 1.0, priceMultiplier: 1 },
  uncommon:  { name: 'Uncommon',  color: '#1eff00', statMultiplier: 1.5, priceMultiplier: 3 },
  rare:      { name: 'Rare',      color: '#0070dd', statMultiplier: 2.5, priceMultiplier: 8 },
  epic:      { name: 'Epic',      color: '#a335ee', statMultiplier: 4.0, priceMultiplier: 20 },
  legendary: { name: 'Legendary', color: '#ff8000', statMultiplier: 7.0, priceMultiplier: 50 }
};

export const GEAR_TEMPLATES = {
  weapon: [
    { id: 'sword', name: 'Sword', baseStats: { attack: 3 } },
    { id: 'axe', name: 'Axe', baseStats: { attack: 4, critChance: 0.02 } },
    { id: 'mace', name: 'Mace', baseStats: { attack: 3, defense: 1 } },
    { id: 'dagger', name: 'Dagger', baseStats: { attack: 2, speed: 1, critChance: 0.05 } },
    { id: 'staff', name: 'Staff', baseStats: { attack: 2, magic: 3 } }
  ],
  armor: [
    { id: 'plate', name: 'Plate Armor', baseStats: { defense: 4, hp: 15 } },
    { id: 'chainmail', name: 'Chainmail', baseStats: { defense: 3, hp: 10, speed: 0.5 } },
    { id: 'leather', name: 'Leather Armor', baseStats: { defense: 2, speed: 1, critChance: 0.02 } },
    { id: 'robes', name: 'Robes', baseStats: { defense: 1, magic: 2, hp: 5 } }
  ],
  accessory: [
    { id: 'ring', name: 'Ring', baseStats: { critChance: 0.03, critMultiplier: 0.1 } },
    { id: 'amulet', name: 'Amulet', baseStats: { hp: 20, mp: 10 } },
    { id: 'charm', name: 'Charm', baseStats: { defense: 1, speed: 1 } },
    { id: 'talisman', name: 'Talisman', baseStats: { attack: 1, magic: 1, critChance: 0.02 } }
  ]
};

export const NAME_PREFIXES = {
  common: ['Rusty', 'Worn', 'Tattered', 'Crude', 'Simple'],
  uncommon: ['Sturdy', 'Fine', 'Sharpened', 'Reinforced', 'Quality'],
  rare: ['Savage', 'Mystic', 'Ancient', 'Enchanted', 'Blessed'],
  epic: ['Dark', 'Infernal', 'Arcane', 'Shadow', 'Void'],
  legendary: ['Celestial', 'Demonic', 'Eternal', 'Godslayer', 'World']
};

export const NAME_SUFFIXES = {
  common: ['of the Low', 'of Decay', 'of Dirt'],
  uncommon: ['of the Wolf', 'of the Bear', 'of Strength'],
  rare: ['of the Phoenix', 'of Thunder', 'of the Void'],
  epic: ['of Destruction', 'of the Abyss', 'of Oblivion'],
  legendary: ['of Infinity', 'of the Gods', 'of Creation']
};

export const LOOT_TABLES = {
  trash: { dropChance: 0.10, minRarity: 'common', maxRarity: 'uncommon' },
  mini_boss: { dropChance: 1.0, minRarity: 'uncommon', maxRarity: 'rare' },
  final_boss: { dropChance: 1.0, minRarity: 'rare', maxRarity: 'epic', epicChance: 0.05 }
};

export const SHOP_PRICES = {
  common: 25,
  uncommon: 75,
  rare: 200,
  epic: 500,
  legendary: 1500
};
