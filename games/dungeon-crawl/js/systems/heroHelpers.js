import { calculateSkillPointsForLevel, getTotalSkillPointsSpent } from '../data/skillTrees.js';
import { calculateActiveSynergies } from '../data/synergies.js';

export function getAvailableSkillPoints(hero) {
  const earned = calculateSkillPointsForLevel(hero.level);
  const spent = getTotalSkillPointsSpent(hero.unlockedSkills || [], hero.className);
  return Math.max(0, earned - spent + (hero.bonusSkillPoints || 0));
}

export function getPartySynergySummary(party) {
  const classes = party.filter(Boolean).map(h => h.className);
  const active = calculateActiveSynergies(classes);
  if (active.length === 0) return 'No active synergies';
  return active.map(s => s.name).join(', ');
}
