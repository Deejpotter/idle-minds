import { Hero, createStarterHero } from '../systems/HeroSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { ExpeditionSystem } from '../systems/ExpeditionSystem.js';
import { IdleProgressSystem } from '../systems/IdleProgressSystem.js';
import { autoEquipBest } from '../systems/AutoEquipSystem.js';
import { RARITIES } from '../data/gear.js';
import { CLASSES, HERO_NAMES } from '../data/classes.js';
import { PREDEFINED_EXPEDITIONS, EXPEDITION_TYPES, formatDuration } from '../data/expeditions.js';
import { createPanel, createButton, createStatBar, createDivider, createGoldDisplay, createConfirmDialog } from '../ui/Panels.js';
import { openDashboard } from '../ui/Dashboard.js';
import { showToast } from '../ui/Toast.js';
import { GUILD_UPGRADES, canPurchaseUpgrade, purchaseUpgrade, getUpgradeLevel } from '../data/guildUpgrades.js';
import { createGameContext, loadGameContext, serializeGameContext, applyStatContext } from '../systems/GameContext.js';
import { PrestigeSystem, MAX_LEVEL, PRESTIGE_UPGRADES } from '../systems/PrestigeSystem.js';
import { FORMATION_PRESETS } from '../systems/FormationSystem.js';
import { getClassSkills, canUnlockSkill } from '../data/skillTrees.js';
import { getAvailableSkillPoints, getPartySynergySummary } from '../systems/heroHelpers.js';
import { rollExpansionGear } from '../data/gearExpansion.js';

const FONT_SERIF = 'Georgia, "Times New Roman", serif';
const FONT_MONO = '"Courier New", Courier, monospace';

export default class GuildScene extends Phaser.Scene {
  constructor() {
    super('GuildScene');
  }

  create(data) {
    const { width, height } = this.cameras.main;

    // Background gradient
    const bg = this.add.graphics();
    const steps = 16;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.floor(8 + t * 10);
      const g = Math.floor(6 + t * 6);
      const b = Math.floor(16 + t * 18);
      bg.fillStyle((r << 16) | (g << 8) | b, 1);
      bg.fillRect(0, (height / steps) * i, width, height / steps + 1);
    }

    this.saveSystem = new SaveSystem();
    this.economy = new EconomySystem();
    this.expeditionSystem = new ExpeditionSystem();
    this.idleProgressSystem = new IdleProgressSystem();
    this.gameContext = createGameContext();

    if (data && data.saveData) {
      this.loadFromSave(data.saveData);
      loadGameContext(this.gameContext, data.saveData);
    } else {
      this.startNewGame();
    }

    // Process offline rewards on startup
    this.processOfflineRewards();

    this.selectedHero = this.gameState.heroes[0] || null;
    this.party = (data && data.saveData && data.saveData.party)
      ? this.restoreParty(data.saveData.party)
      : [this.selectedHero].filter(Boolean);

    this.gameContext.formationSystem.autoAssignPositions(this.party.filter(Boolean));
    applyStatContext(this.gameContext, this.party.filter(Boolean));

    this.uiElements = [];
    this.statBars = [];
    this.shopOpen = false;
    this.gearPopupOpen = false;
    this.expeditionPopupOpen = false;
    this.offlineRewardsPopupOpen = false;
    this.dashboardOpen = false;
    this.dashboardElements = [];
    this.dashboardRefreshTimer = null;
    this.upgradesPopupOpen = false;
    this.helpOverlayOpen = false;
    this.skillsPopupOpen = false;
    this.prestigePopupOpen = false;
    this.tutorialStep = 0;
    this.pendingPopupQueue = [];

    this.buildHeader();
    this.buildRosterPanel();
    this.buildDetailPanel();
    this.buildActionPanel();
    this.buildPartyPanel();
    this.refreshAll();

    if (!this.saveTimer) {
      this.saveTimer = this.time.addEvent({
        delay: 60000,
        loop: true,
        callback: () => this.autoSave()
      });
    }

    // Start expedition update loop
    this.startExpeditionUpdateLoop();

    // Keyboard shortcuts (D/E/S/R/X)
    this.setupKeyboardShortcuts();

    if (this.offlineRewards && this.offlineRewards.goldEarned > 0) {
      this.queuePopup(() => this.showOfflineRewardsPopup());
    }

    this.maybeShowTutorial();
  }

  // ─── Header Bar ──────────────────────────────────────────────
  buildHeader() {
    const { width } = this.cameras.main;

    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0a0812, 0.9);
    headerBg.fillRect(0, 0, width, 36);
    headerBg.lineStyle(1, 0x2a2850, 0.5);
    headerBg.beginPath();
    headerBg.moveTo(0, 36);
    headerBg.lineTo(width, 36);
    headerBg.strokePath();

    this.add.text(12, 10, 'GUILD HALL', {
      fontFamily: FONT_SERIF,
      fontSize: '18px',
      color: '#7777aa',
      fontStyle: 'bold',
      letterSpacing: 3
    });

    this.goldDisplay = createGoldDisplay(this, width - 120, 10, this.economy.getGold());

    const event = this.gameContext.eventSystem.getActiveEvent();
    if (event) {
      this.eventBannerText = this.add.text(12, 22, `Event: ${event.name}`, {
        fontFamily: FONT_MONO,
        fontSize: '11px',
        color: event.color || '#ddaa00',
      });
    }
  }

  // ─── Roster Panel ────────────────────────────────────────────
  buildRosterPanel() {
    const p = createPanel(this, 8, 44, 190, 310, 'Heroes');
    this.rosterPanel = p;
    this.rosterItems = [];
  }

  // ─── Detail Panel ────────────────────────────────────────────
  buildDetailPanel() {
    const p = createPanel(this, 206, 44, 260, 310, 'Hero Detail');
    this.detailPanel = p;
  }

  // ─── Action Panel ────────────────────────────────────────────
  buildActionPanel() {
    const p = createPanel(this, 474, 44, 140, 310, 'Actions');
    this.actionPanel = p;

    createButton(this, 484, 72, 'Dashboard', () => this.toggleDashboard(), 120);
    createButton(this, 484, 104, 'Shop', () => this.toggleShop(), 120);
    createButton(this, 484, 136, 'Dungeon', () => this.goToDungeon(), 120);
    createButton(this, 484, 168, 'Expeditions', () => this.toggleExpeditions(), 120);
    createButton(this, 484, 200, 'Recruit', () => this.recruitHero(), 120);
    createButton(this, 484, 232, 'Upgrades', () => this.toggleUpgrades(), 120);
    createButton(this, 484, 264, 'Help', () => this.toggleHelpOverlay(), 120);
    createButton(this, 484, 296, 'Prestige', () => this.togglePrestigeShop(), 120);

    this.recruitCostText = this.add.text(484, 324, '', {
      fontFamily: FONT_MONO, fontSize: '12px', color: '#888888'
    });

    // Passive income indicator
    const guildState = {
      level: this.gameState.guild.level,
      upgrades: this.gameState.guild.upgrades || {}
    };
    const rate = this.economy.calculatePassiveGoldPerMinute(guildState);
    const rateText = this.add.text(484, 312, `\u25C6 ${rate.toFixed(1)}/min`, {
      fontFamily: FONT_MONO,
      fontSize: '11px',
      color: '#88aa55'
    });

    // Active expeditions indicator
    const activeCount = this.expeditionSystem.activeExpeditions.size;
    if (activeCount > 0) {
      const expDot = this.add.graphics();
      expDot.fillStyle(0x6688cc, 0.9);
      expDot.fillCircle(494, 293, 3);
      this.add.text(502, 288, `${activeCount} expedition${activeCount > 1 ? 's' : ''} active`, {
        fontFamily: FONT_MONO,
        fontSize: '11px',
        color: '#6688cc'
      });
    }
  }

  // ─── Party Panel ─────────────────────────────────────────────
  buildPartyPanel() {
    const p = createPanel(this, 8, 362, 606, 42, 'Party');
    this.partyPanel = p;
    this.partySlots = [];

    for (let i = 0; i < 5; i++) {
      const sx = 16 + i * 120;

      const slotG = this.add.graphics();
      slotG.fillStyle(0x121020, 0.8);
      slotG.fillRoundedRect(sx, 374, 112, 22, 3);
      slotG.lineStyle(1, 0x2a2850, 0.5);
      slotG.strokeRoundedRect(sx, 374, 112, 22, 3);

      // Slot number
      this.add.text(sx + 4, 377, `${i + 1}`, {
        fontFamily: FONT_MONO,
        fontSize: '11px',
        color: '#444455'
      });

      const slotText = this.add.text(sx + 56, 385, 'Empty', {
        fontFamily: FONT_MONO,
        fontSize: '13px',
        color: '#444455'
      }).setOrigin(0.5);

      slotText.setInteractive({ useHandCursor: true });
      slotText.on('pointerdown', () => this.onPartySlotClick(i));

      this.partySlots.push({ graphics: slotG, text: slotText, index: i, x: sx });
    }

    this.synergyText = this.add.text(16, 400, '', {
      fontFamily: FONT_MONO,
      fontSize: '11px',
      color: '#6688aa',
    });
  }

  // ─── Refresh ─────────────────────────────────────────────────
  refreshAll() {
    this.refreshRoster();
    this.refreshDetail();
    this.refreshParty();
    this.refreshGold();
    this.updateRecruitCost();
  }

  refreshRoster() {
    for (const item of this.rosterItems) {
      item.text.destroy();
      if (item.g) item.g.destroy();
      if (item.levelBadge) item.levelBadge.destroy();
      if (item.classTag) item.classTag.destroy();
    }
    this.rosterItems = [];

    const startY = this.rosterPanel.contentY;
    this.gameState.heroes.forEach((hero, i) => {
      const y = startY + i * 24;
      const isSel = this.selectedHero && this.selectedHero.id === hero.id;
      const bg = this.add.graphics();

      if (isSel) {
        // Selected card highlight
        bg.fillStyle(0x1a1a40, 0.8);
        bg.fillRoundedRect(this.rosterPanel.x + 4, y - 2, 182, 22, 3);
        bg.lineStyle(1, 0x4444aa, 0.4);
        bg.strokeRoundedRect(this.rosterPanel.x + 4, y - 2, 182, 22, 3);

        // Left accent strip
        bg.fillStyle(0x6666cc, 0.6);
        bg.fillRect(this.rosterPanel.x + 4, y, 2, 18);
      }

      const classAbbr = hero.className.charAt(0).toUpperCase() + hero.className.slice(1, 3);
      const text = this.add.text(this.rosterPanel.x + 12, y + 2, `${hero.name}`, {
        fontFamily: FONT_SERIF,
        fontSize: '14px',
        color: isSel ? '#ddddee' : '#888899',
        fontStyle: isSel ? 'bold' : 'normal'
      });

      const classTag = this.add.text(this.rosterPanel.x + 12, y + 16, classAbbr, {
        fontFamily: FONT_MONO,
        fontSize: '11px',
        color: isSel ? '#6666aa' : '#444455'
      });

      // Level badge
      const badge = this.add.text(this.rosterPanel.x + 168, y + 2, `Lv${hero.level}`, {
        fontFamily: FONT_MONO,
        fontSize: '12px',
        color: isSel ? '#8888cc' : '#555566'
      }).setOrigin(1, 0);

      text.setInteractive({ useHandCursor: true });
      text.on('pointerdown', () => {
        this.selectedHero = hero;
        this.refreshAll();
      });

      this.rosterItems.push({ text, g: bg, levelBadge: badge, classTag });
    });
  }

  refreshDetail() {
    for (const bar of this.statBars) bar.destroy();
    this.statBars = [];

    for (const el of this.detailElements || []) el.destroy();
    this.detailElements = [];

    const dx = this.detailPanel.x;
    const dy = this.detailPanel.contentY;

    if (!this.selectedHero) {
      const t = this.add.text(dx + 10, dy + 10, 'Select a hero to view', {
        fontFamily: FONT_SERIF,
        fontSize: '15px',
        color: '#555566',
        fontStyle: 'italic'
      });
      this.detailElements.push(t);
      return;
    }

    const hero = this.selectedHero;
    const stats = hero.getEffectiveStats();

    // Hero name + class
    const nameText = this.add.text(dx + 10, dy, hero.name, {
      fontFamily: FONT_SERIF,
      fontSize: '20px',
      color: '#ddddee',
      fontStyle: 'bold'
    });
    this.detailElements.push(nameText);

    const classText = this.add.text(dx + 10, dy + 24, `${hero.className}  \u2022  Level ${hero.level}`, {
      fontFamily: FONT_MONO,
      fontSize: '13px',
      color: '#777799'
    });
    this.detailElements.push(classText);

    // Auto-Equip button (Phase 4B)
    const autoEquipBtn = createButton(this, dx + 165, dy + 22, 'Auto-Equip', () => this.handleAutoEquip(), 86);
    autoEquipBtn.graphics.setDepth(1);
    autoEquipBtn.text.setDepth(2);
    this.detailElements.push(autoEquipBtn.graphics, autoEquipBtn.text);

    const skillPts = getAvailableSkillPoints(hero);
    const skillsBtn = createButton(this, dx + 10, dy + 22, `Skills (${skillPts})`, () => this.toggleSkills(), 100);
    skillsBtn.graphics.setDepth(1);
    skillsBtn.text.setDepth(2);
    this.detailElements.push(skillsBtn.graphics, skillsBtn.text);

    if (this.gameContext.prestigeSystem.canPrestige(hero)) {
      const prestigeBtn = createButton(this, dx + 120, dy + 22, 'Prestige', () => this.handlePrestigeHero(hero), 70);
      prestigeBtn.graphics.setDepth(1);
      prestigeBtn.text.setDepth(2);
      this.detailElements.push(prestigeBtn.graphics, prestigeBtn.text);
    }

    // XP bar
    const xpPct = hero.xpToNext > 0 ? hero.xp / hero.xpToNext : 0;
    const xpBg = this.add.graphics();
    xpBg.fillStyle(0x1a1a2e, 1);
    xpBg.fillRoundedRect(dx + 10, dy + 36, 240, 5, 2);
    const xpFill = this.add.graphics();
    xpFill.fillStyle(0x6666aa, 0.7);
    xpFill.fillRoundedRect(dx + 10, dy + 36, Math.max(2, Math.floor(240 * xpPct)), 5, 2);
    this.detailElements.push(xpBg, xpFill);

    const xpLabel = this.add.text(dx + 10, dy + 44, `XP ${hero.xp}/${hero.xpToNext}`, {
      fontFamily: FONT_MONO,
      fontSize: '11px',
      color: '#666688'
    });
    this.detailElements.push(xpLabel);

    // Divider
    this.detailElements.push(createDivider(this, dx + 10, dy + 56, 240));

    // Stat bars
    let sy = dy + 62;
    const statDefs = [
      ['HP', stats.hp, stats.hp, '#4caf50'],
      ['MP', stats.mp, stats.mp, '#4488dd'],
      ['ATK', stats.attack, stats.attack * 2, '#dd4444'],
      ['DEF', stats.defense, stats.defense * 3, '#888888'],
      ['SPD', stats.speed, stats.speed * 3, '#ddaa00'],
      ['CRT', Math.floor(stats.critChance * 100), 100, '#dd88dd']
    ];

    for (const [label, val, max, col] of statDefs) {
      const bar = createStatBar(this, dx + 10, sy, label, val, max, col, 130);
      this.statBars.push(bar);
      sy += 18;
    }

    // Divider
    sy += 4;
    this.detailElements.push(createDivider(this, dx + 10, sy, 240));
    sy += 6;

    // Gear slots
    const slots = ['weapon', 'armor', 'accessory'];
    const slotIcons = { weapon: '\u2694', armor: '\u2659', accessory: '\u25C7' };

    for (const slot of slots) {
      const equipped = hero.gear[slot];
      const slotLabel = slotIcons[slot] + ' ' + slot.charAt(0).toUpperCase() + slot.slice(1);

      // Slot background
      const slotBg = this.add.graphics();
      slotBg.fillStyle(0x121020, 0.6);
      slotBg.fillRoundedRect(dx + 10, sy, 240, 18, 2);
      this.detailElements.push(slotBg);

      const slotText = this.add.text(dx + 16, sy + 3, slotLabel, {
        fontFamily: FONT_MONO,
        fontSize: '12px',
        color: '#666688'
      });
      this.detailElements.push(slotText);

      if (equipped) {
        const rColor = RARITIES[equipped.rarity]?.color || '#ffffff';
        const nameText = this.add.text(dx + 90, sy + 3, equipped.name, {
          fontFamily: FONT_SERIF,
          fontSize: '13px',
          color: rColor,
          fontStyle: 'bold'
        });
        this.detailElements.push(nameText);

        nameText.setInteractive({ useHandCursor: true });
        nameText.on('pointerdown', () => this.onGearSlotClick(slot));

        // Unequip button
        const uText = this.add.text(dx + 236, sy + 3, '\u2715', {
          fontFamily: FONT_MONO,
          fontSize: '13px',
          color: '#664444'
        });
        uText.setInteractive({ useHandCursor: true });
        uText.on('pointerover', () => uText.setColor('#ff4444'));
        uText.on('pointerout', () => uText.setColor('#664444'));
        uText.on('pointerdown', () => {
          hero.unequip(slot);
          this.economy.addToInventory(equipped);
          this.refreshAll();
        });
        this.detailElements.push(uText);
      } else {
        const emptyText = this.add.text(dx + 160, sy + 3, 'Empty', {
          fontFamily: FONT_SERIF,
          fontSize: '13px',
          color: '#444455',
          fontStyle: 'italic'
        });
        emptyText.setInteractive({ useHandCursor: true });
        emptyText.on('pointerdown', () => this.onGearSlotClick(slot));
        this.detailElements.push(emptyText);
      }

      sy += 20;
    }
  }

  refreshParty() {
    for (let i = 0; i < 5; i++) {
      const hero = this.party[i];
      const slot = this.partySlots[i];

      slot.text.setText(hero ? hero.name : 'Empty');
      slot.text.setColor(hero ? '#c0c0dd' : '#444455');
      slot.text.setFontFamily(hero ? FONT_SERIF : FONT_MONO);
      slot.text.setFontStyle(hero ? 'bold' : 'normal');

      slot.graphics.clear();
      if (hero) {
        slot.graphics.fillStyle(0x1a1a38, 0.8);
        slot.graphics.fillRoundedRect(slot.x, 374, 112, 22, 3);
        slot.graphics.lineStyle(1, 0x4444aa, 0.3);
        slot.graphics.strokeRoundedRect(slot.x, 374, 112, 22, 3);
        // Level indicator
        slot.graphics.fillStyle(0x5555aa, 0.3);
        slot.graphics.fillRect(slot.x, 374, 2, 22);
      } else {
        slot.graphics.fillStyle(0x121020, 0.8);
        slot.graphics.fillRoundedRect(slot.x, 374, 112, 22, 3);
        slot.graphics.lineStyle(1, 0x2a2850, 0.3);
        slot.graphics.strokeRoundedRect(slot.x, 374, 112, 22, 3);
      }
    }
    if (this.synergyText) {
      this.synergyText.setText(`Synergies: ${getPartySynergySummary(this.party)}`);
    }
  }

  refreshGold() {
    this.goldDisplay.update(this.economy.getGold());
  }

  onPartySlotClick(index) {
    if (this.party[index]) {
      this.party[index] = null;
    } else {
      const hero = this.selectedHero;
      if (hero && !this.party.find(h => h && h.id === hero.id)) {
        this.party[index] = hero;
      }
    }
    this.gameContext.formationSystem.autoAssignPositions(this.party.filter(Boolean));
    applyStatContext(this.gameContext, this.party.filter(Boolean));
    this.refreshParty();
  }

  // ─── Shop ────────────────────────────────────────────────────
  toggleShop() {
    if (this.shopOpen) this.closeShop();
    else this.openShop();
  }

  openShop() {
    this.shopOpen = true;
    this.shopElements = [];

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.75);
    bg.fillRect(0, 0, 800, 600);
    this.shopElements.push(bg);

    const p = createPanel(this, 100, 60, 600, 470, 'Gear Shop');
    this.shopElements.push(p.graphics);
    if (p.titleText) this.shopElements.push(p.titleText);

    if (this.economy.shopInventory.length === 0) {
      this.economy.refreshShop(this.gameState.guild.level);
    }

    // Gold display in shop
    const shopGold = this.add.text(p.x + p.w - 10, p.y + 5, `\u25C6 ${this.economy.getGold()}`, {
      fontFamily: FONT_MONO,
      fontSize: '14px',
      color: '#ddaa00',
      fontStyle: 'bold'
    }).setOrigin(1, 0);
    this.shopElements.push(shopGold);

    let sy = p.contentY + 4;
    this.economy.shopInventory.forEach((item, i) => {
      const rarityColor = RARITIES[item.rarity]?.color || '#ffffff';
      const canBuy = this.economy.getGold() >= item.buyPrice;

      // Item card background
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x121020, canBuy ? 0.7 : 0.3);
      cardBg.fillRoundedRect(p.x + 8, sy - 2, 584, 40, 3);
      cardBg.lineStyle(1, 0x2a2850, canBuy ? 0.4 : 0.15);
      cardBg.strokeRoundedRect(p.x + 8, sy - 2, 584, 40, 3);
      this.shopElements.push(cardBg);

      // Rarity accent
      const accent = this.add.graphics();
      accent.fillStyle(Phaser.Display.Color.HexStringToColor(rarityColor).color, canBuy ? 0.5 : 0.2);
      accent.fillRect(p.x + 8, sy, 2, 36);
      this.shopElements.push(accent);

      // Item name
      const itemText = this.add.text(p.x + 18, sy + 2, item.name, {
        fontFamily: FONT_SERIF,
        fontSize: '15px',
        color: canBuy ? rarityColor : '#555566',
        fontStyle: 'bold'
      });
      this.shopElements.push(itemText);

      // Stats
      const statsStr = Object.entries(item.statBonus)
        .map(([k, v]) => `${k.toUpperCase()} +${v}`)
        .join('  ');
      const statsText = this.add.text(p.x + 18, sy + 18, `${item.slot}  \u2022  ${statsStr}`, {
        fontFamily: FONT_MONO,
        fontSize: '12px',
        color: canBuy ? '#777799' : '#444455'
      });
      this.shopElements.push(statsText);

      // Price
      const priceColor = canBuy ? '#ddaa00' : '#884444';
      const priceText = this.add.text(p.x + 400, sy + 8, `\u25C6 ${item.buyPrice}`, {
        fontFamily: FONT_MONO,
        fontSize: '11px',
        color: priceColor,
        fontStyle: 'bold'
      });
      this.shopElements.push(priceText);

      if (canBuy) {
        const buyBtn = createButton(this, p.x + 500, sy + 8, 'BUY', () => {
          const bought = this.economy.buyGear(item.id);
          if (bought) {
            this.closeShop();
            this.refreshAll();
          }
        }, 70);
        this.shopElements.push(buyBtn.graphics, buyBtn.text);
      }

      sy += 44;
    });

    const closeBtn = createButton(this, 540, 490, 'Close', () => this.closeShop(), 80);
    this.shopElements.push(closeBtn.graphics, closeBtn.text);
  }

  closeShop() {
    this.shopOpen = false;
    for (const el of this.shopElements || []) el.destroy();
    this.shopElements = [];
  }

  // ─── Gear Equip Popup ────────────────────────────────────────
  onGearSlotClick(slot) {
    if (this.gearPopupOpen) return;

    const items = this.economy.getInventoryBySlot(slot);
    if (items.length === 0) return;

    this.gearPopupOpen = true;
    this.gearPopupEls = [];

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.65);
    bg.fillRect(0, 0, 800, 600);
    this.gearPopupEls.push(bg);

    const px = 220, py = 80, pw = 360;
    const ph = Math.min(items.length, 6) * 40 + 60;

    const p = createPanel(this, px, py, pw, ph, `Equip ${slot}`);
    this.gearPopupEls.push(p.graphics);
    if (p.titleText) this.gearPopupEls.push(p.titleText);

    let sy = p.contentY + 2;
    items.slice(0, 6).forEach(item => {
      const rColor = RARITIES[item.rarity]?.color || '#ffffff';

      // Item card
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x121020, 0.7);
      cardBg.fillRoundedRect(px + 8, sy - 2, pw - 16, 32, 3);
      cardBg.lineStyle(1, 0x2a2850, 0.3);
      cardBg.strokeRoundedRect(px + 8, sy - 2, pw - 16, 32, 3);
      this.gearPopupEls.push(cardBg);

      const accent = this.add.graphics();
      accent.fillStyle(Phaser.Display.Color.HexStringToColor(rColor).color, 0.5);
      accent.fillRect(px + 8, sy, 2, 28);
      this.gearPopupEls.push(accent);

      const t = this.add.text(px + 18, sy + 4, item.name, {
        fontFamily: FONT_SERIF,
        fontSize: '15px',
        color: rColor,
        fontStyle: 'bold'
      });
      this.gearPopupEls.push(t);

      // Stat summary
      const statsStr = Object.entries(item.statBonus).map(([k, v]) => `${k.toUpperCase()}+${v}`).join(' ');
      const st = this.add.text(px + 18, sy + 18, statsStr, {
        fontFamily: FONT_MONO,
        fontSize: '11px',
        color: '#777799'
      });
      this.gearPopupEls.push(st);

      t.setInteractive({ useHandCursor: true });
      t.on('pointerover', () => cardBg.setAlpha(1));
      t.on('pointerout', () => cardBg.setAlpha(0.85));
      t.on('pointerdown', () => {
        const old = this.selectedHero.equip(slot, item);
        this.economy.removeFromInventory(item.id);
        if (old) this.economy.addToInventory(old);
        this.closeGearPopup();
        this.refreshAll();
      });
      sy += 40;
    });

    const closeBtn = createButton(this, px + pw - 90, py + ph - 34, 'Close', () => this.closeGearPopup(), 70);
    this.gearPopupEls.push(closeBtn.graphics, closeBtn.text);
  }

  closeGearPopup() {
    this.gearPopupOpen = false;
    for (const el of this.gearPopupEls || []) el.destroy();
    this.gearPopupEls = [];
  }

  // ─── Hero Recruitment ────────────────────────────────────────
  recruitHero() {
    const cost = this.getRecruitCost();
    if (this.economy.getGold() < cost) {
      showToast(this, `Not enough gold — need ${cost}g`, 'error');
      return;
    }

    const classKeys = Object.keys(CLASSES);
    const randomClass = classKeys[Math.floor(Math.random() * classKeys.length)];
    const names = HERO_NAMES[randomClass] || ['Hero'];
    const usedNames = this.gameState.heroes.map(h => h.name);
    const availableNames = names.filter(n => !usedNames.includes(n));
    const name = availableNames.length > 0
      ? availableNames[Math.floor(Math.random() * availableNames.length)]
      : names[0] + ' ' + (this.gameState.heroes.length + 1);

    const hero = new Hero(randomClass, 1, name);
    this.economy.spendGold(cost);
    this.gameState.heroes.push(hero);

    this.refreshAll();
    this.updateRecruitCost();
    showToast(this, `Recruited ${name} (${randomClass})`, 'success');
  }

  getRecruitCost() {
    return 50 + this.gameState.heroes.length * 25;
  }

  updateRecruitCost() {
    if (this.recruitCostText) {
      const cost = this.getRecruitCost();
      this.recruitCostText.setText(`Cost: ${cost}g`);
      this.recruitCostText.setColor(this.economy.getGold() >= cost ? '#888888' : '#664444');
    }
  }

  // ─── Navigation ──────────────────────────────────────────────
  goToDungeon() {
    const validParty = this.party.filter(Boolean);
    if (validParty.length === 0) {
      showToast(this, 'Add at least one hero to your party', 'warning');
      return;
    }

    this.autoSave();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.scene.start('DungeonSelectScene', {
        gameState: {
          heroes: this.gameState.heroes,
          economy: this.economy,
          guild: this.gameState.guild,
          dungeonsCompleted: this.gameState.dungeonsCompleted,
          stats: this.gameState.stats,
          gameContext: this.gameContext,
          persisted: this.buildPersistedState(),
        },
        party: validParty
      });
    });
  }

  // ─── Game State ──────────────────────────────────────────────
  startNewGame() {
    const hero = createStarterHero();
    this.economy.addGold(50);
    this.economy.refreshShop(1);

    this.gameState = {
      heroes: [hero],
      guild: { level: 1, upgrades: {}, facilities: {} },
      dungeonsCompleted: {},
      stats: { totalGoldEarned: 50, totalDungeons: 0, totalKills: 0 }
    };
  }

  loadFromSave(saveData) {
    this.gameState = {
      heroes: saveData.heroes.map(h => Hero.deserialize(h)),
      guild: saveData.guild || { level: 1, upgrades: {}, facilities: {} },
      dungeonsCompleted: saveData.dungeonsCompleted || {},
      stats: saveData.stats || { totalGoldEarned: 0, totalDungeons: 0, totalKills: 0 }
    };
    if (!this.gameState.guild.upgrades) this.gameState.guild.upgrades = {};
    this.economy = EconomySystem.deserialize({
      gold: saveData.gold,
      inventory: saveData.inventory,
      shopInventory: saveData.shopInventory,
      materials: saveData.materials,
    });
    if (saveData.expeditionSystem) {
      this.expeditionSystem.load(saveData.expeditionSystem);
    }
    if (saveData.idleProgressSystem) {
      this.idleProgressSystem.load(saveData.idleProgressSystem);
    }
  }

  restoreParty(partyIds) {
    return partyIds.map(id => this.gameState.heroes.find(h => h.id === id)).filter(Boolean);
  }

  getHeroSpriteKey(hero) {
    const map = {
      paladin: 'hero_paladin',
      warrior: 'hero_warrior',
      mage: 'hero_mage',
      priest: 'hero_priest',
      rogue: 'hero_rogue',
    };
    return map[hero?.className] || 'hero_paladin';
  }

  buildPersistedState() {
    return {
      expeditionSystem: this.expeditionSystem.serialize(),
      idleProgressSystem: this.idleProgressSystem.serialize(),
      materials: this.economy.getMaterials(),
      shopInventory: this.economy.shopInventory,
      ...serializeGameContext(this.gameContext),
    };
  }

  async autoSave() {
    await this.saveSystem.save({
      gold: this.economy.getGold(),
      heroes: this.gameState.heroes,
      guild: this.gameState.guild,
      inventory: this.economy.inventory,
      shopInventory: this.economy.shopInventory,
      materials: this.economy.getMaterials(),
      party: this.party,
      dungeonsCompleted: this.gameState.dungeonsCompleted,
      stats: this.gameState.stats,
      expeditionSystem: this.expeditionSystem.serialize(),
      idleProgressSystem: this.idleProgressSystem.serialize(),
      ...serializeGameContext(this.gameContext),
    });
  }

  shutdown() {
    this.autoSave();
  }

  // ─── Offline Rewards ─────────────────────────────────────────

  processOfflineRewards() {
    const rewards = this.idleProgressSystem.processOfflineRewards(
      this.gameState,
      this.gameState.heroes,
      this.gameState.guild.upgrades || {}
    );

    if (!rewards || rewards.cappedMinutes <= 0) {
      this.offlineRewards = null;
      return;
    }

    // Apply gold rewards
    if (rewards.goldEarned > 0) {
      this.economy.applyOfflineGold(rewards.cappedMinutes, {
        level: this.gameState.guild.level,
        upgrades: this.gameState.guild.upgrades || {}
      });
    }

    // Apply XP rewards to each hero
    if (rewards.heroXP) {
      for (const heroId in rewards.heroXP) {
        const hero = this.gameState.heroes.find(h => h.id === heroId);
        if (hero && hero.isAlive()) {
          hero.applyIdleXP(rewards.heroXP[heroId]);
        }
      }
    }

    this.offlineRewards = rewards;
  }

  showOfflineRewardsPopup() {
    if (this.offlineRewardsPopupOpen) return;
    if (!this.offlineRewards) return;

    this.offlineRewardsPopupOpen = true;
    this.offlineRewardsEls = [];

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.75);
    bg.fillRect(0, 0, 800, 600);
    this.offlineRewardsEls.push(bg);

    const p = createPanel(this, 150, 100, 500, 350, 'Welcome Back!');
    this.offlineRewardsEls.push(p.graphics);
    if (p.titleText) this.offlineRewardsEls.push(p.titleText);

    // Subtitle
    const subtitle = this.add.text(400, 150, 'Your guild has been busy while you were away', {
      fontFamily: FONT_SERIF,
      fontSize: '14px',
      color: '#9999bb',
      fontStyle: 'italic'
    }).setOrigin(0.5).setDepth(202);
    this.offlineRewardsEls.push(subtitle);

    // Time away info
    const hours = Math.floor(this.offlineRewards.cappedMinutes / 60);
    const minutes = this.offlineRewards.cappedMinutes % 60;
    const timeText = this.add.text(400, 185, `Time away: ${hours}h ${minutes}m${this.offlineRewards.wasCapped ? ' (capped at 8h)' : ''}`, {
      fontFamily: FONT_MONO,
      fontSize: '13px',
      color: '#777799'
    }).setOrigin(0.5).setDepth(202);
    this.offlineRewardsEls.push(timeText);

    // Gold earned
    const goldText = this.add.text(400, 230, `\u25C6 ${this.offlineRewards.goldEarned} gold earned`, {
      fontFamily: FONT_SERIF,
      fontSize: '18px',
      color: '#ddaa00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(202);
    this.offlineRewardsEls.push(goldText);

    // XP earned summary
    let totalXP = 0;
    if (this.offlineRewards.heroXP) {
      for (const xp of Object.values(this.offlineRewards.heroXP)) {
        totalXP += xp;
      }
    }

    if (totalXP > 0) {
      const xpText = this.add.text(400, 260, `Your heroes gained ${totalXP} total XP`, {
        fontFamily: FONT_SERIF,
        fontSize: '14px',
        color: '#88cc88'
      }).setOrigin(0.5).setDepth(202);
      this.offlineRewardsEls.push(xpText);
    }

    // Passive income rate
    const guildState = {
      level: this.gameState.guild.level,
      upgrades: this.gameState.guild.upgrades || {}
    };
    const ratePerMin = this.economy.calculatePassiveGoldPerMinute(guildState);
    const rateText = this.add.text(400, 290, `Current rate: ${ratePerMin.toFixed(1)} gold/min`, {
      fontFamily: FONT_MONO,
      fontSize: '12px',
      color: '#666688'
    }).setOrigin(0.5).setDepth(202);
    this.offlineRewardsEls.push(rateText);

    // Claim button
    const claimBtn = createButton(this, 340, 380, 'Claim', () => this.closeOfflineRewardsPopup(), 120);
    claimBtn.graphics.setDepth(201);
    claimBtn.text.setDepth(202);
    this.offlineRewardsEls.push(claimBtn.graphics, claimBtn.text);
  }

  closeOfflineRewardsPopup() {
    this.offlineRewardsPopupOpen = false;
    for (const el of this.offlineRewardsEls || []) el.destroy();
    this.offlineRewardsEls = [];
    this.offlineRewards = null;
    this.refreshAll();
    this.onPopupClosed();
  }

  // ─── Expedition System ───────────────────────────────────────

  startExpeditionUpdateLoop() {
    if (this.expeditionUpdateTimer) return;

    this.expeditionUpdateTimer = this.time.addEvent({
      delay: 1000, // Update every second
      loop: true,
      callback: () => this.updateExpeditions()
    });
  }

  updateExpeditions() {
    const completed = this.expeditionSystem.update();

    if (completed.length > 0) {
      this.handleCompletedExpeditions(completed);
    }
  }

  handleCompletedExpeditions(completedExpeditions) {
    for (const expedition of completedExpeditions) {
      // Apply rewards
      if (expedition.result.success && expedition.result.rewards) {
        const rewards = expedition.result.rewards;

        if (rewards.gold > 0) {
          this.economy.addGold(rewards.gold);
        }

        // Apply rewards to heroes
        for (const heroData of expedition.heroes) {
          const hero = this.gameState.heroes.find(h => h.id === heroData.id);
          if (hero) {
            hero.applyExpeditionRewards(expedition.result);
          }
        }

        // Add gear to inventory
        if (rewards.gear && rewards.gear.length > 0) {
          for (const gearData of rewards.gear) {
            const gear = this.economy.generateGear(gearData.rarity);
            this.economy.addToInventory(gear);
          }
        }

        // Add materials
        if (rewards.materials && rewards.materials.length > 0) {
          for (const material of rewards.materials) {
            this.economy.addMaterial(material.type, material.amount);
          }
        }
      } else {
        // Failure - apply outcomes to heroes
        for (const heroData of expedition.heroes) {
          const hero = this.gameState.heroes.find(h => h.id === heroData.id);
          if (hero) {
            hero.applyExpeditionRewards(expedition.result);
          }
        }
      }
    }

    // Show notification popup
    this.queuePopup(() => this.showExpeditionResultsPopup(completedExpeditions));
    this.refreshAll();
  }

  queuePopup(fn) {
    this.pendingPopupQueue.push(fn);
    this.drainPopupQueue();
  }

  drainPopupQueue() {
    if (this._popupShowing || this.pendingPopupQueue.length === 0) return;
    if (this.offlineRewardsPopupOpen || this.expeditionResultsOpen || this.dashboardOpen) return;
    this._popupShowing = true;
    const fn = this.pendingPopupQueue.shift();
    fn();
  }

  onPopupClosed() {
    this._popupShowing = false;
    this.time.delayedCall(300, () => this.drainPopupQueue());
  }

  showExpeditionResultsPopup(expeditions) {
    if (this.expeditionResultsPopupOpen) return;

    this.expeditionResultsPopupOpen = true;
    this.expeditionResultsEls = [];

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRect(0, 0, 800, 600);
    this.expeditionResultsEls.push(bg);

    const p = createPanel(this, 100, 80, 600, 440, 'Expedition Results');
    this.expeditionResultsEls.push(p.graphics);
    if (p.titleText) this.expeditionResultsEls.push(p.titleText);

    let sy = p.contentY;
    const maxShow = 4;
    const toShow = expeditions.slice(0, maxShow);

    toShow.forEach((expedition, i) => {
      const isSuccess = expedition.result.success;
      const statusColor = isSuccess ? '#88cc88' : '#cc6644';
      const statusText = isSuccess ? 'SUCCESS' : 'FAILED';

      // Expedition name
      this.add.text(p.x + 12, sy, expedition.name, {
        fontFamily: FONT_SERIF,
        fontSize: '14px',
        color: '#ddddee',
        fontStyle: 'bold'
      }).setDepth(202);

      // Status
      this.add.text(p.x + p.w - 12, sy, statusText, {
        fontFamily: FONT_MONO,
        fontSize: '12px',
        color: statusColor,
        fontStyle: 'bold'
      }).setOrigin(1, 0).setDepth(202);

      sy += 18;

      // Heroes
      const heroNames = expedition.heroes.map(h => h.name).join(', ');
      this.add.text(p.x + 12, sy, `Heroes: ${heroNames}`, {
        fontFamily: FONT_MONO,
        fontSize: '11px',
        color: '#777799'
      }).setDepth(202);

      sy += 16;

      // Rewards or failure details
      if (isSuccess && expedition.result.rewards) {
        const rewards = expedition.result.rewards;
        const rewardParts = [];
        if (rewards.gold > 0) rewardParts.push(`\u25C6 ${rewards.gold} gold`);
        if (rewards.xp > 0) rewardParts.push(`${rewards.xp} XP`);
        if (rewards.gear && rewards.gear.length > 0) rewardParts.push(`${rewards.gear.length} gear`);
        if (rewards.materials && rewards.materials.length > 0) rewardParts.push(`${rewards.materials.length} materials`);

        if (rewardParts.length > 0) {
          this.add.text(p.x + 12, sy, `Rewards: ${rewardParts.join(', ')}`, {
            fontFamily: FONT_MONO,
            fontSize: '11px',
            color: '#88cc88'
          }).setDepth(202);
        }
      } else {
        // Show injuries/deaths
        const deaths = expedition.result.heroOutcomes.filter(o => o.died).length;
        const injuries = expedition.result.heroOutcomes.filter(o => o.injured && !o.died).length;
        if (deaths > 0 || injuries > 0) {
          const lossParts = [];
          if (deaths > 0) lossParts.push(`${deaths} killed`);
          if (injuries > 0) lossParts.push(`${injuries} injured`);
          this.add.text(p.x + 12, sy, `Casualties: ${lossParts.join(', ')}`, {
            fontFamily: FONT_MONO,
            fontSize: '11px',
            color: '#cc6644'
          }).setDepth(202);
        }
      }

      sy += 24;

      // Separator
      if (i < toShow.length - 1) {
        const sep = this.add.graphics();
        sep.lineStyle(1, 0x2a2850, 0.3);
        sep.beginPath();
        sep.moveTo(p.x + 12, sy - 4);
        sep.lineTo(p.x + p.w - 12, sy - 4);
        sep.strokePath();
        sep.setDepth(201);
        this.expeditionResultsEls.push(sep);
      }
    });

    if (expeditions.length > maxShow) {
      this.add.text(p.x + p.w / 2, p.y + p.h - 30, `+${expeditions.length - maxShow} more expeditions completed`, {
        fontFamily: FONT_SERIF,
        fontSize: '11px',
        color: '#666688',
        fontStyle: 'italic'
      }).setOrigin(0.5).setDepth(202);
    }

    const closeBtn = createButton(this, 340, p.y + p.h - 28, 'Continue', () => this.closeExpeditionResultsPopup(), 120);
    closeBtn.graphics.setDepth(201);
    closeBtn.text.setDepth(202);
    this.expeditionResultsEls.push(closeBtn.graphics, closeBtn.text);
  }

  closeExpeditionResultsPopup() {
    this.expeditionResultsPopupOpen = false;
    for (const el of this.expeditionResultsEls || []) el.destroy();
    this.expeditionResultsEls = [];
    this.onPopupClosed();
  }

  toggleExpeditions() {
    if (this.expeditionPopupOpen) this.closeExpeditionPopup();
    else this.openExpeditionPopup();
  }

  openExpeditionPopup() {
    this.expeditionPopupOpen = true;
    this.expeditionPopupEls = [];

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.75);
    bg.fillRect(0, 0, 800, 600);
    this.expeditionPopupEls.push(bg);

    const p = createPanel(this, 50, 40, 700, 520, 'Expeditions');
    this.expeditionPopupEls.push(p.graphics);
    if (p.titleText) this.expeditionPopupEls.push(p.titleText);

    // Show active expeditions at top
    const activeExpeditions = Array.from(this.expeditionSystem.activeExpeditions.values());
    let sy = p.contentY;

    if (activeExpeditions.length > 0) {
      this.add.text(p.x + 12, sy, 'Active Expeditions', {
        fontFamily: FONT_SERIF,
        fontSize: '14px',
        color: '#9999bb',
        fontStyle: 'bold'
      }).setDepth(202);
      sy += 20;

      for (const expedition of activeExpeditions) {
        // Expedition card background
        const cardBg = this.add.graphics();
        cardBg.fillStyle(0x1a1a2e, 0.6);
        cardBg.fillRoundedRect(p.x + 12, sy, p.w - 24, 50, 3);
        cardBg.lineStyle(1, 0x3a3860, 0.4);
        cardBg.strokeRoundedRect(p.x + 12, sy, p.w - 24, 50, 3);
        cardBg.setDepth(201);
        this.expeditionPopupEls.push(cardBg);

        // Expedition name
        this.add.text(p.x + 20, sy + 4, expedition.name, {
          fontFamily: FONT_SERIF,
          fontSize: '13px',
          color: '#ddddee',
          fontStyle: 'bold'
        }).setDepth(202);

        // Heroes
        const heroNames = expedition.heroes.map(h => h.name).join(', ');
        this.add.text(p.x + 20, sy + 22, `Heroes: ${heroNames}`, {
          fontFamily: FONT_MONO,
          fontSize: '10px',
          color: '#777799'
        }).setDepth(202);

        // Progress bar
        const barW = 200;
        const barH = 8;
        const barX = p.x + p.w - barW - 80;
        const barY = sy + 20;

        const barBg = this.add.graphics();
        barBg.fillStyle(0x0a0812, 1);
        barBg.fillRoundedRect(barX, barY, barW, barH, 2);
        barBg.setDepth(202);
        this.expeditionPopupEls.push(barBg);

        const barFill = this.add.graphics();
        barFill.fillStyle(0x6666cc, 0.9);
        barFill.fillRoundedRect(barX, barY, Math.floor(barW * expedition.progress / 100), barH, 2);
        barFill.setDepth(203);
        this.expeditionPopupEls.push(barFill);

        // Progress text
        const remainingMs = expedition.endTime - Date.now();
        const remainingMin = Math.max(0, Math.ceil(remainingMs / 60000));
        this.add.text(p.x + p.w - 12, sy + 8, `${formatDuration(remainingMin)} left`, {
          fontFamily: FONT_MONO,
          fontSize: '11px',
          color: '#9999bb'
        }).setOrigin(1, 0).setDepth(202);

        // Cancel button
        const cancelBtn = this.add.text(p.x + p.w - 12, sy + 30, 'Cancel', {
          fontFamily: FONT_MONO,
          fontSize: '11px',
          color: '#cc6644',
          fontStyle: 'bold'
        }).setOrigin(1, 0).setDepth(202);

        cancelBtn.setInteractive({ useHandCursor: true });
        cancelBtn.on('pointerover', () => cancelBtn.setColor('#ff8877'));
        cancelBtn.on('pointerout', () => cancelBtn.setColor('#cc6644'));
        cancelBtn.on('pointerdown', () => {
          this.expeditionSystem.cancelExpedition(expedition.id);
          this.closeExpeditionPopup();
          this.openExpeditionPopup();
        });
        this.expeditionPopupEls.push(cancelBtn);

        sy += 56;
      }

      // Separator
      sy += 8;
      const sep = this.add.graphics();
      sep.lineStyle(1, 0x2a2850, 0.4);
      sep.beginPath();
      sep.moveTo(p.x + 12, sy);
      sep.lineTo(p.x + p.w - 12, sy);
      sep.strokePath();
      sep.setDepth(201);
      this.expeditionPopupEls.push(sep);
      sy += 8;
    }

    // Available expeditions
    this.add.text(p.x + 12, sy, 'Available Expeditions', {
      fontFamily: FONT_SERIF,
      fontSize: '14px',
      color: '#9999bb',
      fontStyle: 'bold'
    }).setDepth(202);
    sy += 20;

    // Get available expeditions for current party
    const validParty = this.party.filter(Boolean);
    const availableExpeditions = this.expeditionSystem.getAvailableExpeditionsForParty(
      validParty,
      this.gameState
    );

    if (availableExpeditions.length === 0) {
      this.add.text(p.x + p.w / 2, sy, 'No expeditions available. Recruit more heroes or level up.', {
        fontFamily: FONT_SERIF,
        fontSize: '12px',
        color: '#666688',
        fontStyle: 'italic'
      }).setOrigin(0.5).setDepth(202);
    } else {
      const maxExpeditions = Math.min(availableExpeditions.length, 3);
      for (let i = 0; i < maxExpeditions; i++) {
        const exp = availableExpeditions[i];
        const typeData = EXPEDITION_TYPES[exp.type];

        // Expedition card
        const cardBg = this.add.graphics();
        cardBg.fillStyle(0x121020, 0.7);
        cardBg.fillRoundedRect(p.x + 12, sy, p.w - 24, 70, 3);
        cardBg.lineStyle(1, 0x2a2850, 0.4);
        cardBg.strokeRoundedRect(p.x + 12, sy, p.w - 24, 70, 3);
        cardBg.setDepth(201);
        this.expeditionPopupEls.push(cardBg);

        // Type indicator
        const typeIndicator = this.add.graphics();
        typeIndicator.fillStyle(parseInt(typeData.color.replace('#', ''), 16), 0.5);
        typeIndicator.fillRect(p.x + 12, sy, 3, 70);
        typeIndicator.setDepth(201);
        this.expeditionPopupEls.push(typeIndicator);

        // Name
        this.add.text(p.x + 20, sy + 4, exp.name, {
          fontFamily: FONT_SERIF,
          fontSize: '13px',
          color: '#ddddee',
          fontStyle: 'bold'
        }).setDepth(202);

        // Description
        this.add.text(p.x + 20, sy + 20, exp.description, {
          fontFamily: FONT_SERIF,
          fontSize: '10px',
          color: '#777799',
          fontStyle: 'italic'
        }).setDepth(202);

        // Details
        const duration = formatDuration(exp.getDurationMinutes());
        const successChance = Math.floor(exp.getSuccessChance(
          Math.floor(validParty.reduce((s, h) => s + h.level, 0) / validParty.length)
        ) * 100);

        this.add.text(p.x + 20, sy + 38, `Duration: ${duration} | Success: ${successChance}% | Heroes: ${exp.minHeroes}-${exp.maxHeroes}`, {
          fontFamily: FONT_MONO,
          fontSize: '10px',
          color: '#666688'
        }).setDepth(202);

        // Start button
        const startBtn = createButton(this, p.x + p.w - 90, sy + 25, 'Start', () => {
          this.startExpeditionAction(exp);
        }, 70);
        startBtn.graphics.setDepth(202);
        startBtn.text.setDepth(203);
        this.expeditionPopupEls.push(startBtn.graphics, startBtn.text);

        sy += 76;
      }
    }

    // Close button
    const closeBtn = createButton(this, p.x + p.w / 2 - 50, p.y + p.h - 28, 'Close', () => this.closeExpeditionPopup(), 100);
    closeBtn.graphics.setDepth(201);
    closeBtn.text.setDepth(202);
    this.expeditionPopupEls.push(closeBtn.graphics, closeBtn.text);
  }

  startExpeditionAction(expeditionDef) {
    const validParty = this.party.filter(Boolean);

    if (validParty.length < expeditionDef.minHeroes) {
      showToast(this, `Need at least ${expeditionDef.minHeroes} heroes in party`, 'warning');
      return;
    }

    const result = this.expeditionSystem.startExpedition(
      expeditionDef.id,
      validParty,
      this.gameState
    );

    if (!result.success) {
      showToast(this, result.error || 'Could not start expedition', 'error');
      return;
    }

    showToast(this, `Expedition started: ${expeditionDef.name}`, 'success');

    this.closeExpeditionPopup();
    this.openExpeditionPopup();
  }

  closeExpeditionPopup() {
    this.expeditionPopupOpen = false;
    for (const el of this.expeditionPopupEls || []) el.destroy();
    this.expeditionPopupEls = [];
  }

  // ─── Dashboard (Phase 4A) ──────────────────────────────────

  toggleDashboard() {
    if (this.dashboardOpen) this.closeDashboard();
    else this.openDashboard();
  }

  openDashboard() {
    if (this.dashboardOpen) return;
    this.dashboardOpen = true;

    this.dashboardController = openDashboard(this, {
      economy: this.economy,
      gameState: this.gameState,
      expeditionSystem: this.expeditionSystem
    }, {
      onClose: () => this.closeDashboard(),
      onShop: () => { this.closeDashboard(); this.toggleShop(); },
      onDungeon: () => { this.closeDashboard(); this.goToDungeon(); },
      onExpeditions: () => { this.closeDashboard(); this.toggleExpeditions(); }
    });

    // Refresh only the dynamic values every 2s (UI is built once).
    this.dashboardRefreshTimer = this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        if (this.dashboardOpen && this.dashboardController) this.dashboardController.refresh();
      }
    });
  }

  closeDashboard() {
    this.dashboardOpen = false;
    if (this.dashboardController) {
      this.dashboardController.close();
      this.dashboardController = null;
    }
    if (this.dashboardRefreshTimer) {
      this.dashboardRefreshTimer.remove();
      this.dashboardRefreshTimer = null;
    }
  }

  // ─── Auto-Equip (Phase 4B) ─────────────────────────────────

  handleAutoEquip() {
    if (!this.selectedHero) return;

    const swaps = autoEquipBest(this.selectedHero, this.economy);
    if (swaps.length === 0) return;

    for (const swap of swaps) {
      // Unequip old → inventory
      if (swap.oldItem) {
        this.selectedHero.unequip(swap.slot);
        this.economy.addToInventory(swap.oldItem);
      }
      // Equip new → remove from inventory
      this.selectedHero.equip(swap.slot, swap.newItem);
      this.economy.removeFromInventory(swap.newItem.id);
    }

    this.refreshAll();
  }

  // ─── Upgrades ────────────────────────────────────────────────

  toggleUpgrades() {
    if (this.upgradesPopupOpen) this.closeUpgradesPopup();
    else this.openUpgradesPopup();
  }

  openUpgradesPopup() {
    if (this.upgradesPopupOpen) return;
    this.upgradesPopupOpen = true;
    this.upgradesPopupEls = [];

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.75);
    bg.fillRect(0, 0, 800, 600);
    this.upgradesPopupEls.push(bg);

    const p = createPanel(this, 80, 50, 640, 480, 'Guild Upgrades');
    this.upgradesPopupEls.push(p.graphics, p.titleText);

    const mats = this.economy.getMaterials();
    const matSummary = Object.keys(mats).length
      ? Object.entries(mats).map(([k, v]) => `${k}:${v}`).join('  ')
      : 'No materials yet — run material expeditions';
    const matText = this.add.text(p.x + 12, p.contentY, matSummary, {
      fontFamily: FONT_MONO, fontSize: '12px', color: '#888899',
    });
    this.upgradesPopupEls.push(matText);

    let sy = p.contentY + 24;
    for (const def of GUILD_UPGRADES) {
      const level = getUpgradeLevel(this.gameState.guild, def.id);
      const check = canPurchaseUpgrade(this.gameState.guild, this.economy, def);

      const nameText = this.add.text(p.x + 12, sy, `${def.name}  Lv.${level}/${def.maxLevel}`, {
        fontFamily: FONT_SERIF, fontSize: '14px', color: '#ddddee', fontStyle: 'bold',
      }).setDepth(201);
      const descText = this.add.text(p.x + 12, sy + 18, def.description, {
        fontFamily: FONT_MONO, fontSize: '11px', color: '#777799',
      }).setDepth(201);
      this.upgradesPopupEls.push(nameText, descText);

      const costLabel = level >= def.maxLevel
        ? 'MAX'
        : `${def.goldCost(level)}g + ${Object.entries(def.materials(level)).map(([k, v]) => `${v} ${k}`).join(', ')}`;

      const buyBtn = createButton(this, p.x + p.w - 130, sy + 4, level >= def.maxLevel ? 'Maxed' : 'Upgrade', () => {
        const result = purchaseUpgrade(this.gameState.guild, this.economy, def);
        if (!result.ok) {
          showToast(this, result.reason, 'error');
          return;
        }
        showToast(this, `${def.name} upgraded to Lv.${result.newLevel}`, 'success');
        this.closeUpgradesPopup();
        this.openUpgradesPopup();
        this.refreshAll();
      }, 110, 28);
      buyBtn.graphics.setDepth(201);
      buyBtn.text.setDepth(202);
      this.upgradesPopupEls.push(buyBtn.graphics, buyBtn.text);

      const costText = this.add.text(p.x + 280, sy + 10, costLabel, {
        fontFamily: FONT_MONO, fontSize: '11px', color: check.ok ? '#88aa55' : '#664444',
      }).setDepth(201);
      this.upgradesPopupEls.push(costText);

      sy += 56;
    }

    const closeBtn = createButton(this, p.x + p.w / 2 - 50, p.y + p.h - 32, 'Close', () => this.closeUpgradesPopup(), 100);
    closeBtn.graphics.setDepth(201);
    closeBtn.text.setDepth(202);
    this.upgradesPopupEls.push(closeBtn.graphics, closeBtn.text);
  }

  closeUpgradesPopup() {
    this.upgradesPopupOpen = false;
    for (const el of this.upgradesPopupEls || []) el.destroy();
    this.upgradesPopupEls = [];
  }

  // ─── Help & Tutorial ─────────────────────────────────────────

  handlePrestigeHero(hero) {
    const points = this.gameContext.prestigeSystem.prestigeHero(hero);
    if (points > 0) {
      showToast(this, `${hero.name} ascended! +${points} prestige points`, 'success');
      this.refreshAll();
      this.autoSave();
    }
  }

  toggleSkills() {
    if (this.skillsPopupOpen) this.closeSkillsPopup();
    else this.openSkillsPopup();
  }

  openSkillsPopup() {
    if (!this.selectedHero || this.skillsPopupOpen) return;
    this.skillsPopupOpen = true;
    this.skillsPopupEls = [];

    const hero = this.selectedHero;
    const tree = getClassSkills(hero.className);
    if (!tree) {
      showToast(this, 'No skill tree for this class', 'warning');
      this.skillsPopupOpen = false;
      return;
    }

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.75);
    bg.fillRect(0, 0, 800, 600);
    this.skillsPopupEls.push(bg);

    const p = createPanel(this, 60, 40, 680, 520, `${hero.name} — Skills`);
    this.skillsPopupEls.push(p.graphics, p.titleText);

    const ptsText = this.add.text(p.x + 12, p.contentY, `Available points: ${getAvailableSkillPoints(hero)}`, {
      fontFamily: FONT_MONO, fontSize: '12px', color: '#88aa55',
    });
    this.skillsPopupEls.push(ptsText);

    let sy = p.contentY + 22;
    for (const branchKey of Object.keys(tree.branches)) {
      const branch = tree.branches[branchKey];
      const branchLabel = this.add.text(p.x + 12, sy, branch.name, {
        fontFamily: FONT_SERIF, fontSize: '13px', color: '#aaaacc', fontStyle: 'bold',
      });
      this.skillsPopupEls.push(branchLabel);
      sy += 18;

      branch.skills.forEach((skill, idx) => {
        const unlocked = hero.unlockedSkills.includes(skill.id);
        const canUnlock = !unlocked && canUnlockSkill(tree, branchKey, idx, hero.unlockedSkills)
          && getAvailableSkillPoints(hero) >= skill.cost;

        const label = `${unlocked ? '✓' : '○'} ${skill.name} (${skill.cost}pt)`;
        const btn = createButton(this, p.x + 24, sy, label.substring(0, 22), () => {
          if (unlocked || !canUnlock) return;
          hero.unlockedSkills.push(skill.id);
          showToast(this, `Unlocked ${skill.name}`, 'success');
          this.closeSkillsPopup();
          this.openSkillsPopup();
          this.refreshDetail();
        }, 200, 24);
        btn.graphics.setDepth(201);
        btn.text.setDepth(202);
        if (!canUnlock && !unlocked) btn.text.setAlpha(0.5);
        this.skillsPopupEls.push(btn.graphics, btn.text);
        sy += 28;
      });
      sy += 8;
    }

    const closeBtn = createButton(this, p.x + p.w / 2 - 50, p.y + p.h - 32, 'Close', () => this.closeSkillsPopup(), 100);
    closeBtn.graphics.setDepth(201);
    closeBtn.text.setDepth(202);
    this.skillsPopupEls.push(closeBtn.graphics, closeBtn.text);
  }

  closeSkillsPopup() {
    this.skillsPopupOpen = false;
    for (const el of this.skillsPopupEls || []) el.destroy();
    this.skillsPopupEls = [];
  }

  togglePrestigeShop() {
    if (this.prestigePopupOpen) this.closePrestigePopup();
    else this.openPrestigePopup();
  }

  openPrestigePopup() {
    if (this.prestigePopupOpen) return;
    this.prestigePopupOpen = true;
    this.prestigePopupEls = [];
    const ps = this.gameContext.prestigeSystem;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.75);
    bg.fillRect(0, 0, 800, 600);
    this.prestigePopupEls.push(bg);

    const p = createPanel(this, 80, 50, 640, 480, 'Prestige Upgrades');
    this.prestigePopupEls.push(p.graphics, p.titleText);

    const pts = this.add.text(p.x + 12, p.contentY, `Prestige points: ${ps.globalPrestigePoints}`, {
      fontFamily: FONT_MONO, fontSize: '13px', color: '#ddaa00',
    });
    this.prestigePopupEls.push(pts);

    let sy = p.contentY + 24;
    for (const upgrade of Object.values(PRESTIGE_UPGRADES)) {
      const rank = ps.getUpgradeRank(upgrade.id);
      const nameText = this.add.text(p.x + 12, sy, `${upgrade.name} (${rank}/${upgrade.maxRank})`, {
        fontFamily: FONT_SERIF, fontSize: '13px', color: '#ddddee',
      });
      this.prestigePopupEls.push(nameText);

      const buyBtn = createButton(this, p.x + p.w - 120, sy - 2, rank >= upgrade.maxRank ? 'Max' : 'Buy', () => {
        if (!ps.purchaseUpgrade(upgrade.id)) {
          showToast(this, 'Not enough prestige points', 'error');
          return;
        }
        showToast(this, `${upgrade.name} upgraded`, 'success');
        this.closePrestigePopup();
        this.openPrestigePopup();
      }, 90, 24);
      buyBtn.graphics.setDepth(201);
      buyBtn.text.setDepth(202);
      this.prestigePopupEls.push(buyBtn.graphics, buyBtn.text);
      sy += 32;
    }

    const closeBtn = createButton(this, p.x + p.w / 2 - 50, p.y + p.h - 32, 'Close', () => this.closePrestigePopup(), 100);
    closeBtn.graphics.setDepth(201);
    closeBtn.text.setDepth(202);
    this.prestigePopupEls.push(closeBtn.graphics, closeBtn.text);
  }

  closePrestigePopup() {
    this.prestigePopupOpen = false;
    for (const el of this.prestigePopupEls || []) el.destroy();
    this.prestigePopupEls = [];
  }

  async toggleSettings() {
    const exported = await this.saveSystem.exportSave();
    createConfirmDialog(this, {
      title: 'Save Data',
      message: exported
        ? 'Copy this code to backup your save, or paste a code to import.\n\nExport code is in browser console (F12).'
        : 'No save data to export.',
      confirmLabel: 'Export to Console',
      cancelLabel: 'Close',
      onConfirm: () => {
        if (exported) {
          console.log('IDLE MINDS SAVE EXPORT:', exported);
          showToast(this, 'Save exported to browser console (F12)', 'success');
        }
      },
    });
  }

  toggleHelpOverlay() {
    if (this.helpOverlayOpen) this.closeHelpOverlay();
    else this.openHelpOverlay();
  }

  openHelpOverlay() {
    if (this.helpOverlayOpen) return;
    this.helpOverlayOpen = true;
    this.helpOverlayEls = [];

    const bg = this.add.graphics().setDepth(300);
    bg.fillStyle(0x000000, 0.85);
    bg.fillRect(0, 0, 800, 600);
    this.helpOverlayEls.push(bg);

    const p = createPanel(this, 100, 60, 600, 420, 'Help');
    p.graphics.setDepth(301);
    if (p.titleText) p.titleText.setDepth(302);
    this.helpOverlayEls.push(p.graphics, p.titleText);

    const lines = [
      'KEYBOARD SHORTCUTS',
      'D — Dashboard    G — Dungeon    E — Expeditions',
      'S — Shop         R — Recruit    ? — Help    Esc — Close',
      '',
      'PARTY',
      'Select a hero in the roster, then click a party slot.',
      'Click a filled slot to remove that hero.',
      '',
      'UPGRADES',
      'Earn materials from expeditions. Spend gold + materials',
      'on guild upgrades for passive gold bonuses.',
      '',
      'Sign in on the website to sync saves to the cloud.',
    ];

    const txt = this.add.text(p.x + 16, p.contentY, lines.join('\n'), {
      fontFamily: FONT_MONO, fontSize: '13px', color: '#aaaacc', lineSpacing: 6,
    }).setDepth(302);
    this.helpOverlayEls.push(txt);

    const closeBtn = createButton(this, p.x + p.w / 2 - 50, p.y + p.h - 36, 'Close', () => this.closeHelpOverlay(), 100);
    closeBtn.graphics.setDepth(302);
    closeBtn.text.setDepth(303);
    this.helpOverlayEls.push(closeBtn.graphics, closeBtn.text);
  }

  closeHelpOverlay() {
    this.helpOverlayOpen = false;
    for (const el of this.helpOverlayEls || []) el.destroy();
    this.helpOverlayEls = [];
  }

  maybeShowTutorial() {
    if (localStorage.getItem('idle_minds_tutorial_done')) return;
    this.time.delayedCall(800, () => {
      if (!this.scene.isActive()) return;
      createConfirmDialog(this, {
        title: 'Welcome',
        message: 'Build your party, recruit heroes, and conquer dungeons!\n\nTip: Select a hero, click a party slot, then press G for Dungeon.',
        confirmLabel: 'Got it',
        cancelLabel: 'Skip',
        onConfirm: () => localStorage.setItem('idle_minds_tutorial_done', '1'),
        onCancel: () => localStorage.setItem('idle_minds_tutorial_done', '1'),
      });
    });
  }

  // ─── Keyboard Shortcuts (Phase 4D) ─────────────────────────

  setupKeyboardShortcuts() {
    if (!this.input || !this.input.keyboard) return;

    this.keyboardKeys = this.input.keyboard.addKeys('D,E,S,R,X,G');
    this.keyboardKeys.X.on('down', () => this.handleKeyboardShortcuts('X'));
    this.keyboardKeys.D.on('down', () => this.handleKeyboardShortcuts('D'));
    this.keyboardKeys.E.on('down', () => this.handleKeyboardShortcuts('E'));
    this.keyboardKeys.S.on('down', () => this.handleKeyboardShortcuts('S'));
    this.keyboardKeys.R.on('down', () => this.handleKeyboardShortcuts('R'));
    this.keyboardKeys.G.on('down', () => this.handleKeyboardShortcuts('G'));
    this.input.keyboard.on('keydown-ESC', () => this.handleKeyboardShortcuts('ESC'));
    this.input.keyboard.on('keydown-QUESTION', () => this.toggleHelpOverlay());
  }

  handleKeyboardShortcuts(key) {
    if (key === 'ESC') {
      if (this.skillsPopupOpen) return this.closeSkillsPopup();
      if (this.prestigePopupOpen) return this.closePrestigePopup();
      if (this.helpOverlayOpen) return this.closeHelpOverlay();
      if (this.upgradesPopupOpen) return this.closeUpgradesPopup();
      if (this.dashboardOpen) return this.closeDashboard();
      if (this.shopOpen) return this.closeShop();
      if (this.expeditionPopupOpen) return this.closeExpeditionPopup();
      if (this.gearPopupOpen) return this.closeGearPopup();
      if (this.offlineRewardsPopupOpen) return this.closeOfflineRewardsPopup();
      if (this.expeditionResultsPopupOpen) return this.closeExpeditionResultsPopup();
      return;
    }
    // X closes the dashboard (legacy)
    if (this.dashboardOpen && key === 'X') {
      this.closeDashboard();
      return;
    }
    if (this.dashboardOpen) return; // Block other shortcuts while dashboard open

    switch (key) {
      case 'D': this.toggleDashboard(); break;
      case 'G': this.goToDungeon(); break;
      case 'E': this.toggleExpeditions(); break;
      case 'S': this.toggleShop(); break;
      case 'R': this.recruitHero(); break;
    }
  }
}