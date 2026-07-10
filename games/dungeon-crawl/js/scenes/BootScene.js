import Phaser from 'phaser';
import { generateAllSprites } from '../systems/SpriteGenerator.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    const cy = height / 2;

    // Dark background
    const bg = this.add.graphics();
    bg.fillStyle(0x08060f, 1);
    bg.fillRect(0, 0, width, height);

    // Game name - small
    const title = this.add.text(cx, cy - 40, 'IDLE MINDS', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '20px',
      color: '#555566',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);

    // Loading bar background
    const barW = 180;
    const barH = 4;
    const barX = cx - barW / 2;
    const barY = cy + 10;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x222233, 1);
    barBg.fillRoundedRect(barX, barY, barW, barH, 2);
    barBg.setAlpha(0);

    // Loading bar fill
    const barFill = this.add.graphics();
    barFill.setAlpha(0);

    // Loading text
    const loadText = this.add.text(cx, barY + 20, 'Preparing your adventure...', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '11px',
      color: '#444455'
    }).setOrigin(0.5).setAlpha(0);

    // Animate in
    this.tweens.add({
      targets: title,
      alpha: 0.6,
      duration: 400,
      ease: 'Power2'
    });

    this.tweens.add({
      targets: [barBg, barFill, loadText],
      alpha: 1,
      duration: 300,
      delay: 200,
      ease: 'Power2'
    });

    // Generate sprites (the heavy work)
    generateAllSprites(this);

    // Animate loading bar filling
    this.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 600,
      delay: 200,
      ease: 'Power2',
      onUpdate: (tween) => {
        const val = tween.getValue();
        barFill.clear();
        barFill.fillStyle(0x5555aa, 0.7);
        barFill.fillRoundedRect(barX, barY, Math.floor(barW * val / 100), barH, 2);
      }
    });

    // After a short pause for visual feel, transition to title
    this.time.delayedCall(900, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start('TitleScene');
      });
    });
  }
}