/**
 * EventSystem - Determines active weekly event and applies multipliers
 * Pure system, no Phaser dependencies
 */

import { getActiveEventForDate } from '../data/events.js';

export class EventSystem {
  constructor() {
    this.currentEvent = null;
    this.refreshEvent();
  }

  /**
   * Refresh the active event based on current date
   */
  refreshEvent() {
    this.currentEvent = getActiveEventForDate(new Date());
    return this.currentEvent;
  }

  /**
   * Get the currently active event (or null)
   */
  getActiveEvent() {
    return this.currentEvent;
  }

  /**
   * Get gold multiplier (1.0 if no event)
   */
  getGoldMultiplier() {
    if (!this.currentEvent || !this.currentEvent.effects) return 1.0;
    return this.currentEvent.effects.goldMultiplier || 1.0;
  }

  /**
   * Get XP multiplier (1.0 if no event)
   */
  getXPMultiplier() {
    if (!this.currentEvent || !this.currentEvent.effects) return 1.0;
    return this.currentEvent.effects.xpMultiplier || 1.0;
  }

  /**
   * Get skill point multiplier
   */
  getSkillPointMultiplier() {
    if (!this.currentEvent || !this.currentEvent.effects) return 1.0;
    return this.currentEvent.effects.skillPointMultiplier || 1.0;
  }

  /**
   * Get loot drop chance bonus (added to base chance)
   */
  getLootChanceBonus() {
    if (!this.currentEvent || !this.currentEvent.effects) return 0;
    return this.currentEvent.effects.lootChanceBonus || 0;
  }

  /**
   * Get enemy HP multiplier
   */
  getEnemyHpMultiplier() {
    if (!this.currentEvent || !this.currentEvent.effects) return 1.0;
    return this.currentEvent.effects.enemyHpMultiplier || 1.0;
  }

  /**
   * Check if an event with the given ID is currently active
   */
  hasEvent(eventId) {
    return this.currentEvent && this.currentEvent.id === eventId;
  }

  serialize() {
    return {
      version: 1
      // Event is deterministic from date — no state to save
    };
  }

  load() {
    // Re-derive event on load
    this.refreshEvent();
  }
}