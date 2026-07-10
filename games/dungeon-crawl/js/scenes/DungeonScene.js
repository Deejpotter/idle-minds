import { CombatSystem } from '../systems/CombatSystem.js';
import { DungeonSystem } from '../systems/DungeonSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { RARITIES } from '../data/gear.js';
import { createPanel, createButton } from '../ui/Panels.js';

const FONT_SERIF = 'Georgia, "Times New Roman", serif';
const FONT_MONO = '"Courier New", Courier, monospace';
const TILE = 48;
const ROOM_W = 16;
const ROOM_H = 12;
const WANDER_RANGE = TILE * 4;
const AGGRO_RANGE = TILE * 5;
const ATTACK_RANGE = TILE * 1.8;
const MOVE_SPEED = 0.03;
const WANDER_INTERVAL = 2000;

export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super('DungeonScene');
  }

  create(data) {
    this.gameState = data.gameState;
    this.party = data.party;
    this.dungeonData = data.dungeonData;

    this.dungeonSystem = new DungeonSystem();
    this.saveSystem = new SaveSystem();
    this.economy = this.gameState.economy;

    if (this.dungeonData.id.startsWith('quick_')) {
      this.dungeonSystem.currentDungeon = this.dungeonData;
    } else {
      this.dungeonSystem.loadDungeon(this.dungeonData.id);
      if (!this.dungeonSystem.currentDungeon) {
        this.dungeonSystem.currentDungeon = this.dungeonData;
      }
    }

    this.dungeonGoldEarned = 0;
    this.combatSystem = new CombatSystem();
    this.currentRoomIndex = -1;
    this.roomLayout = null;
    this.heroSprites = [];
    this.enemySprites = [];
    this.damageNumbers = [];
    this.transitioning = false;
    this.dungeonFinished = false;
    this.roomGoldEarned = 0;

    this.tilemapGroup = this.add.group();
    this.buildHUD();

    this.cameras.main.setBackgroundColor('#06050e');
    this.cameras.main.setBounds(0, 0, 1600, 1600);

    this.enterRoom();

    this.saveTimer = this.time.addEvent({
      delay: 60000,
      loop: true,
      callback: () => this.autoSave()
    });
  }

  update(time, delta) {
    if (this.transitioning || this.dungeonFinished) return;

    // Regenerate health and mana for alive heroes
    if (!this._lastRegenTick) this._lastRegenTick = 0;
    this._lastRegenTick += delta;
    if (this._lastRegenTick >= 3000) {
      this._lastRegenTick = 0;
      for (const hs of this.heroSprites) {
        if (hs.hero.isAlive()) {
          const stats = hs.hero.getEffectiveStats();
          if (hs.hero.currentHp < stats.hp) {
            hs.hero.currentHp = Math.min(stats.hp, hs.hero.currentHp + Math.ceil(stats.hp * 0.03));
          }
          if (hs.hero.currentMp < stats.mp) {
            hs.hero.currentMp = Math.min(stats.mp, hs.hero.currentMp + Math.ceil(stats.mp * 0.05));
          }
        }
      }
    }

    for (const hs of this.heroSprites) {
      if (hs.hero.isAlive()) this.updateCharacterAI(hs, 'hero', delta);
    }

    for (const es of this.enemySprites) {
      if (es.enemy.currentHp > 0) this.updateCharacterAI(es, 'enemy', delta);
    }

    for (const hs of this.heroSprites) {
      if (hs.hero.isAlive()) {
        const home = hs.sprite;
        hs.hpBg.setPosition(home.x - 18, home.y - 24);
        hs.hpFill.setPosition(home.x - 18, home.y - 24);
        hs.nameText.setPosition(home.x, home.y - 30);
      }
    }

    for (const es of this.enemySprites) {
      if (es.enemy.currentHp > 0) {
        const home = es.sprite;
        es.hpBg.setPosition(home.x - 18, home.y - 24);
        es.hpFill.setPosition(home.x - 18, home.y - 24);
        es.nameText.setPosition(home.x, home.y - 30);
      }
    }

    this.refreshHUD();
  }

  updateCharacterAI(entry, side, delta) {
    const sprite = entry.sprite;
    const unit = entry.hero || entry.enemy;
    const stats = side === 'hero' ? unit.getEffectiveStats() : { speed: unit.speed || 10, attack: unit.attack || 5 };

    // Tick attack cooldown
    if (entry.attackCooldown > 0) {
      entry.attackCooldown -= delta;
    }

    // Find nearest target on the other side
    const targets = side === 'hero' ? this.enemySprites.filter(e => e.enemy.currentHp > 0) :
                                      this.heroSprites.filter(h => h.hero.isAlive());
    if (targets.length === 0) {
      this.wanderCharacter(entry, delta);
      return;
    }

    let nearestTarget = null;
    let nearestDist = Infinity;
    for (const t of targets) {
      const dx = t.sprite.x - sprite.x;
      const dy = t.sprite.y - sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestTarget = t;
      }
    }

    if (!nearestTarget) return;

    const tx = nearestTarget.sprite.x;
    const ty = nearestTarget.sprite.y;

    // ATTACK: if in range and cooldown ready
    if (nearestDist < ATTACK_RANGE && entry.attackCooldown <= 0) {
      const speedStat = stats.speed || 10;
      entry.attackCooldown = Math.max(400, 2000 - (speedStat * 40));

      const event = this.doRealtimeAttack(unit, nearestTarget, side);
      if (event) {
        this.playRealtimeAnimation(unit, nearestTarget, event);
      }
    }
    // CHASE: if within aggro range, move toward target
    else if (nearestDist < AGGRO_RANGE) {
      const dx = tx - sprite.x;
      const dy = ty - sprite.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const moveMult = MOVE_SPEED * delta * (1 + (stats.speed || 10) / 50);
      sprite.x += (dx / d) * moveMult;
      sprite.y += (dy / d) * moveMult;
      if (dx === 0) sprite.setFlipX(false);
      else sprite.setFlipX(dx < 0);
    }
    // WANDER: otherwise wander
    else {
      this.wanderCharacter(entry, delta);
    }
  }

  wanderCharacter(entry, delta) {
    const sprite = entry.sprite;
    const unit = entry.hero || entry.enemy;

    if (!entry._wanderTarget) {
      entry._wanderTimer = 0;
    }
    entry._wanderTimer = (entry._wanderTimer || 0) + delta;

    if (!entry._wanderTarget || entry._wanderTimer > WANDER_INTERVAL) {
      entry._wanderTimer = 0;
      const ox = this.roomLayout.ox + TILE * 1.5;
      const oy = this.roomLayout.oy + TILE * 1.5;
      const mw = this.roomLayout.w * TILE - TILE * 3;
      const mh = this.roomLayout.h * TILE - TILE * 3;
      entry._wanderTarget = {
        x: ox + Math.random() * mw,
        y: oy + Math.random() * mh
      };
    }

    const dx = entry._wanderTarget.x - sprite.x;
    const dy = entry._wanderTarget.y - sprite.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;

    if (d < 8) {
      entry._wanderTarget = null;
      return;
    }

    const moveMult = MOVE_SPEED * delta;
    sprite.x += (dx / d) * moveMult;
    sprite.y += (dy / d) * moveMult;
    if (Math.abs(dx) > 2) sprite.setFlipX(dx < 0);
  }

  doRealtimeAttack(attacker, targetEntry, side) {
    const defender = targetEntry.hero || targetEntry.enemy;

    // Pick ability: 30% chance to use a special ability if available
    let ability = null;
    if (attacker.abilities && attacker.abilities.length > 0) {
      const specials = attacker.abilities.filter(a =>
        a.id !== 'basic_attack' && (!a.currentCooldown || a.currentCooldown <= 0)
      );
      if (specials.length > 0 && Math.random() < 0.3) {
        ability = specials[Math.floor(Math.random() * specials.length)];
        if (ability.currentCooldown === 0 && ability.cooldown > 0) {
          ability.currentCooldown = ability.cooldown;
        }
        if (attacker.useMana) attacker.useMana(ability.manaCost || 0);
      }
    }
    if (!ability) {
      ability = { id: 'basic_attack', name: 'Basic Attack', type: 'physical', power: 1.0,
        cooldown: 0, currentCooldown: 0, manaCost: 0, targeting: 'enemy_threat' };
    }

    const { damage, isCrit } = this.combatSystem._calculateDamage(attacker, defender, ability);
    defender.takeDamage(damage);

    const event = {
      type: 'damage',
      source: attacker.name,
      target: defender.name,
      amount: damage,
      ability: ability.name,
      isCrit
    };

    this.addCombatLogMessage(event);

    // Check death
    if (defender.currentHp <= 0) {
      const deathEvent = {
        type: 'death',
        source: null,
        target: defender.name,
        amount: 0,
        ability: null,
        isCrit: false,
        message: `${defender.name} has been defeated!`
      };
      this.addCombatLogMessage(deathEvent);

      const deadEntry = this.findSpriteByName(defender.name);
      if (deadEntry) {
        this.spawnDeathParticles(deadEntry.sprite.x, deadEntry.sprite.y);
        this.tweens.add({
          targets: [deadEntry.sprite, deadEntry.hpBg, deadEntry.hpFill, deadEntry.nameText],
          alpha: 0,
          duration: 400,
          ease: 'Power2'
        });
      }

      // Check win/lose conditions
      const allEnemiesDead = this.enemySprites.every(e => e.enemy.currentHp <= 0);
      const allHeroesDead = this.heroSprites.every(h => !h.hero.isAlive());

      if (allEnemiesDead) {
        this.time.delayedCall(600, () => this.handleRoomCleared());
      }
      if (allHeroesDead) {
        this.time.delayedCall(600, () => this.handleDungeonFailed());
      }
    }

    return event;
  }

  playRealtimeAnimation(attacker, targetEntry, event) {
    const attackerEntry = this.findSpriteByName(attacker.name);
    const defenderEntry = targetEntry;
    if (!attackerEntry || !defenderEntry) return;

    const ax = attackerEntry.sprite.x;
    const ay = attackerEntry.sprite.y;
    const dx = defenderEntry.sprite.x;
    const dy = defenderEntry.sprite.y;
    const midX = ax + (dx - ax) * 0.65;
    const midY = ay + (dy - ay) * 0.65;

    attackerEntry.sprite.setDepth(10);

    this.tweens.add({
      targets: attackerEntry.sprite,
      x: midX, y: midY,
      duration: 150,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        attackerEntry.sprite.setDepth(0);
      }
    });

    this.time.delayedCall(75, () => {
      defenderEntry.sprite.setTint(0xff4444);
      this.time.delayedCall(200, () => defenderEntry.sprite.clearTint());

      if (event.isCrit) {
        this.cameras.main.shake(100, 0.006);
      }
    });

    this.showFloatingText(event, dx, dy - 30);
  }

  buildHUD() {
    const { width } = this.cameras.main;

    this.hudBg = this.add.graphics();
    this.hudBg.fillStyle(0x080610, 0.92);
    this.hudBg.fillRect(0, 0, width, 52);
    this.hudBg.lineStyle(1, 0x2a2850, 0.6);
    this.hudBg.beginPath();
    this.hudBg.moveTo(0, 52);
    this.hudBg.lineTo(width, 52);
    this.hudBg.strokePath();
    this.hudBg.setScrollFactor(0);
    this.hudBg.setDepth(100);

    this.hudDungeonName = this.add.text(12, 2, '', {
      fontFamily: FONT_SERIF,
      fontSize: '13px',
      color: '#7777aa',
      fontStyle: 'italic'
    }).setScrollFactor(0).setDepth(101);

    this.hudGoldText = this.add.text(12, 24, '\u25C6 0', {
      fontFamily: FONT_MONO,
      fontSize: '13px',
      color: '#ddaa00',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(101);

    this.hudRoomText = this.add.text(12, 40, 'Room -/-', {
      fontFamily: FONT_SERIF,
      fontSize: '11px',
      color: '#7777aa'
    }).setScrollFactor(0).setDepth(101);

    this.hudRoomDots = this.add.graphics();
    this.hudRoomDots.setScrollFactor(0).setDepth(101);

    this.hudPartyBars = [];
    this.party.forEach((hero, i) => {
      const bx = 140 + i * 130;
      const by = 6;

      const nameText = this.add.text(bx, by, hero.name, {
        fontFamily: FONT_SERIF,
        fontSize: '12px',
        color: '#aaaacc',
        fontStyle: 'bold'
      }).setScrollFactor(0).setDepth(101);

      const hpBg = this.add.graphics();
      hpBg.fillStyle(0x1a1a2e, 1);
      hpBg.fillRoundedRect(bx, by + 14, 110, 6, 3);
      hpBg.lineStyle(1, 0x333355, 0.4);
      hpBg.strokeRoundedRect(bx, by + 14, 110, 6, 3);
      hpBg.setScrollFactor(0).setDepth(101);

      const hpFill = this.add.graphics();
      hpFill.setScrollFactor(0).setDepth(102);

      const hpText = this.add.text(bx + 114, by + 13, '', {
        fontFamily: FONT_MONO,
        fontSize: '8px',
        color: '#777799'
      }).setScrollFactor(0).setDepth(101);

      this.hudPartyBars.push({ hero, nameText, hpBg, hpFill, hpText, bx, by });
    });

    this.logBg = this.add.graphics();
    this.logBg.fillStyle(0x080610, 0.8);
    this.logBg.fillRoundedRect(width - 280, 56, 276, 90, { tl: 0, tr: 0, bl: 4, br: 4 });
    this.logBg.lineStyle(1, 0x2a2850, 0.4);
    this.logBg.strokeRoundedRect(width - 280, 56, 276, 90, { tl: 0, tr: 0, bl: 4, br: 4 });
    this.logBg.setScrollFactor(0).setDepth(100);

    this.combatLog = [];
    this.combatLogTexts = [];

    const leaveBg = this.add.graphics();
    leaveBg.fillStyle(0x2a1515, 0.8);
    leaveBg.fillRoundedRect(width - 90, 4, 80, 20, 3);
    leaveBg.lineStyle(1, 0x884444, 0.4);
    leaveBg.strokeRoundedRect(width - 90, 4, 80, 20, 3);
    leaveBg.setScrollFactor(0).setDepth(101);

    this.leaveBtn = this.add.text(width - 50, 14, 'LEAVE', {
      fontFamily: FONT_MONO,
      fontSize: '13px',
      color: '#cc6655',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102);

    this.leaveBtn.setInteractive({ useHandCursor: true });
    this.leaveBtn.on('pointerover', () => this.leaveBtn.setColor('#ff8877'));
    this.leaveBtn.on('pointerout', () => this.leaveBtn.setColor('#cc6655'));
    this.leaveBtn.on('pointerdown', () => this.leaveDungeon());
  }

  getThemeTileKeys(theme) {
    const map = {
      cavern: { floor: 'tile_floor', wall: 'tile_wall' },
      crypt: { floor: 'tile_floor', wall: 'tile_wall' },
      boss: { floor: 'tile_boss_floor', wall: 'tile_wall' },
      forest: { floor: 'tile_forest_floor', wall: 'tile_forest_wall' },
      dream: { floor: 'tile_dream_floor', wall: 'tile_dream_wall' },
      ruins: { floor: 'tile_ruins_floor', wall: 'tile_ruins_wall' },
      volcanic: { floor: 'tile_volcanic_floor', wall: 'tile_volcanic_wall' }
    };
    return map[theme] || map.cavern;
  }

  generateRoomLayout(room) {
    if (this.roomGraphics) this.roomGraphics.destroy();

    const ox = 100 + this.currentRoomIndex * (ROOM_W * TILE + 80);
    const oy = 60;
    const theme = room.theme || 'cavern';
    const tiles = this.getThemeTileKeys(theme);
    const floorKey = theme === 'boss' ? 'tile_boss_floor' : tiles.floor;
    const wallKey = tiles.wall;

    this.roomGraphics = this.add.graphics();
    this.roomLayout = { ox, oy, w: ROOM_W, h: ROOM_H, theme };

    for (let y = 0; y < ROOM_H; y++) {
      for (let x = 0; x < ROOM_W; x++) {
        const px = ox + x * TILE;
        const py = oy + y * TILE;
        if (x === 0 || x === ROOM_W - 1 || y === 0 || y === ROOM_H - 1) {
          this.add.image(px, py, wallKey).setOrigin(0).setDisplaySize(TILE, TILE);
        } else {
          this.add.image(px, py, floorKey).setOrigin(0).setDisplaySize(TILE, TILE);
        }
      }
    }

    const decorGfx = this.add.graphics();
    decorGfx.setDepth(1);
    for (let dy = 1; dy < ROOM_H - 1; dy++) {
      for (let dx = 1; dx < ROOM_W - 1; dx++) {
        const seed = (this.currentRoomIndex * 1000 + dy * 100 + dx) % 100;
        if (seed < 15) {
          const dpx = ox + dx * TILE + TILE / 2;
          const dpy = oy + dy * TILE + TILE / 2;
          const decorType = seed % 4;
          if (theme === 'crypt') {
            decorGfx.fillStyle(0xddddbb, 0.25);
            if (decorType === 0) { decorGfx.fillCircle(dpx + 4, dpy + 2, 3); }
            else if (decorType === 1) { decorGfx.fillRect(dpx - 3, dpy - 1, 6, 3); }
            else { decorGfx.fillCircle(dpx - 4, dpy + 3, 2); }
          } else if (theme === 'forest') {
            decorGfx.fillStyle(0x44aa44, 0.18);
            if (decorType === 0) { decorGfx.fillCircle(dpx + 3, dpy + 2, 5); }
            else if (decorType === 1) { decorGfx.fillRect(dpx - 2, dpy, 4, 6); }
            else { decorGfx.fillCircle(dpx - 3, dpy + 3, 3); }
          } else if (theme === 'ruins') {
            const alpha = 0.12 + (seed % 5) * 0.02;
            decorGfx.fillStyle(0xbbbb99, alpha);
            if (decorType === 0) { decorGfx.fillRect(dpx - 2, dpy - 1, 5, 3); }
            else { decorGfx.fillCircle(dpx + 4, dpy + 2, 3); }
          } else {
            const alpha = 0.12 + (seed % 5) * 0.03;
            decorGfx.fillStyle(theme === 'boss' ? 0x442200 : theme === 'volcanic' ? 0x3a1000 : 0x334433, alpha);
            if (decorType === 0) { decorGfx.fillCircle(dpx + 6, dpy + 4, 4); }
            else if (decorType === 1) { decorGfx.fillCircle(dpx - 5, dpy + 3, 3); }
            else { decorGfx.fillRect(dpx - 2, dpy - 2, 5, 4); }
          }
        }
      }
    }

    const wallGfx = this.add.graphics();
    wallGfx.setDepth(3);
    const wallY = oy + TILE / 2;
    const wallX1 = ox + TILE / 2;
    const wallX2 = ox + (ROOM_W - 1.5) * TILE;
    if (theme === 'boss') {
      wallGfx.fillStyle(0xcc3333, 0.7);
      wallGfx.fillRect(wallX1 - 2, wallY - 10, 4, 20);
      wallGfx.fillRect(wallX2 - 2, wallY - 10, 4, 20);
      const crystalGfx = this.add.graphics();
      crystalGfx.fillStyle(0xcc3333, 0.1);
      crystalGfx.fillCircle(wallX1, wallY, 20);
      crystalGfx.fillCircle(wallX2, wallY, 20);
      crystalGfx.setDepth(2);
      this.tweens.add({
        targets: crystalGfx, alpha: 0.4, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    } else if (theme === 'crypt') {
      wallGfx.fillStyle(0x6688cc, 0.6);
      wallGfx.fillCircle(wallX1, wallY - 6, 5);
      wallGfx.fillCircle(wallX2, wallY - 6, 5);
      const flameGfx = this.add.graphics();
      flameGfx.fillStyle(0x88aaee, 0.12);
      flameGfx.fillCircle(wallX1, wallY - 6, 16);
      flameGfx.fillCircle(wallX2, wallY - 6, 16);
      flameGfx.setDepth(2);
      this.tweens.add({
        targets: flameGfx, alpha: 0.5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    } else if (theme === 'forest') {
      wallGfx.fillStyle(0x44cc44, 0.5);
      wallGfx.fillCircle(wallX1, wallY - 4, 4);
      wallGfx.fillCircle(wallX2, wallY - 4, 4);
      const glowGfx = this.add.graphics();
      glowGfx.fillStyle(0x66ee66, 0.08);
      glowGfx.fillCircle(wallX1, wallY - 4, 20);
      glowGfx.fillCircle(wallX2, wallY - 4, 20);
      glowGfx.setDepth(2);
      this.tweens.add({
        targets: glowGfx, alpha: 0.3, duration: 1000 + Math.random() * 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    } else if (theme === 'dream') {
      wallGfx.fillStyle(0xaa55dd, 0.5);
      wallGfx.fillCircle(wallX1, wallY - 5, 4);
      wallGfx.fillCircle(wallX2, wallY - 5, 4);
      const sparkleGfx = this.add.graphics();
      sparkleGfx.fillStyle(0xcc88ff, 0.08);
      sparkleGfx.fillCircle(wallX1, wallY - 5, 18);
      sparkleGfx.fillCircle(wallX2, wallY - 5, 18);
      sparkleGfx.setDepth(2);
      this.tweens.add({
        targets: sparkleGfx, alpha: 0.35, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    } else if (theme === 'ruins') {
      wallGfx.fillStyle(0xddcc66, 0.5);
      wallGfx.fillCircle(wallX1, wallY - 3, 3);
      wallGfx.fillCircle(wallX2, wallY - 3, 3);
      const lightGfx = this.add.graphics();
      lightGfx.fillStyle(0xeedd88, 0.06);
      lightGfx.fillCircle(wallX1, wallY - 3, 16);
      lightGfx.fillCircle(wallX2, wallY - 3, 16);
      lightGfx.setDepth(2);
      this.tweens.add({
        targets: lightGfx, alpha: 0.25, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    } else if (theme === 'volcanic') {
      wallGfx.fillStyle(0xff4400, 0.7);
      wallGfx.fillCircle(wallX1, wallY - 2, 3);
      wallGfx.fillCircle(wallX2, wallY - 2, 3);
      const lavaGfx = this.add.graphics();
      lavaGfx.fillStyle(0xff6622, 0.1);
      lavaGfx.fillCircle(wallX1, wallY - 2, 16);
      lavaGfx.fillCircle(wallX2, wallY - 2, 16);
      lavaGfx.setDepth(2);
      this.tweens.add({
        targets: lavaGfx, alpha: 0.3, duration: 700 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    } else {
      wallGfx.fillStyle(0xff8833, 0.6);
      wallGfx.fillCircle(wallX1, wallY - 4, 4);
      wallGfx.fillCircle(wallX2, wallY - 4, 4);
      const torchGfx = this.add.graphics();
      torchGfx.fillStyle(0xff9933, 0.08);
      torchGfx.fillCircle(wallX1, wallY - 4, 18);
      torchGfx.fillCircle(wallX2, wallY - 4, 18);
      torchGfx.setDepth(2);
      this.tweens.add({
        targets: torchGfx, alpha: 0.3, duration: 800 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }

    this.spawnAmbientParticles(theme);

    if (theme === 'boss') {
      const glow = this.add.graphics();
      glow.lineStyle(3, 0xaa2222, 0.5);
      glow.strokeRect(ox - 2, oy - 2, ROOM_W * TILE + 4, ROOM_H * TILE + 4);
      const innerGlow = this.add.graphics();
      innerGlow.fillStyle(0x440000, 0.08);
      innerGlow.fillRect(ox, oy, ROOM_W * TILE, ROOM_H * TILE);
    }

    this.cameras.main.pan(ox + (ROOM_W * TILE) / 2, oy + (ROOM_H * TILE) / 2, 400, 'Power2');

    const roomType = room.type === 'final_boss' ? ' BOSS' : room.type === 'mini_boss' ? ' Mini-Boss' : '';
    this.hudRoomText.setText(`Room ${this.currentRoomIndex + 1}/${this.dungeonSystem.currentDungeon.rooms.length}${roomType}`);

    if (this.currentRoomIndex === 0 && this.hudDungeonName) {
      this.hudDungeonName.setText(this.dungeonSystem.currentDungeon.name);
    }

    if (this.hudRoomDots) {
      this.hudRoomDots.clear();
      const total = this.dungeonSystem.currentDungeon.rooms.length;
      const dotY = 53;
      const startX = 12;
      for (let i = 0; i < total; i++) {
        const dx = startX + i * 14;
        if (i < this.currentRoomIndex) {
          this.hudRoomDots.fillStyle(0x4444aa, 0.8);
          this.hudRoomDots.fillCircle(dx + 5, dotY, 4);
        } else if (i === this.currentRoomIndex) {
          this.hudRoomDots.fillStyle(0x8888ff, 1.0);
          this.hudRoomDots.fillCircle(dx + 5, dotY, 5);
          this.hudRoomDots.lineStyle(1, 0x5555cc, 0.6);
          this.hudRoomDots.strokeCircle(dx + 5, dotY, 5);
        } else {
          this.hudRoomDots.fillStyle(0x333355, 0.5);
          this.hudRoomDots.fillCircle(dx + 5, dotY, 3);
        }
      }
    }
  }

  buildCorridor() {
    if (this.currentRoomIndex > 0) {
      const prevOx = 100 + (this.currentRoomIndex - 1) * (ROOM_W * TILE + 80);
      const oy = this.roomLayout.oy;
      const centerY = oy + (ROOM_H / 2) * TILE;
      const doorX1 = prevOx + ROOM_W * TILE;
      const doorX2 = this.roomLayout.ox;

      for (let tx = 0; tx < (doorX2 - doorX1) / TILE; tx++) {
        const cpx = doorX1 + tx * TILE;
        for (let cy = 0; cy < 3; cy++) {
          const cpy = centerY + (cy - 1) * TILE;
          this.add.image(cpx, cpy, 'tile_corridor').setOrigin(0).setDisplaySize(TILE, TILE);
        }
      }

      this.add.image(doorX1, centerY - TILE, 'tile_door').setOrigin(0).setDisplaySize(TILE, TILE * 3);
    }
  }

  spawnAmbientParticles(theme) {
    if (this._ambientCleanup) {
      this.events.off('update', this._ambientCleanup);
      this._ambientCleanup = null;
    }
    if (this.ambientParticles) {
      for (const p of this.ambientParticles) p.destroy();
    }
    this.ambientParticles = [];

    const ox = this.roomLayout.ox;
    const oy = this.roomLayout.oy;
    const rw = ROOM_W * TILE;
    const rh = ROOM_H * TILE;

    const count = 18;
    const particles = [];
    for (let i = 0; i < count; i++) {
      const px = ox + Math.random() * rw;
      const py = oy + Math.random() * rh;

      const isEmber = Math.random() < 0.3;
      const size = 1.5 + Math.random() * 2;
      let color;
      if (theme === 'boss') color = isEmber ? 0xff6633 : 0xcc4444;
      else if (theme === 'crypt') color = isEmber ? 0x6688cc : 0x99aacc;
      else if (theme === 'forest') color = isEmber ? 0x88dd44 : 0xaaff66;
      else if (theme === 'dream') color = isEmber ? 0xcc88ff : 0xddbbff;
      else if (theme === 'ruins') color = isEmber ? 0xeecc66 : 0xffeebb;
      else if (theme === 'volcanic') color = isEmber ? 0xff4400 : 0xff8844;
      else color = isEmber ? 0xff8844 : 0x99bbcc;

      const dot = this.add.graphics();
      dot.fillStyle(color, 0.25 + Math.random() * 0.25);
      dot.fillCircle(0, 0, size);
      dot.setPosition(px, py);
      dot.setDepth(2);

      particles.push({
        gfx: dot,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(0.1 + Math.random() * 0.25),
        wobbleAmp: 0.3 + Math.random() * 0.8,
        wobbleSpeed: 0.01 + Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2
      });
    }
    this.ambientParticles = particles;

    this._ambientCleanup = () => {
      for (const p of particles) {
        if (!p.gfx.active) continue;
        p.phase += p.wobbleSpeed;
        p.gfx.x += p.vx + Math.sin(p.phase) * p.wobbleAmp;
        p.gfx.y += p.vy;
        if (p.gfx.y < oy - 10) {
          p.gfx.y = oy + rh + 10;
          p.gfx.x = ox + Math.random() * rw;
        }
        p.gfx.setAlpha(0.15 + Math.sin(p.phase * 0.5) * 0.1);
      }
    };
    this.events.on('update', this._ambientCleanup);
  }

  spawnDeathParticles(x, y) {
    const particleCount = 12;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      const size = 2 + Math.random() * 3;

      const particle = this.add.graphics();
      particle.fillStyle(0xdd4444, 0.8);
      particle.fillCircle(0, 0, size);
      particle.setPosition(x, y);
      particle.setDepth(15);

      particles.push({ gfx: particle, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });
    }

    let elapsed = 0;
    const duration = 600;

    const handler = () => {
      elapsed += this.game.loop.delta;
      const t = elapsed / duration;
      if (t >= 1) {
        this.events.off('update', handler);
        for (const p of particles) p.gfx.destroy();
        return;
      }
      for (const p of particles) {
        p.gfx.x += p.vx * 0.016;
        p.gfx.y += p.vy * 0.016;
        p.gfx.setAlpha(1 - t);
        p.gfx.setScale(1 - t * 0.5);
      }
    };
    this.events.on('update', handler);
  }

  spawnHeroes(room) {
    this.heroSprites = [];
    const ox = this.roomLayout.ox;
    const oy = this.roomLayout.oy;

    this.party.forEach((hero, i) => {
      if (!hero.isAlive()) return;

      if (this.currentRoomIndex === 0) {
        hero.currentHp = hero.getEffectiveStats().hp;
        hero.currentMp = hero.getEffectiveStats().mp;
      }

      const sx = ox + TILE * 2 + i * TILE * 1.5;
      const sy = oy + this.roomLayout.h * TILE / 2;

      const spriteKey = this.getHeroSpriteKey(hero.className);
      const sprite = this.add.image(sx, sy, spriteKey, 0)
        .setOrigin(0.5)
        .setDisplaySize(TILE * 1.2, TILE * 1.2);

      const hpBg = this.add.graphics();
      hpBg.fillStyle(0x1a1a2e, 0.8);
      hpBg.fillRoundedRect(sx - 18, sy - 22, 36, 6, 2);
      hpBg.lineStyle(1, 0x333355, 0.3);
      hpBg.strokeRoundedRect(sx - 18, sy - 22, 36, 6, 2);

      const hpFill = this.add.graphics();

      const nameText = this.add.text(sx, sy - 30, hero.name, {
        fontFamily: FONT_SERIF,
        fontSize: '11px',
        color: '#aaaacc',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.heroSprites.push({
        hero, sprite, hpBg, hpFill, nameText,
        homeX: sx, homeY: sy,
        attackCooldown: 0,
        _wanderTarget: null,
        _wanderTimer: 0,
        updateHP() {
          hpFill.clear();
          const stats = hero.getEffectiveStats();
          const pct = Math.max(0, hero.currentHp / stats.hp);
          let c = 0x4caf50;
          if (pct <= 0.3) c = 0xdd3333;
          else if (pct <= 0.6) c = 0xddaa00;
          hpFill.fillStyle(c, 0.85);
          const w = Math.max(2, Math.floor(34 * pct));
          hpFill.fillRoundedRect(sprite.x - 17, sprite.y - 21, w, 4, 1);
          hpBg.setPosition(sprite.x - 18, sprite.y - 22);
          nameText.setPosition(sprite.x, sprite.y - 30);
        }
      });
    });

    this.heroSprites.forEach(hs => hs.updateHP());
  }

  spawnEnemies(room) {
    this.enemySprites = [];
    const enemies = this.dungeonSystem.roomEnemies;
    const ox = this.roomLayout.ox;
    const oy = this.roomLayout.oy;

    enemies.forEach((enemy, i) => {
      const sx = ox + this.roomLayout.w * TILE - TILE * 2 - i * TILE * 1.5;
      const sy = oy + this.roomLayout.h * TILE / 2;

      let texKey = 'enemy_goblin';
      if (enemy.type === 'goblin_archer') texKey = 'enemy_goblin_archer';
      else if (enemy.type === 'skeleton') texKey = 'enemy_skeleton';
      else if (enemy.type === 'zombie') texKey = 'enemy_zombie';
      else if (enemy.type === 'goblin_warchief') texKey = 'enemy_goblin_warchief';
      else if (enemy.type === 'goblin_king') texKey = 'enemy_goblin_king';
      else if (enemy.type === 'bone_commander') texKey = 'enemy_bone_commander';
      else if (enemy.type === 'lich_lord') texKey = 'enemy_lich_lord';

      const sprite = this.add.image(sx, sy, texKey, 0)
        .setOrigin(0.5)
        .setDisplaySize(TILE * 1.2, TILE * 1.2);

      const isBoss = enemy.type.includes('king') || enemy.type.includes('warchief') ||
                     enemy.type.includes('commander') || enemy.type.includes('lich');
      if (isBoss) {
        sprite.setDisplaySize(TILE * 1.4, TILE * 1.4);
      }

      const hpBg = this.add.graphics();
      hpBg.fillStyle(0x1a1a2e, 0.8);
      hpBg.fillRoundedRect(sx - 18, sy - 22, 36, 6, 2);
      hpBg.lineStyle(1, 0x333355, 0.3);
      hpBg.strokeRoundedRect(sx - 18, sy - 22, 36, 6, 2);

      const hpFill = this.add.graphics();

      const nameColor = isBoss ? '#dd6666' : '#cc8888';
      const nameText = this.add.text(sx, sy - 30, enemy.name, {
        fontFamily: FONT_SERIF,
        fontSize: '11px',
        color: nameColor,
        fontStyle: isBoss ? 'bold' : 'normal'
      }).setOrigin(0.5);

      this.enemySprites.push({
        enemy, sprite, hpBg, hpFill, nameText,
        homeX: sx, homeY: sy,
        attackCooldown: 0,
        _wanderTarget: null,
        _wanderTimer: 0,
        updateHP() {
          hpFill.clear();
          const pct = Math.max(0, enemy.currentHp / enemy.maxHp);
          let c = 0xcc3333;
          if (pct <= 0.3) c = 0xff2222;
          else if (pct <= 0.6) c = 0xff6600;
          hpFill.fillStyle(c, 0.85);
          const w = Math.max(2, Math.floor(34 * pct));
          hpFill.fillRoundedRect(sprite.x - 17, sprite.y - 21, w, 4, 1);
          hpBg.setPosition(sprite.x - 18, sprite.y - 22);
          nameText.setPosition(sprite.x, sprite.y - 30);
        }
      });
    });

    this.enemySprites.forEach(es => es.updateHP());
  }

  clearRoomSprites() {
    for (const hs of this.heroSprites) {
      hs.sprite.destroy();
      hs.hpBg.destroy();
      hs.hpFill.destroy();
      hs.nameText.destroy();
    }
    this.heroSprites = [];

    for (const es of this.enemySprites) {
      es.sprite.destroy();
      es.hpBg.destroy();
      es.hpFill.destroy();
      es.nameText.destroy();
    }
    this.enemySprites = [];
  }

  findSpriteByName(name) {
    const hs = this.heroSprites.find(h => h.hero.name === name);
    if (hs) return hs;
    const es = this.enemySprites.find(e => e.enemy.name === name);
    if (es) return es;
    return null;
  }

  playAttackAnimation(events) {
    const LUNGE_DURATION = 200;
    const LUNGE_GAP = 180;

    let animDelay = 0;

    for (const event of events) {
      if (event.type === 'damage' || event.type === 'heal') {
        const attackerEntry = this.findSpriteByName(event.source);
        const defenderEntry = this.findSpriteByName(event.target);

        if (attackerEntry && defenderEntry) {
          const ax = attackerEntry.homeX;
          const ay = attackerEntry.homeY;
          const dx = defenderEntry.sprite.x;
          const dy = defenderEntry.sprite.y;
          const midX = ax + (dx - ax) * 0.65;
          const midY = ay + (dy - ay) * 0.65;

          this.time.delayedCall(animDelay, () => {
            attackerEntry.sprite.setDepth(10);

            this.tweens.add({
              targets: attackerEntry.sprite,
              x: midX, y: midY,
              duration: LUNGE_DURATION,
              ease: 'Power2',
              yoyo: true,
              onComplete: () => {
                attackerEntry.sprite.x = ax;
                attackerEntry.sprite.y = ay;
                attackerEntry.sprite.setDepth(0);
              }
            });

            this.time.delayedCall(LUNGE_DURATION * 0.5, () => {
              if (event.type === 'damage') {
                defenderEntry.sprite.setTint(0xff4444);
                this.time.delayedCall(250, () => defenderEntry.sprite.clearTint());

                if (event.isCrit) {
                  this.cameras.main.shake(120, 0.008);
                }
              } else {
                defenderEntry.sprite.setTint(0x44ff44);
                this.time.delayedCall(250, () => defenderEntry.sprite.clearTint());
              }
            });

            this.showFloatingText(event, dx, dy - 20);
          });

          animDelay += LUNGE_GAP;
        } else {
          this.showFloatingText(event, 400, 300);
        }
      } else if (event.type === 'death') {
        const deadEntry = this.findSpriteByName(event.target);
        if (deadEntry) {
          this.time.delayedCall(animDelay, () => {
            this.spawnDeathParticles(deadEntry.sprite.x, deadEntry.sprite.y);

            this.tweens.add({
              targets: [deadEntry.sprite, deadEntry.hpBg, deadEntry.hpFill, deadEntry.nameText],
              alpha: 0, y: deadEntry.homeY + 10,
              duration: 400, ease: 'Power2'
            });
          });
          animDelay += 200;
        }
      } else if (event.type === 'heal' && event.amount === 0) {
        this.showFloatingText(event, 400, 300);
      }
    }

    return animDelay;
  }

  showFloatingText(event, sx, sy) {
    let text = '';
    let color = '#ffffff';
    let size = '18px';

    if (event.type === 'damage') {
      // Tiered damage color by amount (Phase 4C)
      if (event.isCrit) {
        color = '#ffee44';
        size = '26px';
        text = `-${event.amount}!`;
      } else if (event.amount >= 100) {
        color = '#ff7744';
        size = '20px';
        text = `-${event.amount}`;
      } else if (event.amount >= 61) {
        color = '#ffaa44';
        size = '19px';
        text = `-${event.amount}`;
      } else if (event.amount >= 31) {
        color = '#ffdd66';
        size = '18px';
        text = `-${event.amount}`;
      } else {
        color = '#ffffff';
        size = '17px';
        text = `-${event.amount}`;
      }
    } else if (event.type === 'heal') {
      color = '#55ee77';
      text = `+${event.amount}`;
      size = event.amount >= 30 ? '20px' : '18px';
    } else {
      return;
    }

    const dmgText = this.add.text(sx, sy - 10, text, {
      fontFamily: FONT_MONO,
      fontSize: size,
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(60);

    // Crits get horizontal jitter + bigger bob
    const bobDistance = event.isCrit ? 70 : 55;
    const jitterX = event.isCrit ? (Math.random() - 0.5) * 16 : 0;

    this.tweens.add({
      targets: dmgText,
      y: sy - bobDistance,
      x: sx + jitterX,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => dmgText.destroy()
    });
  }

  showHealNumber(x, y, amount) {
    this.showFloatingText({ type: 'heal', amount }, x, y);
  }

  showMissText(x, y) {
    const missText = this.add.text(x, y - 10, 'MISS', {
      fontFamily: FONT_MONO,
      fontSize: '14px',
      color: '#888899',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(60);

    this.tweens.add({
      targets: missText,
      y: y - 40, alpha: 0,
      duration: 900, ease: 'Power2',
      onComplete: () => missText.destroy()
    });
  }

  showDamageNumber(event) {}

  addCombatLogMessage(event) {
    this.combatLog.push(event);

    if (this.combatLogTexts.length >= 5) {
      const first = this.combatLogTexts.shift();
      first.destroy();
    }

    let msg = event.message || '';
    let color = '#888899';

    if (event.type === 'damage') color = '#dd6666';
    else if (event.type === 'heal') color = '#66bb66';
    else if (event.type === 'death') color = '#dd4444';
    else if (event.type === 'enrage') color = '#dd8844';

    const logY = 62 + this.combatLogTexts.length * 20;
    const txt = this.add.text(788, logY, msg, {
      fontFamily: FONT_MONO,
      fontSize: '12px',
      color: color,
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(101);

    this.combatLogTexts.push(txt);
  }

  refreshHUD() {
    for (const bar of this.hudPartyBars) {
      const hero = bar.hero;
      const stats = hero.getEffectiveStats();
      const pct = Math.max(0, hero.currentHp / stats.hp);

      bar.hpFill.clear();
      let color = 0x4caf50;
      if (pct <= 0.3) color = 0xdd3333;
      else if (pct <= 0.6) color = 0xddaa00;

      bar.hpFill.fillStyle(color, 0.8);
      const w = Math.max(2, Math.floor(108 * pct));
      bar.hpFill.fillRoundedRect(bar.bx + 1, bar.by + 15, w, 4, 2);

      bar.hpText.setText(`${Math.floor(hero.currentHp)}/${stats.hp}`);
      bar.nameText.setColor(hero.isAlive() ? '#aaaacc' : '#664444');
    }
  }

  enterRoom() {
    if (this.dungeonFinished) return;

    this.transitioning = true;
    this.currentRoomIndex++;

    if (this.currentRoomIndex >= this.dungeonSystem.currentDungeon.rooms.length) {
      this.handleDungeonComplete();
      return;
    }

    const room = this.dungeonSystem.currentDungeon.rooms[this.currentRoomIndex];

    // Fade out, rebuild, fade in
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.clearRoomSprites();
      this.roomGoldEarned = 0;

      this.generateRoomLayout(room);
      this.buildCorridor();
      this.spawnHeroes(room);
      this.spawnEnemies(room);

      this.combatSystem.startCombat(this.party, this.dungeonSystem.spawnRoomEnemies(room));

      this.cameras.main.fadeIn(400, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.transitioning = false;
      });
    });
  }

  combatTick() {
    if (this.transitioning || this.dungeonFinished) return;

    const { events, isComplete, partyWiped } = this.combatSystem.processTick();

    for (const event of events) {
      this.addCombatLogMessage(event);
    }

    const animDelay = this.playAttackAnimation(events);

    this.time.delayedCall(Math.max(animDelay, 100), () => {
      for (const hs of this.heroSprites) {
        hs.updateHP();
        hs.sprite.x = hs.homeX;
        hs.sprite.y = hs.homeY;
      }
      for (const es of this.enemySprites) {
        es.updateHP();
        if (es.enemy.currentHp > 0) {
          es.sprite.x = es.homeX;
          es.sprite.y = es.homeY;
        }
      }
      this.refreshHUD();
    });

    if (partyWiped) {
      this.time.delayedCall(animDelay + 200, () => this.handleDungeonFailed());
      return;
    }

    if (isComplete) {
      this.time.delayedCall(animDelay + 200, () => this.handleRoomCleared());
    }
  }

  handleRoomCleared() {
    this.transitioning = true;

    const room = this.dungeonSystem.currentDungeon.rooms[this.currentRoomIndex];

    for (const es of this.enemySprites) {
      const idx = this.combatSystem.enemies.findIndex(e => e.id === es.enemy.id);
      if (idx !== -1) {
        const enemy = this.combatSystem.enemies[idx];
        this.dungeonGoldEarned += Math.floor(
          (enemy.lootGold.min + Math.random() * (enemy.lootGold.max - enemy.lootGold.min))
        );
      }
    }

    const loot = this.economy.rollLoot(room.type);
    if (loot) {
      this.economy.addToInventory(loot);
      this.addCombatLogMessage({ type: 'heal', message: `Loot: ${loot.name}!`, amount: 0 });
    }

    this.addCombatLogMessage({ type: 'heal', message: `Room ${this.currentRoomIndex + 1} cleared!` });

    for (const hs of this.heroSprites) {
      const stats = hs.hero.getEffectiveStats();
      const regenAmount = Math.floor(stats.hp * 0.15);
      if (regenAmount > 0) {
        hs.hero.heal(regenAmount);
        this.addCombatLogMessage({
          type: 'heal', source: hs.hero.name, target: hs.hero.name,
          amount: regenAmount, ability: 'Regeneration', isCrit: false,
          message: `${hs.hero.name} +${regenAmount} HP`
        });
      }
    }

    this.hudGoldText.setText(`\u25C6 ${this.dungeonGoldEarned}`);

    this.time.delayedCall(1200, () => this.enterRoom());
  }

  handleDungeonComplete() {
    this.dungeonFinished = true;
    this.saveTimer.remove();
    this.resetHeroes();

    const baseReward = this.dungeonSystem.currentDungeon.baseGoldReward || 50;
    this.dungeonGoldEarned += baseReward;
    this.economy.addGold(this.dungeonGoldEarned);

    const xpGain = 20 + this.dungeonGoldEarned;
    for (const hero of this.party) hero.gainXP(xpGain);

    const dungeonId = this.dungeonData.id;
    if (!this.gameState.dungeonsCompleted[dungeonId]) this.gameState.dungeonsCompleted[dungeonId] = 0;
    this.gameState.dungeonsCompleted[dungeonId]++;
    this.gameState.stats.totalDungeons++;
    this.gameState.stats.totalGoldEarned += this.dungeonGoldEarned;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, 800, 600);
    overlay.setScrollFactor(0).setDepth(200);

    const p = createPanel(this, 180, 100, 440, 380, 'Dungeon Complete');
    p.graphics.setDepth(201);
    if (p.titleText) p.titleText.setDepth(202);

    this.add.text(400, 140, this.dungeonSystem.currentDungeon.name, {
      fontFamily: FONT_SERIF,
      fontSize: '20px',
      color: '#ddaa00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(202);

    this.add.text(400, 172, `+\u25C6 ${this.dungeonGoldEarned} gold`, {
      fontFamily: FONT_MONO,
      fontSize: '14px',
      color: '#ddaa00'
    }).setOrigin(0.5).setDepth(202);

    this.add.text(400, 196, `+${xpGain} XP per hero`, {
      fontFamily: FONT_MONO,
      fontSize: '11px',
      color: '#88cc88'
    }).setOrigin(0.5).setDepth(202);

    let sy = 230;
    for (const hero of this.party) {
      const stats = hero.getEffectiveStats();
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x121020, 0.7);
      cardBg.fillRoundedRect(210, sy, 380, 24, 3);
      cardBg.setDepth(201);

      this.add.text(220, sy + 5, hero.name, {
        fontFamily: FONT_SERIF,
        fontSize: '11px',
        color: '#c0c0dd',
        fontStyle: 'bold'
      }).setDepth(202);

      this.add.text(340, sy + 5, `Lv${hero.level}`, {
        fontFamily: FONT_MONO,
        fontSize: '13px',
        color: '#777799'
      }).setDepth(202);

      this.add.text(400, sy + 5, `HP ${Math.floor(hero.currentHp)}/${stats.hp}`, {
        fontFamily: FONT_MONO,
        fontSize: '13px',
        color: hero.isAlive() ? '#88cc88' : '#cc6666'
      }).setDepth(202);

      sy += 28;
    }

    const btn = createButton(this, 330, 430, 'Return to Guild', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => {
        this.scene.start('GuildScene', { saveData: this.buildSaveData() });
      });
    }, 140);
    btn.graphics.setDepth(201);
    btn.text.setDepth(202);

    this.autoSave();
  }

  handleDungeonFailed() {
    this.dungeonFinished = true;
    this.saveTimer.remove();
    this.resetHeroes();

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, 800, 600);
    overlay.setScrollFactor(0).setDepth(200);

    const p = createPanel(this, 200, 180, 400, 200, 'Party Wiped');
    p.graphics.setDepth(201);
    if (p.titleText) p.titleText.setDepth(202);

    this.add.text(400, 250, 'Your party has fallen...', {
      fontFamily: FONT_SERIF,
      fontSize: '16px',
      color: '#cc6666',
      fontStyle: 'italic'
    }).setOrigin(0.5).setDepth(202);

    const retryBtn = createButton(this, 280, 310, 'Retry', () => {
      this.scene.restart({
        gameState: this.gameState,
        party: this.party,
        dungeonData: this.dungeonData
      });
    }, 80);
    retryBtn.graphics.setDepth(201);
    retryBtn.text.setDepth(202);

    const returnBtn = createButton(this, 400, 310, 'Return', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => {
        this.scene.start('GuildScene', { saveData: this.buildSaveData() });
      });
    }, 80);
    returnBtn.graphics.setDepth(201);
    returnBtn.text.setDepth(202);
  }

  returnToGuild() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.scene.start('GuildScene', { saveData: this.buildSaveData() });
    });
  }

  async autoSave() {
    await this.saveSystem.save({
      gold: this.economy.getGold(),
      heroes: this.gameState.heroes,
      guild: this.gameState.guild,
      inventory: this.economy.inventory,
      party: this.party,
      dungeonsCompleted: this.gameState.dungeonsCompleted,
      stats: this.gameState.stats
    });
  }

  getHeroSpriteKey(className) {
    const map = {
      paladin: 'hero_paladin',
      warrior: 'hero_paladin',
      mage: 'hero_paladin',
      priest: 'hero_paladin',
      rogue: 'hero_paladin'
    };
    return map[className] || 'hero_paladin';
  }

  resetHeroes() {
    for (const hero of this.party) {
      const stats = hero.getEffectiveStats();
      hero.currentHp = stats.hp;
      hero.currentMp = stats.mp;
      for (const ability of hero.abilities) {
        ability.currentCooldown = 0;
      }
      hero._dead = false;
    }
  }

  buildSaveData() {
    return {
      version: 1,
      timestamp: Date.now(),
      gold: this.economy.getGold(),
      heroes: this.gameState.heroes.map(h => h.serialize()),
      guild: this.gameState.guild,
      inventory: this.economy.inventory,
      party: this.party.map(h => h.id),
      dungeonsCompleted: this.gameState.dungeonsCompleted,
      stats: this.gameState.stats
    };
  }

  leaveDungeon() {
    this.saveTimer.remove();
    this.resetHeroes();
    this.autoSave();

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.scene.start('GuildScene', { saveData: this.buildSaveData() });
    });
  }
}