/**
 * IdleProgressSystem - Manages offline progression and idle rewards
 * Tracks last login time and calculates accumulated progress while away
 */

export class IdleProgressSystem {
  constructor() {
    this.lastLoginTime = null;
    this.offlineCapHours = 8; // Maximum offline progress (8 hours)
    this.goldPerMinuteBase = 1; // Base gold generation per minute
    this.xpPerMinuteBase = 0.5; // Base XP generation per minute per hero
  }

  /**
   * Initialize the system - call when game starts
   * Returns calculated offline rewards
   */
  initialize(savedData = null) {
    if (savedData) {
      this.load(savedData);
    }

    const now = Date.now();
    let offlineRewards = null;

    if (this.lastLoginTime) {
      offlineRewards = this.calculateOfflineProgress(this.lastLoginTime, now);
    }

    // Update last login time
    this.lastLoginTime = now;

    return offlineRewards;
  }

  /**
   * Calculate offline progress between two timestamps
   */
  calculateOfflineProgress(lastTime, currentTime) {
    const diffMs = currentTime - lastTime;
    const diffMinutes = diffMs / (1000 * 60);
    const diffHours = diffMinutes / 60;

    // Cap offline progress
    const cappedHours = Math.min(diffHours, this.offlineCapHours);
    const cappedMinutes = cappedHours * 60;

    return {
      minutesAway: Math.floor(diffMinutes),
      cappedMinutes: Math.floor(cappedMinutes),
      cappedHours: cappedHours,
      wasCapped: diffHours > this.offlineCapHours,
      goldEarned: 0, // Will be calculated by EconomySystem
      xpEarned: 0, // Will be calculated per hero
      materials: [] // Will be populated by ExpeditionSystem
    };
  }

  /**
   * Calculate gold generation based on guild level and upgrades
   */
  calculatePassiveGold(guildLevel, guildUpgrades = {}, minutes) {
    let goldPerMinute = this.goldPerMinuteBase;

    // Guild level bonus
    goldPerMinute += (guildLevel - 1) * 0.5;

    // Guild upgrade bonuses
    if (guildUpgrades.goldGeneration) {
      goldPerMinute *= (1 + guildUpgrades.goldGeneration * 0.1);
    }

    // Cap at reasonable maximum
    goldPerMinute = Math.min(goldPerMinute, 100);

    return Math.floor(goldPerMinute * minutes);
  }

  /**
   * Calculate passive XP for heroes
   */
  calculatePassiveXP(heroLevel, guildLevel, minutes) {
    let xpPerMinute = this.xpPerMinuteBase;

    // Guild level bonus
    xpPerMinute *= (1 + (guildLevel - 1) * 0.1);

    // Higher level heroes gain XP slightly slower
    xpPerMinute /= (1 + heroLevel * 0.01);

    return Math.floor(xpPerMinute * minutes);
  }

  /**
   * Process full offline rewards calculation
   * Call this with all necessary data to get final rewards
   */
  processOfflineRewards(gameState, heroes, guildUpgrades) {
    const now = Date.now();

    if (!this.lastLoginTime) {
      this.lastLoginTime = now;
      return null;
    }

    const progress = this.calculateOfflineProgress(this.lastLoginTime, now);

    if (progress.cappedMinutes <= 0) {
      this.lastLoginTime = now;
      return null;
    }

    // Calculate gold
    progress.goldEarned = this.calculatePassiveGold(
      gameState.guild.level,
      guildUpgrades,
      progress.cappedMinutes
    );

    // Calculate XP for each hero
    progress.heroXP = {};
    heroes.forEach(hero => {
      const xp = this.calculatePassiveXP(
        hero.level,
        gameState.guild.level,
        progress.cappedMinutes
      );
      progress.heroXP[hero.id] = xp;
    });

    // Update last login time
    this.lastLoginTime = now;

    return progress;
  }

  /**
   * Serialize for saving
   */
  serialize() {
    return {
      lastLoginTime: this.lastLoginTime,
      version: 1
    };
  }

  /**
   * Load from saved data
   */
  load(data) {
    if (data.lastLoginTime) {
      this.lastLoginTime = data.lastLoginTime;
    }
  }

  /**
   * Get time until next reward (for UI)
   */
  getTimeUntilNextReward() {
    // Rewards accumulate every 5 minutes
    const rewardInterval = 5 * 60 * 1000; // 5 minutes in ms
    const now = Date.now();

    if (!this.lastLoginTime) {
      return 0;
    }

    const timeSinceLast = now - this.lastLoginTime;
    const timeUntilNext = rewardInterval - (timeSinceLast % rewardInterval);

    return Math.max(0, timeUntilNext);
  }
}
