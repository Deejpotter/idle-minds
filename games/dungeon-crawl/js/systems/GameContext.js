import { PrestigeSystem } from './PrestigeSystem.js';
import { FormationSystem } from './FormationSystem.js';
import { EventSystem } from './EventSystem.js';
import { setStatContext } from './StatContext.js';

export function createGameContext() {
  return {
    prestigeSystem: new PrestigeSystem(),
    formationSystem: new FormationSystem(),
    eventSystem: new EventSystem(),
  };
}

export function loadGameContext(ctx, saveData) {
  if (!ctx) return;
  ctx.prestigeSystem.load(saveData?.prestigeSystem);
  ctx.formationSystem.load(saveData?.formationSystem);
  ctx.eventSystem.load();
}

export function serializeGameContext(ctx) {
  if (!ctx) return { prestigeSystem: null, formationSystem: null };
  return {
    prestigeSystem: ctx.prestigeSystem.serialize(),
    formationSystem: ctx.formationSystem.serialize(),
  };
}

export function applyStatContext(ctx, party) {
  if (!ctx) return;
  setStatContext({
    party: party || [],
    prestigeSystem: ctx.prestigeSystem,
    formationSystem: ctx.formationSystem,
  });
}

export const EXPANSION_DUNGEON_IDS = ['fire_pit', 'frozen_crypt', 'dream_realm'];
