/** Shared stat context for Hero.getEffectiveStats pipeline */
let statContext = null;

export function setStatContext(ctx) {
  statContext = ctx;
}

export function getStatContext() {
  return statContext;
}

export function clearStatContext() {
  statContext = null;
}
