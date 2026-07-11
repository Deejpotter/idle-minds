// ─── Design Tokens ───────────────────────────────────────────────
const FONT_SERIF = 'Georgia, "Times New Roman", serif';
const FONT_MONO = '"Courier New", Courier, monospace';

const CLR = {
  // Backgrounds
  panelBg:      0x0e0c18,
  panelBgAlpha: 0.92,
  panelBorder:  0x2a2850,
  panelTitle:   0x8888bb,

  // Buttons
  btnBg:        0x181830,
  btnBorder:    0x4444aa,
  btnHover:     0x24244a,
  btnHoverBdr:  0x6666cc,
  btnDown:      0x0c0c1e,
  btnText:      '#c0c0dd',
  btnTextHover: '#e8e8ff',
  btnTextDown:  '#9999bb',

  // Stat bars
  barBg:        0x1a1a2e,
  barBorder:    0x333355,

  // Text
  textMuted:    '#666680',
  textBody:     '#aaaacc',
  textBright:   '#ddddee',
};

// ─── Panel ───────────────────────────────────────────────────────
export function createPanel(scene, x, y, w, h, title) {
  const g = scene.add.graphics();

  // Outer shadow glow
  g.fillStyle(CLR.panelBorder, 0.08);
  g.fillRoundedRect(x - 2, y - 2, w + 4, h + 4, 6);

  // Main fill — subtle gradient effect via two rects
  g.fillStyle(CLR.panelBg, CLR.panelBgAlpha);
  g.fillRoundedRect(x, y, w, h, 5);

  // Top highlight strip
  g.fillStyle(0xffffff, 0.03);
  g.fillRoundedRect(x + 1, y + 1, w - 2, Math.min(3, h / 4), { tl: 5, tr: 5, bl: 0, br: 0 });

  // Border
  g.lineStyle(1, CLR.panelBorder, 0.8);
  g.strokeRoundedRect(x, y, w, h, 5);

  let titleText = null;
  let contentY = y + 8;

  if (title) {
    // Title background strip
    g.fillStyle(0xffffff, 0.02);
    g.fillRect(x + 1, y + 1, w - 2, 20);

    titleText = scene.add.text(x + 10, y + 5, title.toUpperCase(), {
      fontFamily: FONT_SERIF,
      fontSize: '14px',
      color: '#7777aa',
      fontStyle: 'bold',
      letterSpacing: 2
    });
    contentY = y + 28;
  }

  return { graphics: g, titleText, x, y, w, h, contentY };
}

// ─── Button ──────────────────────────────────────────────────────
// Returns a controller: { graphics, text, x, y, width, height, destroy() }.
// `colors` lets callers theme the button (e.g. dashboard quick-actions).
// NOTE: the interactive hit area is a Zone, not the Graphics object — Graphics
// has no default hit area in Phaser, so calling setInteractive() on it directly
// makes the button unclickable. Do not change this without also adding a hitArea.
export function createButton(scene, x, y, label, callback, widthOrOpts = 120, height = 28, colors = null) {
  let width = widthOrOpts;
  if (typeof widthOrOpts === 'object' && widthOrOpts !== null) {
    // legacy positional signature: (scene,x,y,label,callback,width,height,colors)
    width = widthOrOpts.width ?? 120;
    height = widthOrOpts.height ?? 28;
    colors = widthOrOpts.colors ?? null;
  }
  const h = height;
  const c = colors || CLR;
  const g = scene.add.graphics();

  const draw = (bg, bdr, bdrAlpha) => {
    g.clear();
    // Outer glow
    g.fillStyle(bdr, 0.1);
    g.fillRoundedRect(x - 2, y - 2, width + 4, h + 4, 5);
    // Border
    g.lineStyle(1, bdr, bdrAlpha);
    g.strokeRoundedRect(x, y, width, h, 4);
    // Fill
    g.fillStyle(bg, 0.9);
    g.fillRoundedRect(x + 1, y + 1, width - 2, h - 2, 3);
    // Top highlight
    g.fillStyle(0xffffff, 0.05);
    g.fillRoundedRect(x + 2, y + 1, width - 4, Math.floor(h / 2) - 1, { tl: 3, tr: 3, bl: 0, br: 0 });
  };

  draw(c.btnBg, c.btnBorder, 0.6);

  const text = scene.add.text(x + width / 2, y + h / 2, label, {
    fontFamily: FONT_MONO,
    fontSize: '14px',
    color: c.btnText,
    fontStyle: 'bold'
  }).setOrigin(0.5);

  // Use a zone for reliable hit detection
  const zone = scene.add.zone(x + width / 2, y + h / 2, width, h).setInteractive({ useHandCursor: true });

  zone.on('pointerover', () => {
    draw(c.btnHover, c.btnHoverBdr, 0.8);
    text.setColor(c.btnTextHover);
    scene.tweens.add({ targets: [g, text], scaleX: 1.03, scaleY: 1.03, duration: 120, ease: 'Back.easeOut' });
  });

  zone.on('pointerout', () => {
    draw(c.btnBg, c.btnBorder, 0.6);
    text.setColor(c.btnText);
    scene.tweens.add({ targets: [g, text], scaleX: 1, scaleY: 1, duration: 120, ease: 'Back.easeOut' });
  });

  zone.on('pointerdown', () => {
    draw(c.btnDown, c.btnBorder, 0.5);
    text.setColor(c.btnTextDown);
    scene.tweens.add({ targets: [g, text], scaleX: 0.97, scaleY: 0.97, duration: 60, ease: 'Power2' });
  });

  zone.on('pointerup', () => {
    callback();
    // brief click confirmation flash
    draw(c.btnHover, c.btnHoverBdr, 0.9);
    scene.tweens.add({ targets: [g, text], scaleX: 1, scaleY: 1, duration: 120, ease: 'Back.easeOut' });
    scene.time.delayedCall(90, () => {
      if (text.active) { draw(c.btnBg, c.btnBorder, 0.6); text.setColor(c.btnText); }
    });
  });

  return {
    graphics: g,
    text,
    x,
    y,
    width,
    height: h,
    destroy() {
      zone.destroy();
      g.destroy();
      text.destroy();
    }
  };
}

// ─── Stat Bar ────────────────────────────────────────────────────
export function createStatBar(scene, x, y, label, value, maxValue, color, width = 120) {
  const barH = 8;
  const labelW = 32;

  const labelText = scene.add.text(x, y + 1, label, {
    fontFamily: FONT_MONO,
    fontSize: '13px',
    color: '#8888aa',
    fontStyle: 'bold'
  });

  // Bar background
  const bgGraphic = scene.add.graphics();
  bgGraphic.fillStyle(CLR.barBg, 1);
  bgGraphic.fillRoundedRect(x + labelW, y + 1, width, barH, 3);
  bgGraphic.lineStyle(1, CLR.barBorder, 0.5);
  bgGraphic.strokeRoundedRect(x + labelW, y + 1, width, barH, 3);

  // Bar fill
  const fillGraphic = scene.add.graphics();
  const pct = Math.max(0, Math.min(1, maxValue > 0 ? value / maxValue : 0));
  const fillColor = Phaser.Display.Color.HexStringToColor(color).color;
  if (pct > 0) {
    fillGraphic.fillStyle(fillColor, 0.85);
    fillGraphic.fillRoundedRect(x + labelW + 1, y + 2, Math.max(2, Math.floor((width - 2) * pct)), barH - 2, 2);
  }

  // Value text
  const valText = scene.add.text(x + labelW + width + 6, y + 1, `${Math.floor(value)}/${Math.floor(maxValue)}`, {
    fontFamily: FONT_MONO,
    fontSize: '12px',
    color: '#888899'
  });

  return {
    update(newValue, newMax) {
      fillGraphic.clear();
      const p = Math.max(0, Math.min(1, newMax > 0 ? newValue / newMax : 0));
      if (p > 0) {
        fillGraphic.fillStyle(fillColor, 0.85);
        fillGraphic.fillRoundedRect(x + labelW + 1, y + 2, Math.max(2, Math.floor((width - 2) * p)), barH - 2, 2);
      }
      valText.setText(`${Math.floor(newValue)}/${Math.floor(newMax)}`);
    },
    destroy() {
      labelText.destroy();
      bgGraphic.destroy();
      fillGraphic.destroy();
      valText.destroy();
    }
  };
}

// ─── Convenience: Section Divider ────────────────────────────────
export function createDivider(scene, x, y, w) {
  const g = scene.add.graphics();
  g.lineStyle(1, 0x2a2850, 0.4);
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + w, y);
  g.strokePath();
  return g;
}

// ─── Convenience: Gold Badge ─────────────────────────────────────
export function createGoldDisplay(scene, x, y, amount) {
  const text = scene.add.text(x, y, `\u25C6 ${amount}`, {
    fontFamily: FONT_MONO,
    fontSize: '15px',
    color: '#ddaa00',
    fontStyle: 'bold'
  });
  return {
    update(newAmount) {
      text.setText(`\u25C6 ${newAmount}`);
    },
    destroy() { text.destroy(); }
  };
}
