import { DUNGEONS, isDungeonUnlocked } from '../data/dungeons.js';
import { createEnemy } from '../data/enemies.js';

function generateTrashRoom(index, trashTypes) {
  const count = 2 + Math.floor(Math.random() * 3);
  const enemies = [];
  let remaining = count;
  while (remaining > 0) {
    const type = trashTypes[Math.floor(Math.random() * trashTypes.length)];
    const batchSize = Math.min(remaining, 1 + Math.floor(Math.random() * 2));
    enemies.push({ type, count: batchSize });
    remaining -= batchSize;
  }
  return {
    index,
    type: 'trash',
    theme: 'cavern',
    enemies
  };
}

export class DungeonSystem {
  constructor() {
    this.currentDungeon = null;
    this.currentRoomIndex = 0;
    this.roomEnemies = [];
    this.dungeonComplete = false;
    this.totalGoldEarned = 0;
    this.totalLoot = [];
    this.totalXpEarned = 0;
  }

  loadDungeon(dungeonId) {
    const dungeon = DUNGEONS[dungeonId];
    if (!dungeon) return false;

    this.currentDungeon = dungeon;
    this.currentRoomIndex = 0;
    this.roomEnemies = [];
    this.dungeonComplete = false;
    this.totalGoldEarned = 0;
    this.totalLoot = [];
    this.totalXpEarned = 0;

    return true;
  }

  getCurrentRoom() {
    return this.currentDungeon?.rooms[this.currentRoomIndex] || null;
  }

  spawnRoomEnemies(roomData) {
    const enemies = [];
    for (const spawn of roomData.enemies) {
      for (let i = 0; i < spawn.count; i++) {
        enemies.push(createEnemy(spawn.type));
      }
    }
    this.roomEnemies = enemies;
    return enemies;
  }

  advanceRoom() {
    this.currentRoomIndex++;
    if (this.currentRoomIndex >= this.currentDungeon.rooms.length) {
      this.dungeonComplete = true;
      return null;
    }
    return this.getCurrentRoom();
  }

  isComplete() {
    return this.dungeonComplete;
  }

  addGold(amount) { this.totalGoldEarned += amount; }
  addLoot(item) { this.totalLoot.push(item); }
  addXp(amount) { this.totalXpEarned += amount; }

  getRewards() {
    return {
      gold: this.totalGoldEarned,
      loot: this.totalLoot,
      xp: this.totalXpEarned
    };
  }

  static generateQuickDungeon(partyLevel) {
    const trashCount = 3 + Math.floor(Math.random() * 5);
    const bossCount = Math.random() < 0.5 ? 1 : 2;
    const rooms = [];

    const trashTypes = ['goblin', 'goblin_archer'];
    if (partyLevel >= 3) trashTypes.push('skeleton');
    if (partyLevel >= 5) trashTypes.push('zombie');

    const bossTypes = ['goblin_warchief'];
    if (partyLevel >= 3) bossTypes.push('bone_commander');
    const finalBossTypes = ['goblin_king'];
    if (partyLevel >= 5) finalBossTypes.push('lich_lord');

    const themes = ['cavern'];
    if (partyLevel >= 2) themes.push('forest');
    if (partyLevel >= 4) themes.push('crypt');
    if (partyLevel >= 6) themes.push('ruins');
    if (partyLevel >= 8) themes.push('dream', 'volcanic');
    const randomTheme = () => themes[Math.floor(Math.random() * themes.length)];

    let roomIndex = 0;

    const preBoss = Math.floor(trashCount * 0.4);
    for (let i = 0; i < preBoss; i++) {
      const room = generateTrashRoom(roomIndex++, trashTypes);
      room.theme = randomTheme();
      rooms.push(room);
    }

    if (bossCount >= 1) {
      rooms.push({
        index: roomIndex++,
        type: 'mini_boss',
        theme: randomTheme(),
        enemies: [{ type: bossTypes[Math.floor(Math.random() * bossTypes.length)], count: 1 }]
      });
    }

    const postBoss = trashCount - preBoss;
    for (let i = 0; i < postBoss; i++) {
      const room = generateTrashRoom(roomIndex++, trashTypes);
      room.theme = randomTheme();
      rooms.push(room);
    }

    if (bossCount >= 2) {
      rooms.push({
        index: roomIndex++,
        type: 'mini_boss',
        theme: randomTheme(),
        enemies: [{ type: bossTypes[Math.floor(Math.random() * bossTypes.length)], count: 1 }]
      });
    }

    rooms.push({
      index: roomIndex++,
      type: 'final_boss',
      theme: 'boss',
      enemies: [{ type: finalBossTypes[Math.floor(Math.random() * finalBossTypes.length)], count: 1 }]
    });

    return {
      id: 'quick_' + Date.now(),
      name: `Quick Dungeon (Lv ${partyLevel})`,
      levelRange: [Math.max(1, partyLevel - 1), partyLevel + 1],
      difficulty: 0.75,
      baseGoldReward: Math.floor(30 * partyLevel),
      rooms
    };
  }
}

export { isDungeonUnlocked };
