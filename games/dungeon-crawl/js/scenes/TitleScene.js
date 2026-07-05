import { SaveSystem } from '../systems/SaveSystem.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Reset camera alpha from previous scene's fadeOut
    this.cameras.main.setAlpha(1);
    this.cameras.main.fadeIn(800, 0, 0, 0);

    this.buildBackground(width, height);
    this.buildAmbientGlow(width, height);
    this.buildParticles(width, height);
    this.buildTitle(width, height);
    this.buildDecorations(width, height);
    this.buildButtons(width, height);
    this.buildFooter(width, height);
  }

  buildBackground(w, h) {
    const bg = this.add.graphics();

    // Dark gradient from top to bottom
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.floor(Phaser.Math.Linear(8, 20, t));
      const g = Math.floor(Phaser.Math.Linear(6, 15, t));
      const b = Math.floor(Phaser.Math.Linear(18, 35, t));
      const color = (r << 16) | (g << 8) | b;
      bg.fillStyle(color, 1);
      bg.fillRect(0, (h / steps) * i, w, h / steps + 1);
    }

    // Vignette overlay - darker edges
    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.4);
    vignette.fillRect(0, 0, 120, h);
    vignette.fillRect(w - 120, 0, 120, h);
    vignette.fillStyle(0x000000, 0.3);
    vignette.fillRect(0, 0, w, 60);
    vignette.fillRect(0, h - 60, w, 60);
  }

  buildAmbientGlow(w, h) {
    // Soft radial glow behind title
    const glow = this.add.graphics();
    const cx = w / 2;
    const cy = h / 2 - 40;

    for (let i = 8; i >= 0; i--) {
      const radius = 120 + i * 30;
      const alpha = 0.015 * (8 - i) / 8;
      glow.fillStyle(0x4444aa, alpha);
      glow.fillCircle(cx, cy, radius);
    }

    // Subtle pulsing animation
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.6, to: 1.0 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  buildParticles(w, h) {
    this.particles = [];

    // Create floating dust/ember particles
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(0, h);
      const size = Phaser.Math.Between(1, 3);
      const isEmber = Math.random() < 0.3;
      const color = isEmber ? 0xff8844 : 0x6666aa;
      const alpha = Phaser.Math.FloatBetween(0.1, 0.4);

      const dot = this.add.graphics();
      dot.fillStyle(color, alpha);
      dot.fillCircle(0, 0, size);
      dot.setPosition(x, y);

      const particle = {
        gfx: dot, x, y,
        speedX: Phaser.Math.FloatBetween(-0.15, 0.15),
        speedY: Phaser.Math.FloatBetween(-0.3, -0.08),
        wobbleSpeed: Phaser.Math.FloatBetween(0.005, 0.02),
        wobbleAmp: Phaser.Math.FloatBetween(0.3, 1.0),
        phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
        baseAlpha: alpha
      };
      this.particles.push(particle);
    }

    this._particleUpdate = () => {
      for (const p of this.particles) {
        p.phase += p.wobbleSpeed;
        p.x += p.speedX + Math.sin(p.phase) * p.wobbleAmp;
        p.y += p.speedY;
        if (p.y < -10) { p.y = h + 10; p.x = Phaser.Math.Between(0, w); }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        p.gfx.setPosition(p.x, p.y);
        p.gfx.setAlpha(p.baseAlpha + Math.sin(p.phase * 0.5) * 0.1);
      }
    };
    this.events.on('update', this._particleUpdate);
  }

  shutdown() {
    if (this._particleUpdate) {
      this.events.off('update', this._particleUpdate);
    }
  }

  buildTitle(w, h) {
    const cx = w / 2;
    const titleY = h / 2 - 60;

    // Glow layer behind title (blurred effect via multiple offset texts)
    const glowConfigs = [
      { color: '#6464c8', alpha: 0.25 },
      { color: '#5050b4', alpha: 0.2 },
      { color: '#3c3ca0', alpha: 0.15 }
    ];
    const offsets = [3, 2, 1];

    for (let i = 0; i < offsets.length; i++) {
      const glowText = this.add.text(cx, titleY, 'IDLE MINDS', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '56px',
        color: glowConfigs[i].color,
        fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(glowConfigs[i].alpha);
      glowText.setPosition(cx + offsets[i] * (Math.random() > 0.5 ? 1 : -1), titleY + offsets[i]);
    }

    // Main title text
    this.titleText = this.add.text(cx, titleY, 'IDLE MINDS', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '56px',
      color: '#e8e0d0',
      fontStyle: 'bold',
      stroke: '#2a2040',
      strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0);

    // Title fade-in and float
    this.tweens.add({
      targets: this.titleText,
      alpha: { from: 0, to: 1 },
      y: { from: titleY + 10, to: titleY },
      duration: 1200,
      ease: 'Power2'
    });

    // Subtle title float after entrance
    this.time.delayedCall(1200, () => {
      this.tweens.add({
        targets: this.titleText,
        y: titleY - 4,
        duration: 2500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    // Subtitle / tagline
    const subText = this.add.text(cx, titleY + 44, 'DUNGEON  MANAGER', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '14px',
      color: '#8888aa',
      letterSpacing: 8
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: subText,
      alpha: { from: 0, to: 0.7 },
      duration: 1000,
      delay: 800,
      ease: 'Power2'
    });
  }

  buildDecorations(w, h) {
    const cx = w / 2;
    const titleY = h / 2 - 60;

    // Decorative line above subtitle
    const lineGfx = this.add.graphics();
    const lineY = titleY + 30;
    const lineW = 200;

    lineGfx.lineStyle(1, 0x5555aa, 0);
    lineGfx.beginPath();
    lineGfx.moveTo(cx - lineW / 2, lineY);
    lineGfx.lineTo(cx + lineW / 2, lineY);
    lineGfx.strokePath();

    // Animate line drawing in
    this.tweens.add({
      targets: lineGfx,
      alpha: { from: 0, to: 0.4 },
      duration: 800,
      delay: 600,
      ease: 'Power2'
    });

    // Diamond ornament at center of line
    const diamond = this.add.graphics();
    diamond.fillStyle(0x7777bb, 0);
    const ds = 4;
    diamond.beginPath();
    diamond.moveTo(cx, lineY - ds);
    diamond.lineTo(cx + ds, lineY);
    diamond.lineTo(cx, lineY + ds);
    diamond.lineTo(cx - ds, lineY);
    diamond.closePath();
    diamond.fillPath();

    this.tweens.add({
      targets: diamond,
      alpha: { from: 0, to: 0.5 },
      duration: 600,
      delay: 1000,
      ease: 'Power2'
    });
  }

  async buildButtons(w, h) {
    const cx = w / 2;
    const btnY = h / 2 + 80;

    const saveSystem = new SaveSystem();
    const hasSave = await saveSystem.hasSave();

    const buttons = [];
    if (hasSave) {
      buttons.push({ label: 'CONTINUE', y: btnY, action: async () => {
        const saveData = await saveSystem.load();
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.time.delayedCall(600, () => {
          this.scene.start('GuildScene', { saveData });
        });
      }});
      buttons.push({ label: 'NEW GAME', y: btnY + 48, action: async () => {
        await saveSystem.deleteSave();
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.time.delayedCall(600, () => {
          this.scene.start('GuildScene', { saveData: null });
        });
      }});
    } else {
      buttons.push({ label: 'NEW GAME', y: btnY, action: () => {
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.time.delayedCall(600, () => {
          this.scene.start('GuildScene', { saveData: null });
        });
      }});
    }

    buttons.forEach((def, i) => {
      this.createStyledButton(cx, def.y, def.label, def.action, 200, 38, 400 + i * 200);
    });
  }

  createStyledButton(cx, y, label, callback, bw, bh, delay) {
    const x = cx - bw / 2;

    // Button background
    const btnBg = this.add.graphics();
    const drawBtn = (bg, border, borderAlpha, fillAlpha) => {
      btnBg.clear();
      // Outer glow
      btnBg.fillStyle(border, 0.15);
      btnBg.fillRoundedRect(x - 3, y - 3, bw + 6, bh + 6, 6);
      // Border
      btnBg.fillStyle(border, borderAlpha);
      btnBg.fillRoundedRect(x - 1, y - 1, bw + 2, bh + 2, 5);
      // Inner fill
      btnBg.fillStyle(bg, fillAlpha);
      btnBg.fillRoundedRect(x, y, bw, bh, 4);
      // Top highlight
      btnBg.fillStyle(0xffffff, 0.06);
      btnBg.fillRoundedRect(x + 1, y + 1, bw - 2, bh / 2 - 1, { tl: 4, tr: 4, bl: 0, br: 0 });
    };

    drawBtn(0x14142e, 0x5555bb, 0.7, 0.9);

    // Button text
    const text = this.add.text(cx, y + bh / 2, label, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '16px',
      color: '#b8b8dd',
      fontStyle: 'bold',
      letterSpacing: 3
    }).setOrigin(0.5).setAlpha(0);

    // Entrance animation
    this.tweens.add({
      targets: [btnBg, text],
      alpha: { from: 0, to: 1 },
      y: { from: y + 10, to: y },
      duration: 700,
      delay: delay,
      ease: 'Back.easeOut'
    });

    // Make text interactive hitbox larger
    const hitZone = this.add.zone(cx, y + bh / 2, bw, bh).setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => {
      drawBtn(0x1e1e44, 0x7777dd, 0.85, 0.95);
      text.setColor('#e8e8ff');
      this.tweens.add({
        targets: [btnBg, text],
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 180,
        ease: 'Back.easeOut'
      });
    });

    hitZone.on('pointerout', () => {
      drawBtn(0x14142e, 0x5555bb, 0.7, 0.9);
      text.setColor('#b8b8dd');
      this.tweens.add({
        targets: [btnBg, text],
        scaleX: 1,
        scaleY: 1,
        duration: 180,
        ease: 'Back.easeOut'
      });
    });

    hitZone.on('pointerdown', () => {
      drawBtn(0x0c0c1e, 0x4444aa, 0.6, 0.85);
      text.setColor('#9999bb');
      this.tweens.add({
        targets: [btnBg, text],
        scaleX: 0.96,
        scaleY: 0.96,
        duration: 80,
        ease: 'Power2'
      });
    });

    hitZone.on('pointerup', () => {
      callback();
    });
  }

  buildFooter(w, h) {
    // Version / credit text
    const footer = this.add.text(w / 2, h - 20, 'v0.1  -  An Idle Adventure', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '10px',
      color: '#444455'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: footer,
      alpha: 0.5,
      duration: 1000,
      delay: 1500,
      ease: 'Power2'
    });
  }
}
