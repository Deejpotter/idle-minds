/**
 * Juice.js — reusable polish/feedback helpers.
 * Kept dependency-light: uses Graphics-based transient particles (same style as
 * the existing death/hit particles) so it works on the CANVAS renderer without
 * the Phaser particle-emitter API surface. Every helper self-cleans.
 */

const FONT_SERIF = 'Georgia, "Times New Roman", serif';
const FONT_MONO = '"Courier New", Courier, monospace';

// Floating "+◈ N" gold pop at a screen/world position.
export function goldPop(scene, x, y, amount, color = '#ddaa00') {
  const txt = scene.add.text(x, y, `+◈ ${amount}`, {
    fontFamily: FONT_MONO,
    fontSize: '16px',
    color,
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 3
  }).setOrigin(0.5).setDepth(120);

  // little coin sparkle
  const coin = scene.add.graphics().setDepth(119);
  coin.fillStyle(0xddaa00, 0.9);
  coin.fillCircle(0, 0, 3);
  coin.setPosition(x, y);
  scene.tweens.add({ targets: coin, y: y - 26, alpha: 0, duration: 700, ease: 'Power2', onComplete: () => coin.destroy() });

  scene.tweens.add({
    targets: txt,
    y: y - 38,
    x: x + Phaser.Math.Between(-8, 8),
    alpha: 0,
    duration: 1100,
    ease: 'Back.easeOut',
    onComplete: () => txt.destroy()
  });
}

// Tween a numeric Text from -> to (count-up) for satisfying number changes.
export function countUpText(scene, textObj, from, to, duration = 600) {
  const proxy = { v: from };
  scene.tweens.add({
    targets: proxy,
    v: to,
    duration,
    ease: 'Cubic.easeOut',
    onUpdate: () => textObj.setText(`◈ ${Math.floor(proxy.v)}`)
  });
}

// Small radial particle burst at (x,y). color is a hex int.
export function hitSpark(scene, x, y, color = 0xffaa44, count = 8, spread = 60) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const g = scene.add.graphics().setDepth(40);
    g.fillStyle(color, 0.9);
    g.fillCircle(0, 0, Phaser.Math.Between(1, 3));
    g.setPosition(x, y);
    const ang = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const spd = spread * (0.5 + Math.random() * 0.5);
    parts.push(g);
    scene.tweens.add({
      targets: g,
      x: x + Math.cos(ang) * spd,
      y: y + Math.sin(ang) * spd,
      alpha: 0,
      scale: 0.2,
      duration: 350 + Math.random() * 200,
      ease: 'Power2',
      onComplete: () => g.destroy()
    });
  }
}

// Expanding ring flash (crits, level-ups).
export function ringFlash(scene, x, y, color = 0xffee44, maxR = 60) {
  const ring = scene.add.graphics().setDepth(45);
  ring.lineStyle(3, color, 0.9);
  ring.strokeCircle(x, y, 6);
  scene.tweens.add({
    targets: ring,
    scale: maxR / 6,
    alpha: 0,
    duration: 420,
    ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy()
  });
}

// Victory/level-up burst: ring + coin particles upward.
export function celebrateBurst(scene, x, y, color = 0xddaa00) {
  ringFlash(scene, x, y, color, 90);
  for (let i = 0; i < 14; i++) {
    const g = scene.add.graphics().setDepth(46);
    g.fillStyle(i % 2 ? 0xddaa00 : 0xffee88, 0.95);
    g.fillCircle(0, 0, Phaser.Math.Between(2, 4));
    g.setPosition(x, y);
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const spd = 70 + Math.random() * 90;
    scene.tweens.add({
      targets: g,
      x: x + Math.cos(ang) * spd,
      y: y + Math.sin(ang) * spd + 40,
      alpha: 0,
      duration: 700 + Math.random() * 400,
      ease: 'Quad.easeOut',
      onComplete: () => g.destroy()
    });
  }
}

// Brief slow-mo punch for crits.
export function critSlowmo(scene, scale = 0.35, ms = 90) {
  scene.time.timeScale = scale;
  scene.tweens.timeScale = scale;
  scene.time.delayedCall(ms * scale, () => {
    scene.time.timeScale = 1;
    scene.tweens.timeScale = 1;
  });
}

// Camera flash + tiny zoom punch for scene/room transitions.
export function flashPunch(scene, color = 0xffffff, alpha = 0.12) {
  scene.cameras.main.flash(220, 0, 0, 0, false);
  scene.cameras.main.zoomTo(1.04, 120, 'Power2', false);
  scene.time.delayedCall(120, () => scene.cameras.main.zoomTo(1, 180, 'Power2', false));
}

// Floating "LEVEL UP!" text above a hero.
export function levelUpText(scene, x, y) {
  const txt = scene.add.text(x, y, 'LEVEL UP!', {
    fontFamily: FONT_SERIF,
    fontSize: '15px',
    color: '#ffee66',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 3
  }).setOrigin(0.5).setDepth(120);
  scene.tweens.add({
    targets: txt,
    y: y - 36,
    alpha: 0,
    scale: 1.2,
    duration: 1300,
    ease: 'Back.easeOut',
    onComplete: () => txt.destroy()
  });
}
