/** Guild upgrade definitions — purchased with gold + materials */
export const GUILD_UPGRADES = [
  {
    id: 'goldGeneration',
    name: 'Gold Ledger',
    description: '+10% passive gold per level',
    maxLevel: 5,
    goldCost: (level) => 100 + level * 75,
    materials: (level) => ({ wood: 2 + level, stone: 1 + level }),
  },
  {
    id: 'guildHall',
    name: 'Guild Hall',
    description: '+20% passive gold per level',
    maxLevel: 5,
    goldCost: (level) => 200 + level * 100,
    materials: (level) => ({ iron: 2 + level, crystal: 1 }),
  },
];

export function getUpgradeLevel(guild, upgradeId) {
  return guild?.upgrades?.[upgradeId] || 0;
}

export function canPurchaseUpgrade(guild, economy, def) {
  const level = getUpgradeLevel(guild, def.id);
  if (level >= def.maxLevel) return { ok: false, reason: 'Max level reached' };

  const goldCost = def.goldCost(level);
  if (economy.getGold() < goldCost) {
    return { ok: false, reason: `Need ${goldCost} gold` };
  }

  const mats = def.materials(level);
  for (const [type, amount] of Object.entries(mats)) {
    if (economy.getMaterials(type) < amount) {
      return { ok: false, reason: `Need ${amount} ${type}` };
    }
  }

  return { ok: true, goldCost, materials: mats };
}

export function purchaseUpgrade(guild, economy, def) {
  const check = canPurchaseUpgrade(guild, economy, def);
  if (!check.ok) return check;

  economy.spendGold(check.goldCost);
  for (const [type, amount] of Object.entries(check.materials)) {
    economy.removeMaterial(type, amount);
  }

  if (!guild.upgrades) guild.upgrades = {};
  guild.upgrades[def.id] = getUpgradeLevel(guild, def.id) + 1;

  return { ok: true, newLevel: guild.upgrades[def.id] };
}
