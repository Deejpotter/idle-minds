/**
 * ExpeditionSystem - Manages timed hero expeditions
 * Handles starting, tracking, and completing expeditions
 */

import {
  PREDEFINED_EXPEDITIONS,
  EXPEDITION_DURATIONS,
  EXPEDITION_DIFFICULTY,
  EXPEDITION_TYPES,
  getAvailableExpeditions
} from '../data/expeditions.js';

export class ExpeditionSystem {
  constructor() {
    this.activeExpeditions = new Map(); // expeditionId -> expedition instance
    this.completedExpeditions = []; // Array of completed expedition results
    this.maxConcurrentExpeditions = 2; // Base number of concurrent expeditions
  }

  /**
   * Start a new expedition
   * @param {string} expeditionDefId - The expedition definition ID
   * @param {Array} heroes - Array of hero objects
   * @param {Object} gameState - Current game state
   * @returns {Object} Result object with success flag and expedition data or error
   */
  startExpedition(expeditionDefId, heroes, gameState) {
    // Validate expedition definition
    const expeditionDef = PREDEFINED_EXPEDITIONS.find(e => e.id === expeditionDefId);
    if (!expeditionDef) {
      return { success: false, error: 'Invalid expedition' };
    }

    // Check if we have room for more expeditions
    if (this.activeExpeditions.size >= this.getMaxExpeditions(gameState)) {
      return { success: false, error: 'Maximum number of active expeditions reached' };
    }

    // Validate heroes
    if (!heroes || heroes.length < expeditionDef.minHeroes) {
      return { success: false, error: `Requires at least ${expeditionDef.minHeroes} heroes` };
    }

    if (heroes.length > expeditionDef.maxHeroes) {
      return { success: false, error: `Cannot have more than ${expeditionDef.maxHeroes} heroes` };
    }

    // Check if heroes are already on expedition
    for (const hero of heroes) {
      if (this.isHeroOnExpedition(hero.id)) {
        return { success: false, error: `Hero ${hero.name} is already on an expedition` };
      }
    }

    // Calculate party level (average)
    const partyLevel = Math.floor(heroes.reduce((sum, h) => sum + h.level, 0) / heroes.length);

    // Create expedition instance
    const expeditionId = this.generateExpeditionId();
    const durationMs = expeditionDef.getDurationMinutes() * 60 * 1000;

    const expedition = {
      id: expeditionId,
      definitionId: expeditionDefId,
      name: expeditionDef.name,
      type: expeditionDef.type,
      difficulty: expeditionDef.difficulty,
      duration: expeditionDef.duration,
      durationMs: durationMs,
      startTime: Date.now(),
      endTime: Date.now() + durationMs,
      heroes: heroes.map(h => ({ id: h.id, name: h.name, level: h.level })),
      partyLevel: partyLevel,
      partySize: heroes.length,
      status: 'active', // active, completed, failed, cancelled
      progress: 0, // 0-100
      result: null // Will contain rewards or failure reason
    };

    // Add to active expeditions
    this.activeExpeditions.set(expeditionId, expedition);

    return { success: true, expedition };
  }

  /**
   * Update all active expeditions - call this regularly (e.g., every second)
   * @returns {Array} Array of newly completed expeditions
   */
  update() {
    const now = Date.now();
    const completed = [];

    for (const [id, expedition] of this.activeExpeditions) {
      if (expedition.status !== 'active') continue;

      // Calculate progress
      const elapsed = now - expedition.startTime;
      expedition.progress = Math.min(100, Math.floor((elapsed / expedition.durationMs) * 100));

      // Check if completed
      if (now >= expedition.endTime) {
        const result = this.completeExpedition(id);
        if (result) {
          completed.push(result);
        }
      }
    }

    return completed;
  }

  /**
   * Complete an expedition and calculate results
   * @param {string} expeditionId
   * @returns {Object|null} Completed expedition data or null if not found
   */
  completeExpedition(expeditionId) {
    const expedition = this.activeExpeditions.get(expeditionId);
    if (!expedition) return null;

    // Get expedition definition
    const expeditionDef = PREDEFINED_EXPEDITIONS.find(e => e.id === expedition.definitionId);
    if (!expeditionDef) return null;

    // Calculate success chance
    const successChance = expeditionDef.getSuccessChance(expedition.partyLevel);
    const roll = Math.random();
    const success = roll < successChance;

    // Get difficulty for injury/death checks
    const difficulty = EXPEDITION_DIFFICULTY[expeditionDef.difficulty];

    // Prepare result
    const result = {
      success: success,
      rewards: null,
      heroOutcomes: [],
      message: ''
    };

    if (success) {
      // Calculate rewards
      result.rewards = expeditionDef.calculateRewards(expedition.partyLevel, expedition.partySize);
      result.message = `Expedition successful! Your heroes have returned with rewards.`;

      // Heroes gain XP from successful expedition
      expedition.heroes.forEach(hero => {
        result.heroOutcomes.push({
          heroId: hero.id,
          heroName: hero.name,
          injured: false,
          died: false,
          xpGained: Math.floor(10 * expeditionDef.getDurationMinutes() / 15)
        });
      });
    } else {
      // Failure - calculate injuries/deaths
      result.message = `Expedition failed! Your heroes encountered difficulties.`;
      result.rewards = { gold: 0, xp: 0, gear: [], materials: [] };

      expedition.heroes.forEach(hero => {
        const injuryRoll = Math.random();
        const deathRoll = Math.random();

        const injured = injuryRoll < difficulty.injuryChance;
        const died = deathRoll < difficulty.deathChance;

        result.heroOutcomes.push({
          heroId: hero.id,
          heroName: hero.name,
          injured: injured,
          died: died,
          xpGained: died ? 0 : Math.floor(5 * expeditionDef.getDurationMinutes() / 15)
        });
      });
    }

    // Update expedition with result
    expedition.status = 'completed';
    expedition.progress = 100;
    expedition.result = result;

    // Move from active to completed
    this.activeExpeditions.delete(expeditionId);
    this.completedExpeditions.push(expedition);

    return expedition;
  }

  /**
   * Cancel an active expedition (heroes return empty-handed)
   * @param {string} expeditionId
   * @returns {boolean} Success
   */
  cancelExpedition(expeditionId) {
    const expedition = this.activeExpeditions.get(expeditionId);
    if (!expedition) return false;

    expedition.status = 'cancelled';
    expedition.result = {
      success: false,
      rewards: { gold: 0, xp: 0, gear: [], materials: [] },
      heroOutcomes: expedition.heroes.map(h => ({
        heroId: h.id,
        heroName: h.name,
        injured: false,
        died: false,
        xpGained: 0
      })),
      message: 'Expedition cancelled. Heroes returned empty-handed.'
    };

    this.activeExpeditions.delete(expeditionId);
    this.completedExpeditions.push(expedition);

    return true;
  }

  /**
   * Check if a hero is currently on an expedition
   * @param {string} heroId
   * @returns {boolean}
   */
  isHeroOnExpedition(heroId) {
    for (const expedition of this.activeExpeditions.values()) {
      if (expedition.heroes.some(h => h.id === heroId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get all expeditions for a hero
   * @param {string} heroId
   * @returns {Array}
   */
  getHeroExpeditions(heroId) {
    const heroExpeditions = [];

    for (const expedition of this.activeExpeditions.values()) {
      if (expedition.heroes.some(h => h.id === heroId)) {
        heroExpeditions.push(expedition);
      }
    }

    for (const expedition of this.completedExpeditions) {
      if (expedition.heroes.some(h => h.id === heroId)) {
        heroExpeditions.push(expedition);
      }
    }

    return heroExpeditions;
  }

  /**
   * Get maximum number of concurrent expeditions
   * @param {Object} gameState
   * @returns {number}
   */
  getMaxExpeditions(gameState) {
    let max = this.maxConcurrentExpeditions;

    // Guild level increases max expeditions
    if (gameState?.guild?.level) {
      max += Math.floor((gameState.guild.level - 1) / 3);
    }

    // Cap at reasonable maximum
    return Math.min(max, 5);
  }

  /**
   * Get available expeditions for the current party
   * @param {Array} heroes
   * @param {Object} gameState
   * @returns {Array}
   */
  getAvailableExpeditionsForParty(heroes, gameState) {
    if (!heroes || heroes.length === 0) return [];

    const partyLevel = Math.floor(heroes.reduce((sum, h) => sum + h.level, 0) / heroes.length);
    const completedDungeons = gameState?.dungeonsCompleted || {};

    return getAvailableExpeditions(partyLevel, heroes.length, completedDungeons);
  }

  /**
   * Generate a unique expedition ID
   * @returns {string}
   */
  generateExpeditionId() {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Serialize for saving
   * @returns {Object}
   */
  serialize() {
    return {
      activeExpeditions: Array.from(this.activeExpeditions.entries()),
      completedExpeditions: this.completedExpeditions.slice(-50), // Keep last 50
      maxConcurrentExpeditions: this.maxConcurrentExpeditions,
      version: 1
    };
  }

  /**
   * Load from saved data
   * @param {Object} data
   */
  load(data) {
    if (!data) return;

    if (data.activeExpeditions) {
      this.activeExpeditions = new Map(data.activeExpeditions);
    }

    if (data.completedExpeditions) {
      this.completedExpeditions = data.completedExpeditions;
    }

    if (data.maxConcurrentExpeditions) {
      this.maxConcurrentExpeditions = data.maxConcurrentExpeditions;
    }
  }
}
