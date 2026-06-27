import { Hero, createStarterHero } from '../systems/HeroSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { RARITIES } from '../data/gear.js';
import { CLASSES, HERO_NAMES } from '../data/classes.js';
import { createPanel, createButton, createStatBar, createDivider, createGoldDisplay } from '../ui/Panels.js';

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

    if (data && data.saveData) {
      this.loadFromSave(data.saveData);
    } else {
      this.startNewGame();
    }

    this.selectedHero = this.gameState.heroes[0] || null;
    this.party = (data && data.saveData && data.saveData.party)
      ? this.restoreParty(data.saveData.party)
      : [this.selectedHero].filter(Boolean);

    this.uiElements = [];
    this.statBars = [];
    this.shopOpen = false;
    this.gearPopupOpen = false;

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

    createButton(this, 484, 72, 'Shop', () => this.toggleShop(), 120);
    createButton(this, 484, 108, 'Dungeon', () => this.goToDungeon(), 120);
    createButton(this, 484, 144, 'Recruit', () => this.recruitHero(), 120);

    this.recruitCostText = this.add.text(484, 178, '', {
      fontFamily: FONT_MONO, fontSize: '12px', color: '#888888'
    });

    // Auto-save indicator
    const dot = this.add.graphics();
    dot.fillStyle(0x33aa55, 0.8);
    dot.fillCircle(494, 152, 3);
    this.add.text(502, 147, 'Auto-save', {
      fontFamily: FONT_MONO,
      fontSize: '12px',
      color: '#557755'
    });
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
    if (this.economy.getGold() < cost) return;

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
    if (validParty.length === 0) return;

    this.autoSave();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.scene.start('DungeonSelectScene', {
        gameState: {
          heroes: this.gameState.heroes,
          economy: this.economy,
          guild: this.gameState.guild,
          dungeonsCompleted: this.gameState.dungeonsCompleted,
          stats: this.gameState.stats
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
      guild: { level: 1, facilities: {} },
      dungeonsCompleted: {},
      stats: { totalGoldEarned: 50, totalDungeons: 0, totalKills: 0 }
    };
  }

  loadFromSave(saveData) {
    this.gameState = {
      heroes: saveData.heroes.map(h => Hero.deserialize(h)),
      guild: saveData.guild || { level: 1, facilities: {} },
      dungeonsCompleted: saveData.dungeonsCompleted || {},
      stats: saveData.stats || { totalGoldEarned: 0, totalDungeons: 0, totalKills: 0 }
    };
    this.economy = EconomySystem.deserialize({
      gold: saveData.gold,
      inventory: saveData.inventory,
      shopInventory: saveData.shopInventory
    });
  }

  restoreParty(partyIds) {
    return partyIds.map(id => this.gameState.heroes.find(h => h.id === id)).filter(Boolean);
  }

  getHeroSpriteKey(hero) {
    return 'hero_paladin';
  }

  autoSave() {
    this.saveSystem.save({
      gold: this.economy.getGold(),
      heroes: this.gameState.heroes,
      guild: this.gameState.guild,
      inventory: this.economy.inventory,
      party: this.party,
      dungeonsCompleted: this.gameState.dungeonsCompleted,
      stats: this.gameState.stats
    });
  }

  shutdown() {
    this.autoSave();
  }
}
