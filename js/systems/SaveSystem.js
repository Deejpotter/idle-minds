const SAVE_KEY = 'idle_minds_save';
const SAVE_VERSION = 1;

export class SaveSystem {
  constructor() {
    this.lastSaveState = null;
    this.autoSaveInterval = 60000;
    this.lastSaveTime = 0;
  }

  save(gameState) {
    const saveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      gold: gameState.gold,
      heroes: gameState.heroes.map(h => h.serialize()),
      guild: gameState.guild,
      inventory: gameState.inventory,
      party: gameState.party ? gameState.party.map(h => h.id) : [],
      dungeonsCompleted: gameState.dungeonsCompleted,
      stats: gameState.stats
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      this.lastSaveState = JSON.stringify(saveData);
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const saveData = JSON.parse(raw);
      if (saveData.version !== SAVE_VERSION) {
        console.warn('Save version mismatch, starting fresh');
        return null;
      }
      this.lastSaveState = raw;
      return saveData;
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  }

  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  deleteSave() {
    localStorage.removeItem(SAVE_KEY);
    this.lastSaveState = null;
  }

  autoSave(gameState) {
    const now = Date.now();
    if (now - this.lastSaveTime < this.autoSaveInterval) return false;
    const currentState = JSON.stringify({
      gold: gameState.gold,
      heroes: gameState.heroes.map(h => h.serialize()),
      guild: gameState.guild,
      inventory: gameState.inventory,
      party: gameState.party ? gameState.party.map(h => h.id) : [],
      dungeonsCompleted: gameState.dungeonsCompleted,
      stats: gameState.stats
    });
    if (currentState === this.lastSaveState) return false;
    this.lastSaveTime = now;
    return this.save(gameState);
  }

  exportSave() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return btoa(raw);
  }

  importSave(encoded) {
    try {
      const raw = atob(encoded);
      const saveData = JSON.parse(raw);
      if (saveData.version !== SAVE_VERSION) return false;
      localStorage.setItem(SAVE_KEY, raw);
      this.lastSaveState = raw;
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  static getDefaultState() {
    return {
      gold: 0,
      heroes: [],
      guild: { level: 1, facilities: {} },
      inventory: [],
      party: [],
      dungeonsCompleted: {},
      stats: {
        totalGoldEarned: 0,
        totalDungeons: 0,
        totalKills: 0
      }
    };
  }
}
