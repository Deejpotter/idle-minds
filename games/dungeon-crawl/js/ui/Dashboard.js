/**
 * Dashboard - Single-glance overview panel rendered inside GuildScene
 * Shows key metrics, active expeditions, and quick actions.
 */

const FONT_SERIF = 'Georgia, "Times New Roman", serif';
const FONT_MONO = '"Courier New", Courier, monospace';

/**
 * Render the dashboard overlay
 * @param {Phaser.Scene} scene - GuildScene
 * @param {Object} ctx - { economy, gameState, expeditionSystem }
 * @param {Object} actions - { onClose, onShop, onDungeon, onExpeditions }
 * @returns {Array} Phaser game objects created (so caller can destroy)
 */
export function renderDashboard(scene, ctx, actions) {
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
    fontFamily: FONT_SERIF,
    fontSize: '15px',
    color: '#7777aa',
    fontStyle: 'bold',
    letterSpacing: 2
  });
  title.setDepth(153);
  created.push(title);

  let sy = py + 36;

  // ─── Section 1: Key Metrics ─────────────────────────────
  sy = renderSection(scene, created, px, sy, pw, 'OVERVIEW', () => {
    const gold = ctx.economy.getGold();
    const guildState = {
      level: ctx.gameState.guild.level,
      upgrades: ctx.gameState.guild.upgrades || {}
    };
    const goldPerMin = ctx.economy.calculatePassiveGoldPerMinute(guildState);

    const aliveHeroes = ctx.gameState.heroes.filter(h => h.isAlive());
    const xpPerMin = aliveHeroes.length * goldPerMin * 0.5; // rough estimate

    return [
      { label: 'Gold', value: `${gold}`, color: '#ddaa00' },
      { label: 'Gold/min', value: `${goldPerMin.toFixed(1)}`, color: '#88cc88' },
      { label: 'Heroes', value: `${aliveHeroes.length}/${ctx.gameState.heroes.length}`, color: '#aabbcc' },
      { label: 'Guild Level', value: `${ctx.gameState.guild.level}`, color: '#cc88cc' }
    ];
  });

  // ─── Section 2: Active Expeditions ──────────────────────
  sy = renderSection(scene, created, px, sy + 12, pw, 'ACTIVE EXPEDITIONS', () => {
    const active = Array.from(ctx.expeditionSystem.activeExpeditions.values());
    if (active.length === 0) {
      return [{ empty: true, text: 'No active expeditions — send heroes on one!' }];
    }

    return active.map(exp => {
      const remainingMs = exp.endTime - Date.now();
      const remainingMin = Math.max(0, Math.ceil(remainingMs / 60000));
      return {
        name: exp.name,
        subtext: `${exp.heroes.length} heroes | ${formatRemaining(remainingMin)} left`,
        progress: exp.progress,
        isExpedition: true,
        id: exp.id
      };
    });
  });

  // ─── Section 3: Quick Actions ───────────────────────────
  const actionsY = sy + 12;
  const actionsHeader = scene.add.text(px + 12, actionsY, 'QUICK ACTIONS', {
    fontFamily: FONT_SERIF,
    fontSize: '11px',
    color: '#7777aa',
    fontStyle: 'bold',
    letterSpacing: 1.5
  });
  actionsHeader.setDepth(153);
  created.push(actionsHeader);

  // Quick action buttons
  const buttonY = actionsY + 20;
  const buttons = [
    { label: 'Open Shop', color: 0x224488, callback: actions.onShop },
    { label: 'Enter Dungeon', color: 0x884422, callback: actions.onDungeon },
    { label: 'Send Expedition', color: 0x448844, callback: actions.onExpeditions }
  ];

  let bx = px + 12;
  for (const btn of buttons) {
    const btnW = (pw - 36) / 3 - 4;
    const btnBg = scene.add.graphics();
    btnBg.fillStyle(btn.color, 0.7);
    btnBg.fillRoundedRect(bx, buttonY, btnW, 32, 4);
    btnBg.lineStyle(1, 0x6666cc, 0.6);
    btnBg.strokeRoundedRect(bx, buttonY, btnW, 32, 4);
    btnBg.setDepth(153);

    const btnText = scene.add.text(bx + btnW / 2, buttonY + 8, btn.label, {
      fontFamily: FONT_SERIF,
      fontSize: '13px',
      color: '#ddddee',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(154);

    btnBg.setInteractive({ useHandCursor: true });
    btnBg.on('pointerover', () => btnBg.setAlpha(1));
    btnBg.on('pointerout', () => btnBg.setAlpha(0.85));
    btnBg.on('pointerdown', () => {
      if (btn.callback) btn.callback();
    });

    created.push(btnBg, btnText);
    bx += btnW + 8;
  }

  // ─── Close button ───────────────────────────────────────
  const closeBtnY = py + ph - 38;
  const closeBtn = scene.add.graphics();
  closeBtn.fillStyle(0x444488, 0.85);
  closeBtn.fillRoundedRect(px + pw - 100, closeBtnY, 88, 28, 4);
  closeBtn.lineStyle(1, 0x6666cc, 0.8);
  closeBtn.strokeRoundedRect(px + pw - 100, closeBtnY, 88, 28, 4);
  closeBtn.setDepth(153);
  created.push(closeBtn);

  const closeText = scene.add.text(px + pw - 56, closeBtnY + 6, 'Close (X)', {
    fontFamily: FONT_SERIF,
    fontSize: '12px',
    color: '#ddddee',
    fontStyle: 'bold'
  }).setOrigin(0.5, 0).setDepth(154);
  created.push(closeText);

  closeBtn.setInteractive({ useHandCursor: true });
  closeBtn.on('pointerdown', () => actions.onClose && actions.onClose());

  // Hint text
  const hint = scene.add.text(px + 12, closeBtnY + 8, 'Dashboard refreshes every 2 seconds.', {
    fontFamily: FONT_MONO,
    fontSize: '10px',
    color: '#555577',
    fontStyle: 'italic'
  });
  hint.setDepth(153);
  created.push(hint);

  return created;
}

// ─── Helpers ──────────────────────────────────────────────────

function renderSection(scene, created, px, sy, pw, header, getRows) {
  const headerText = scene.add.text(px + 12, sy, header, {
    fontFamily: FONT_SERIF,
    fontSize: '11px',
    color: '#7777aa',
    fontStyle: 'bold',
    letterSpacing: 1.5
  });
  headerText.setDepth(153);
  created.push(headerText);
  sy += 18;

  const rows = getRows();

  // Empty state
  if (rows.length === 1 && rows[0].empty) {
    const emptyText = scene.add.text(px + pw / 2, sy + 6, rows[0].text, {
      fontFamily: FONT_SERIF,
      fontSize: '12px',
      color: '#666680',
      fontStyle: 'italic'
    }).setOrigin(0.5, 0).setDepth(153);
    created.push(emptyText);
    return sy + 28;
  }

  // Check first row type
  if (rows[0].label !== undefined) {
    // Key/value rows
    const colW = (pw - 24) / Math.min(rows.length, 4);
    rows.forEach((row, i) => {
      const x = px + 12 + i * colW;
      const label = scene.add.text(x, sy, row.label, {
        fontFamily: FONT_MONO,
        fontSize: '10px',
        color: '#888899',
        letterSpacing: 1
      });
      label.setDepth(153);
      created.push(label);

      const value = scene.add.text(x, sy + 14, row.value, {
        fontFamily: FONT_SERIF,
        fontSize: '16px',
        color: row.color || '#ddddee',
        fontStyle: 'bold'
      });
      value.setDepth(153);
      created.push(value);
    });
    return sy + 40;
  } else {
    // Expedition rows
    rows.forEach((row) => {
      const rowBg = scene.add.graphics();
      rowBg.fillStyle(0x181830, 0.6);
      rowBg.fillRoundedRect(px + 12, sy, pw - 24, 36, 3);
      rowBg.setDepth(153);
      created.push(rowBg);

      const name = scene.add.text(px + 18, sy + 4, row.name, {
        fontFamily: FONT_SERIF,
        fontSize: '12px',
        color: '#ddddee',
        fontStyle: 'bold'
      });
      name.setDepth(154);
      created.push(name);

      const subtext = scene.add.text(px + 18, sy + 20, row.subtext, {
        fontFamily: FONT_MONO,
        fontSize: '10px',
        color: '#777799'
      });
      subtext.setDepth(154);
      created.push(subtext);

      // Progress bar
      if (row.progress !== undefined) {
        const barW = pw - 200;
        const barH = 6;
        const barX = px + pw - 24 - barW - 80;
        const barY = sy + 15;

        const barBg = scene.add.graphics();
        barBg.fillStyle(0x0a0812, 1);
        barBg.fillRoundedRect(barX, barY, barW, barH, 2);
        barBg.setDepth(154);
        created.push(barBg);

        const barFill = scene.add.graphics();
        barFill.fillStyle(0x6688cc, 0.9);
        barFill.fillRoundedRect(barX, barY, Math.floor(barW * row.progress / 100), barH, 2);
        barFill.setDepth(155);
        created.push(barFill);

        // Cancel button
        const cancelBtn = scene.add.text(px + pw - 18, sy + 12, 'Cancel', {
          fontFamily: FONT_MONO,
          fontSize: '10px',
          color: '#cc6644',
          fontStyle: 'bold'
        }).setOrigin(1, 0).setDepth(154);

        cancelBtn.setInteractive({ useHandCursor: true });
        cancelBtn.on('pointerover', () => cancelBtn.setColor('#ff8877'));
        cancelBtn.on('pointerout', () => cancelBtn.setColor('#cc6644'));
        cancelBtn.on('pointerdown', () => {
          if (row.id && row._onCancel) row._onCancel(row.id);
        });
        created.push(cancelBtn);
      }

      sy += 40;
    });
    return sy;
  }
}

function formatRemaining(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}