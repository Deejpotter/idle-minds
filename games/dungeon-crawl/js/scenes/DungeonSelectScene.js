import { DUNGEONS, DUNGEON_LIST, isDungeonUnlocked } from '../data/dungeons.js';
import { DungeonSystem } from '../systems/DungeonSystem.js';
import { createPanel, createButton, createDivider } from '../ui/Panels.js';

const FONT_SERIF = 'Georgia, "Times New Roman", serif';
const FONT_MONO = '"Courier New", Courier, monospace';

export default class DungeonSelectScene extends Phaser.Scene {
  constructor() {
    super('DungeonSelectScene');
  }

  create(data) {
    const { width, height } = this.cameras.main;

    // Background gradient
    const bg = this.add.graphics();
    const steps = 16;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.floor(8 + t * 8);
      const g = Math.floor(6 + t * 5);
      const b = Math.floor(16 + t * 16);
      bg.fillStyle((r << 16) | (g << 8) | b, 1);
      bg.fillRect(0, (height / steps) * i, width, height / steps + 1);
    }

    this.gameState = data.gameState;
    this.party = data.party;
    this.dungeonSystem = new DungeonSystem();
    this.elements = [];

    // Fade in
    this.cameras.main.setAlpha(1);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.buildHeader();
    this.buildPartyPreview();
    this.buildDungeonList();
    this.buildFooter();
  }

  buildHeader() {
    const { width } = this.cameras.main;

    // Header bar
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0a0812, 0.9);
    headerBg.fillRect(0, 0, width, 40);
    headerBg.lineStyle(1, 0x2a2850, 0.5);
    headerBg.beginPath();
    headerBg.moveTo(0, 40);
    headerBg.lineTo(width, 40);
    headerBg.strokePath();

    this.add.text(width / 2, 20, 'SELECT DUNGEON', {
      fontFamily: FONT_SERIF,
      fontSize: '16px',
      color: '#9999bb',
      fontStyle: 'bold',
      letterSpacing: 4
    }).setOrigin(0.5);
  }

  buildPartyPreview() {
    const p = createPanel(this, 8, 50, 300, 72, 'Party');
    const avgLevel = this.party.length > 0
      ? Math.floor(this.party.reduce((s, h) => s + h.level, 0) / this.party.length)
      : 0;

    // Hero names as individual badges
    let hx = p.x + 10;
    this.party.forEach((hero, i) => {
      const badge = this.add.graphics();
      badge.fillStyle(0x1a1a38, 0.8);
      badge.fillRoundedRect(hx, p.contentY, 80, 18, 3);
      badge.lineStyle(1, 0x3333aa, 0.3);
      badge.strokeRoundedRect(hx, p.contentY, 80, 18, 3);

      this.add.text(hx + 40, p.contentY + 9, hero.name, {
        fontFamily: FONT_SERIF,
        fontSize: '12px',
        color: '#c0c0dd',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.add.text(hx + 40, p.contentY + 24, `Lv${hero.level}`, {
        fontFamily: FONT_MONO,
        fontSize: '11px',
        color: '#666688'
      }).setOrigin(0.5);

      hx += 86;
    });

    this.add.text(p.x + 10, p.contentY + 34, `Average Level: ${avgLevel}`, {
      fontFamily: FONT_MONO,
      fontSize: '13px',
      color: '#777799'
    });
  }

  buildDungeonList() {
    let sy = 136;

    const allDungeons = [
      ...DUNGEON_LIST,
      { id: 'quick', name: 'Quick Dungeon', levelRange: [1, 1], difficulty: 1, baseGoldReward: 30 }
    ];

    for (const def of allDungeons) {
      const isQuick = def.id === 'quick';
      const dungeonData = isQuick ? null : DUNGEONS[def.id];
      const unlocked = isQuick
        ? Object.values(this.gameState.dungeonsCompleted).some(v => v > 0)
        : (dungeonData ? isDungeonUnlocked(def.id, this.gameState.dungeonsCompleted) : false);

      // Resolve dungeon properties from data
      if (def.id !== 'quick' && DUNGEONS[def.id]) {
        const d = DUNGEONS[def.id];
        def.levelRange = d.levelRange;
        def.difficulty = d.difficulty;
        def.baseGoldReward = d.baseGoldReward;
      }

      const avgLevel = this.party.length > 0
        ? Math.floor(this.party.reduce((s, h) => s + h.level, 0) / this.party.length)
        : 1;

      // Difficulty color
      let accentColor = 0x44aa44;
      let diffLabel = 'FAIR';
      let diffColor = '#55aa55';
      if (avgLevel < def.levelRange[0]) {
        accentColor = 0xcc4444;
        diffLabel = 'HARD';
        diffColor = '#cc6644';
      } else if (avgLevel > def.levelRange[1]) {
        accentColor = 0x666688;
        diffLabel = 'EASY';
        diffColor = '#888899';
      }

      const cardH = 80;

      // Card background
      const card = this.add.graphics();
      card.fillStyle(0x0e0c18, unlocked ? 0.9 : 0.4);
      card.fillRoundedRect(8, sy, 784, cardH, 5);
      card.lineStyle(1, unlocked ? 0x2a2850 : 0x1a1830, unlocked ? 0.6 : 0.3);
      card.strokeRoundedRect(8, sy, 784, cardH, 5);

      // Left accent strip
      card.fillStyle(accentColor, unlocked ? 0.5 : 0.2);
      card.fillRect(8, sy, 3, cardH);

      // Lock overlay for locked dungeons
      if (!unlocked) {
        card.fillStyle(0x000000, 0.3);
        card.fillRoundedRect(8, sy, 784, cardH, 5);
      }

      // Dungeon name
      const nameColor = unlocked ? '#ddddee' : '#555566';
      this.add.text(22, sy + 10, def.name, {
        fontFamily: FONT_SERIF,
        fontSize: '18px',
        color: nameColor,
        fontStyle: 'bold'
      });

      // Theme indicator
      if (unlocked) {
        const themeColors = {
          cavern: 0x666655, crypt: 0x556688, boss: 0x884444,
          forest: 0x448844, dream: 0x664488, ruins: 0x888866, volcanic: 0x884422
        };
        const firstRoom = def.id !== 'quick' && DUNGEONS[def.id] ? DUNGEONS[def.id].rooms[0] : null;
        const theme = firstRoom ? firstRoom.theme : 'cavern';
        const tc = themeColors[theme] || 0x666655;
        const tDot = this.add.graphics();
        tDot.fillStyle(tc, 0.6);
        tDot.fillCircle(12, sy + 16, 5);
        tDot.lineStyle(1, tc, 0.3);
        tDot.strokeCircle(12, sy + 16, 6);
      }

      this.add.text(22, sy + 32, `Level ${def.levelRange[0]} - ${def.levelRange[1]}`, {
        fontFamily: FONT_MONO,
        fontSize: '13px',
        color: unlocked ? diffColor : '#444455'
      });

      // Difficulty badge
      if (unlocked) {
        const diffBg = this.add.graphics();
        diffBg.fillStyle(accentColor, 0.2);
        diffBg.fillRoundedRect(170, sy + 28, 48, 14, 3);
        diffBg.lineStyle(1, accentColor, 0.3);
        diffBg.strokeRoundedRect(170, sy + 28, 48, 14, 3);
        this.add.text(194, sy + 35, diffLabel, {
          fontFamily: FONT_MONO,
          fontSize: '11px',
          color: diffColor,
          fontStyle: 'bold'
        }).setOrigin(0.5);
      }

      // Room count + reward
      const rooms = def.id === 'quick' ? 'Procedural' : (DUNGEONS[def.id]?.rooms.length || '?');
      this.add.text(22, sy + 50, `Rooms: ${rooms}`, {
        fontFamily: FONT_MONO,
        fontSize: '13px',
        color: unlocked ? '#888899' : '#444455'
      });

      this.add.text(160, sy + 50, `Reward: ${def.baseGoldReward} gold`, {
        fontFamily: FONT_MONO,
        fontSize: '13px',
        color: unlocked ? '#ddaa00' : '#444455'
      });

      // Lock status or Enter button
      if (!unlocked) {
        const req = def.unlockCondition
          ? `Requires: ${def.unlockCondition.dungeonId} x${def.unlockCondition.count}`
          : (isQuick ? 'Complete any dungeon first' : 'Locked');
        this.add.text(760, sy + 35, `\u{1F512} ${req}`, {
          fontFamily: FONT_MONO,
          fontSize: '9px',
          color: '#885544'
        }).setOrigin(1, 0.5);
      } else {
        const enterBtn = createButton(this, 680, sy + 26, 'ENTER', () => {
          this.enterDungeon(def);
        }, 90);
      }

      sy += cardH + 10;
    }
  }

  buildFooter() {
    createButton(this, 340, 562, 'Back to Guild', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => {
        this.scene.start('GuildScene', { saveData: this.buildSaveData() });
      });
    }, 120);
  }

  buildSaveData() {
    return {
      version: 1,
      timestamp: Date.now(),
      gold: this.gameState.economy.getGold(),
      heroes: this.gameState.heroes.map(h => h.serialize()),
      guild: this.gameState.guild,
      inventory: this.gameState.economy.inventory,
      party: this.party.map(h => h.id),
      dungeonsCompleted: this.gameState.dungeonsCompleted,
      stats: this.gameState.stats
    };
  }

  enterDungeon(dungeonDef) {
    let dungeonId = dungeonDef.id;
    let dungeonData = dungeonDef;

    if (dungeonDef.id === 'quick') {
      const avgLevel = this.party.length > 0
        ? Math.floor(this.party.reduce((s, h) => s + h.level, 0) / this.party.length)
        : 1;
      dungeonData = DungeonSystem.generateQuickDungeon(avgLevel);
      dungeonId = dungeonData.id;
    }

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.scene.start('DungeonScene', {
        gameState: this.gameState,
        party: this.party,
        dungeonId: dungeonId,
        dungeonData: dungeonData
      });
    });
  }
}