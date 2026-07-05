import { cloudSave, cloudLoad, cloudDelete } from '../save-cloud.js';

const SAVE_KEY = 'idle_minds_save';
const SAVE_VERSION = 2;
const DEFAULT_SLOT = 'slot1';

export class SaveSystem {
  constructor() {
    this.lastSaveState = null;
    this.autoSaveInterval = 30000;
    this.lastSaveTime = 0;
    this.slot = DEFAULT_SLOT;
  }

  setSlot(slot) {
    this.slot = slot;
  }

  async save(state) {
    const saveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      gold: state.gold || 0,
      heroes: (state.heroes || []).map(h => h.serialize()),
      guild: state.guild || { level: 1, upgrades: {}, facilities: {} },
      inventory: state.inventory || [],
      party: (state.party || []).filter(Boolean).map(h => h.id),
      dungeonsCompleted: state.dungeonsCompleted || {},
      expeditionSystem: state.expeditionSystem || null,
      idleProgressSystem: state.idleProgressSystem || null,
      prestigeSystem: state.prestigeSystem || null,
      formationSystem: state.formationSystem || null,
      stats: state.stats || { totalGoldEarned: 0, totalDungeons: 0, totalKills: 0 }
    };

    try {
      const serialized = JSON.stringify(saveData);
      this.lastSaveState = serialized;

      const userId = window.__IDLE_MINDS_USER_ID__;
      if (userId) {
        const result = await cloudSave(this.slot, saveData);
        if (result.success) {
          return true;
        }
        console.warn('Cloud save failed, falling back to localStorage');
      }

      localStorage.setItem(SAVE_KEY, serialized);
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  }

  async load() {
    const userId = window.__IDLE_MINDS_USER_ID__;
    
    if (userId) {
      const cloudData = await cloudLoad(this.slot);
      if (cloudData) {
        if (cloudData.version !== SAVE_VERSION) {
          console.warn('Cloud save version mismatch, clearing');
          await cloudDelete(this.slot);
          return null;
        }
        this.lastSaveState = JSON.stringify(cloudData);
        return cloudData;
      }
    }

    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);

      if (data.version !== SAVE_VERSION) {
        console.warn('Save version mismatch, clearing old save');
        localStorage.removeItem(SAVE_KEY);
        return null;
      }

      this.lastSaveState = raw;
      return data;
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  }

  async hasSave() {
    const userId = window.__IDLE_MINDS_USER_ID__;
    
    if (userId) {
      const cloudData = await cloudLoad(this.slot);
      if (cloudData) return true;
    }

    return localStorage.getItem(SAVE_KEY) !== null;
  }

  async deleteSave() {
    const userId = window.__IDLE_MINDS_USER_ID__;
    
    if (userId) {
      await cloudDelete(this.slot);
    }

    localStorage.removeItem(SAVE_KEY);
    this.lastSaveState = null;
  }

  async autoSave(state) {
    const now = Date.now();
    if (now - this.lastSaveTime < this.autoSaveInterval) return false;

    const serialized = JSON.stringify({
      gold: state.gold || 0,
      heroes: (state.heroes || []).map(h => h.serialize()),
      guild: state.guild || { level: 1, upgrades: {}, facilities: {} },
      inventory: state.inventory || [],
      party: (state.party || []).filter(Boolean).map(h => h.id),
      dungeonsCompleted: state.dungeonsCompleted || {},
      expeditionSystem: state.expeditionSystem || null,
      idleProgressSystem: state.idleProgressSystem || null,
      prestigeSystem: state.prestigeSystem || null,
      formationSystem: state.formationSystem || null,
      stats: state.stats || { totalGoldEarned: 0, totalDungeons: 0, totalKills: 0 }
    });

    if (serialized === this.lastSaveState) return false;

    this.lastSaveTime = now;
    return this.saveRaw(serialized);
  }

  async saveRaw(serialized) {
    try {
      this.lastSaveState = serialized;
      const data = JSON.parse(serialized);

      const userId = window.__IDLE_MINDS_USER_ID__;
      if (userId) {
        const result = await cloudSave(this.slot, data);
        if (result.success) {
          return true;
        }
      }

      localStorage.setItem(SAVE_KEY, serialized);
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  }

  async exportSave() {
    const data = await this.load();
    return data ? btoa(JSON.stringify(data)) : null;
  }

  async importSave(encoded) {
    try {
      const raw = atob(encoded);
      const data = JSON.parse(raw);
      if (data.version !== SAVE_VERSION) return false;
      return await this.save(data);
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  static getDefaultState() {
    return {
      gold: 0,
      heroes: [],
      guild: { level: 1, upgrades: {}, facilities: {} },
      inventory: [],
      party: [],
      dungeonsCompleted: {},
      expeditionSystem: null,
      idleProgressSystem: null,
      prestigeSystem: null,
      formationSystem: null,
      stats: { totalGoldEarned: 0, totalDungeons: 0, totalKills: 0 }
    };
  }
}
