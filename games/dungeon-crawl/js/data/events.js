/**
 * Weekly Events - Rotating modifiers that affect all gameplay
 * Day-of-week determines which event is active (deterministic, no server)
 */

export const EVENTS = {
  gold_rush: {
    id: 'gold_rush',
    name: 'Gold Rush',
    description: 'All gold rewards doubled',
    icon: '◆',
    color: '#ddaa00',
    effects: {
      goldMultiplier: 2.0,
      xpMultiplier: 1.0
    }
  },
  xp_fiesta: {
    id: 'xp_fiesta',
    name: 'XP Fiesta',
    description: 'All experience gains doubled',
    icon: '★',
    color: '#88cc88',
    effects: {
      goldMultiplier: 1.0,
      xpMultiplier: 2.0
    }
  },
  boss_rush: {
    id: 'boss_rush',
    name: 'Boss Rush',
    description: 'Enemies have more HP but drop more loot',
    icon: '⚔',
    color: '#cc6644',
    effects: {
      goldMultiplier: 1.5,
      xpMultiplier: 1.5,
      enemyHpMultiplier: 1.5,
      lootChanceBonus: 0.2
    }
  },
  training_week: {
    id: 'training_week',
    name: 'Training Week',
    description: 'Skill points gained doubled on level up',
    icon: '✦',
    color: '#88aacc',
    effects: {
      goldMultiplier: 1.0,
      xpMultiplier: 1.0,
      skillPointMultiplier: 2.0
    }
  }
};

export const EVENT_ROTATION = ['gold_rush', 'xp_fiesta', 'boss_rush', 'training_week'];

/**
 * Get the active event for a given date (or now)
 */
export function getActiveEventForDate(date = new Date()) {
  // 0 = Sunday, 1 = Monday, etc.
  const dayIndex = date.getDay();
  const eventId = EVENT_ROTATION[dayIndex % EVENT_ROTATION.length];
  return EVENTS[eventId] || null;
}

/**
 * Get the human-readable day name for an event
 */
export function getEventDayName(date = new Date()) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Get all events for display
 */
export function getAllEvents() {
  return Object.values(EVENTS);
}