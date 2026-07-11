/**
 * Dashboard - Single-glance overview panel rendered inside GuildScene.
 * Shows key metrics, active expeditions, and quick actions.
 *
 * The UI is built ONCE (openDashboard) and only the dynamic text values are
 * refreshed every 2s. This avoids the previous bug where the whole panel was
 * destroyed/recreated each refresh (flicker + lost hover + unclickable buttons,
 * because the old code called setInteractive() on Graphics objects which have no
 * default hit area in Phaser).
 */

const FONT_SERIF = 'Georgia, "Times New Roman", serif';
const FONT_MONO = '"Courier New", Courier, monospace';

import { createButton } from './Panels.js';

// Button color themes
const BTN_SHOP =    { btnBg: 0x18305a, btnBorder: 0x3a6acc, btnHover: 0x244a88, btnHoverBdr: 0x5a8cee, btnDown: 0x0c1830, btnText: '#cfe0ff', btnTextHover: '#ffffff', btnTextDown: '#9fb8e0' };
const BTN_DUNGEON = { btnBg: 0x5a3018, btnBorder: 0xcc6a3a, btnHover: 0x884a24, btnHoverBdr: 0xee8c5a, btnDown: 0x30180c, btnText: '#ffe0cf', btnTextHover: '#ffffff', btnTextDown: '#e0b89f' };
const BTN_EXPED =   { btnBg: 0x185a30, btnBorder: 0x3acc6a, btnHover: 0x24884a, btnHoverBdr: 0x5aee8c, btnDown: 0x0c3018, btnText: '#cfffe0', btnTextHover: '#ffffff', btnTextDown: '#9fe0b8' };
const BTN_CLOSE =   { btnBg: 0x30305a, btnBorder: 0x6a6acc, btnHover: 0x4a4a88, btnHoverBdr: 0x8c8cee, btnDown: 0x181830, btnText: '#c0c0ff', btnTextHover: '#ffffff', btnTextDown: '#9090e0' };

/**
 * Open (build) the dashboard. Returns a controller with refresh()/close().
 * @param {Phaser.Scene} scene - GuildScene
 * @param {Object} ctx - { economy, gameState, expeditionSystem }
 * @param {Object} actions - { onClose, onShop, onDungeon, onExpeditions }
 */
export function openDashboard(scene, ctx, actions) {
  const created = [];
  const { width, height } = scene.cameras.main;

  // Background overlay
  const bg = scene.add.graphics();
  bg.fillStyle(0x000000, 0.75);
  bg.fillRect(0, 0, width, height);
  bg.setDepth(150);
  created.push(bg);

  // Main panel
  const px = 80, py = 50, pw = 640, ph = 460;
  const panelBg = scene.add.graphics();
  panelBg.fillStyle(0x0e0c18, 0.96);
  panelBg.fillRoundedRect(px, py, pw, ph, 6);
  panelBg.lineStyle(1, 0x4444aa, 0.8);
  panelBg.strokeRoundedRect(px, py, pw, ph, 6);
  panelBg.setDepth(151);
  created.push(panelBg);

  // Title strip
  const titleStrip = scene.add.graphics();
  titleStrip.fillStyle(0x181830, 1);
  titleStrip.fillRect(px + 1, py + 1, pw - 2, 24);
  titleStrip.setDepth(152);
  created.push(titleStrip);

  const title = scene.add.text(px + 12, py + 5, 'GUILD DASHBOARD', {
    fontFamily: FONT_SERIF, fontSize: '15px', color: '#7777aa', fontStyle: 'bold', letterSpacing: 2
  });
  title.setDepth(153);
  created.push(title);

  let sy = py + 36;

  // ─── Section 1: Overview ─────────────────────────────
  const overHeader = scene.add.text(px + 12, sy, 'OVERVIEW', {
    fontFamily: FONT_SERIF, fontSize: '11px', color: '#7777aa', fontStyle: 'bold', letterSpacing: 1.5
  });
  overHeader.setDepth(153);
  created.push(overHeader);
  sy += 18;

  const colW = (pw - 24) / 4;
  const overviewDefs = [
    { label: 'Gold', color: '#ddaa00' },
    { label: 'Gold/min', color: '#88cc88' },
    { label: 'Heroes', color: '#aabbcc' },
    { label: 'Guild Level', color: '#cc88cc' }
  ];
  const overviewValueTexts = [];
  overviewDefs.forEach((def, i) => {
    const x = px + 12 + i * colW;
    const label = scene.add.text(x, sy, def.label, { fontFamily: FONT_MONO, fontSize: '10px', color: '#888899', letterSpacing: 1 });
    label.setDepth(153);
    const value = scene.add.text(x, sy + 14, '', { fontFamily: FONT_SERIF, fontSize: '16px', color: def.color, fontStyle: 'bold' });
    value.setDepth(153);
    created.push(label, value);
    overviewValueTexts.push(value);
  });
  sy += 40;

  // ─── Section 2: Active Expeditions ──────────────────────
  const expHeader = scene.add.text(px + 12, sy, 'ACTIVE EXPEDITIONS', {
    fontFamily: FONT_SERIF, fontSize: '11px', color: '#7777aa', fontStyle: 'bold', letterSpacing: 1.5
  });
  expHeader.setDepth(153);
  created.push(expHeader);
  sy += 18;

  const expEmptyText = scene.add.text(px + pw / 2, sy + 6, 'No active expeditions — send heroes on one!', {
    fontFamily: FONT_SERIF, fontSize: '12px', color: '#666680', fontStyle: 'italic'
  }).setOrigin(0.5, 0).setDepth(153);
  created.push(expEmptyText);

  // Dynamic expedition rows (rebuilt only when the set of active expeditions changes)
  let expRowObjs = [];
  let expRowSignature = null;

  const clearExpRows = () => {
    for (const o of expRowObjs) o.destroy();
    expRowObjs = [];
  };

  // ─── Section 3: Quick Actions ───────────────────────────
  const actionsY = sy + 28;
  const actionsHeader = scene.add.text(px + 12, actionsY, 'QUICK ACTIONS', {
    fontFamily: FONT_SERIF, fontSize: '11px', color: '#7777aa', fontStyle: 'bold', letterSpacing: 1.5
  });
  actionsHeader.setDepth(153);
  created.push(actionsHeader);

  const buttonY = actionsY + 20;
  const btnW = (pw - 36) / 3 - 4;
  const buttons = [
    { label: 'Open Shop', color: BTN_SHOP, callback: actions.onShop },
    { label: 'Enter Dungeon', color: BTN_DUNGEON, callback: actions.onDungeon },
    { label: 'Send Expedition', color: BTN_EXPED, callback: actions.onExpeditions }
  ];
  let bx = px + 12;
  for (const btn of buttons) {
    const b = createButton(scene, bx, buttonY, btn.label, btn.callback, { width: btnW, height: 32, colors: btn.color });
    b.graphics.setDepth(153);
    b.text.setDepth(154);
    created.push(b.graphics, b.text);
    bx += btnW + 8;
  }

  // ─── Close button ───────────────────────────────────────
  const closeBtnY = py + ph - 38;
  const closeBtn = createButton(scene, px + pw - 100, closeBtnY, 'Close (X)', actions.onClose, { width: 88, height: 28, colors: BTN_CLOSE });
  closeBtn.graphics.setDepth(153);
  closeBtn.text.setDepth(154);
  created.push(closeBtn.graphics, closeBtn.text);

  // ─── Hint text ──────────────────────────────────────────
  const hint = scene.add.text(px + 12, closeBtnY + 8, 'Dashboard refreshes every 2 seconds.', {
    fontFamily: FONT_MONO, fontSize: '10px', color: '#555577', fontStyle: 'italic'
  });
  hint.setDepth(153);
  created.push(hint);

  // ─── Refresh logic ──────────────────────────────────────
  const refresh = () => {
    // Overview values
    const gold = ctx.economy.getGold();
    const guildState = { level: ctx.gameState.guild.level, upgrades: ctx.gameState.guild.upgrades || {} };
    const goldPerMin = ctx.economy.calculatePassiveGoldPerMinute(guildState);
    const aliveHeroes = ctx.gameState.heroes.filter(h => h.isAlive());
    overviewValueTexts[0].setText(`${gold}`);
    overviewValueTexts[1].setText(`${goldPerMin.toFixed(1)}`);
    overviewValueTexts[2].setText(`${aliveHeroes.length}/${ctx.gameState.heroes.length}`);
    overviewValueTexts[3].setText(`${ctx.gameState.guild.level}`);

    // Expeditions
    const active = Array.from(ctx.expeditionSystem.activeExpeditions.values());
    if (active.length === 0) {
      expEmptyText.setVisible(true);
      if (expRowSignature !== null) { clearExpRows(); expRowSignature = null; }
      return;
    }
    expEmptyText.setVisible(false);
    const sig = active.map(e => e.id).join(',');
    if (sig === expRowSignature) return; // no structural change; values update on next full rebuild
    expRowSignature = sig;
    clearExpRows();
    let ry = sy;
    for (const exp of active) {
      const rowBg = scene.add.graphics();
      rowBg.fillStyle(0x181030, 0.6);
      rowBg.fillRoundedRect(px + 12, ry, pw - 24, 36, 3);
      rowBg.setDepth(153);
      const remainingMs = exp.endTime - Date.now();
      const remainingMin = Math.max(0, Math.ceil(remainingMs / 60000));
      const name = scene.add.text(px + 18, ry + 4, exp.name, { fontFamily: FONT_SERIF, fontSize: '12px', color: '#ddddee', fontStyle: 'bold' }).setDepth(154);
      const sub = scene.add.text(px + 18, ry + 20, `${exp.heroes.length} heroes | ${remainingMin}m left`, { fontFamily: FONT_MONO, fontSize: '10px', color: '#777799' }).setDepth(154);
      expRowObjs.push(rowBg, name, sub);
      ry += 40;
    }
  };

  refresh();

  return {
    refresh,
    close() {
      for (const el of created) if (el && typeof el.destroy === 'function') el.destroy();
      clearExpRows();
    }
  };
}
