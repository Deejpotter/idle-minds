import { FONT_MONO, CLR } from './tokens.js';

const TYPE_STYLES = {
  success: { bg: 0x183018, border: 0x44aa44, text: CLR.success },
  warning: { bg: 0x302818, border: 0xaa8844, text: CLR.warning },
  error: { bg: 0x301818, border: 0xaa4444, text: CLR.error },
  info: { bg: 0x181830, border: 0x4444aa, text: CLR.textBody },
};

let toastQueue = [];
let toastActive = false;

function drainQueue(scene) {
  if (toastActive || toastQueue.length === 0) return;
  const next = toastQueue.shift();
  toastActive = true;
  renderToast(scene, next.message, next.type, () => {
    toastActive = false;
    drainQueue(scene);
  });
}

function renderToast(scene, message, type, onDone) {
  const style = TYPE_STYLES[type] || TYPE_STYLES.info;
  const depth = 500;
  const y = 520;
  const padX = 14;
  const padY = 8;

  const text = scene.add.text(400, y, message, {
    fontFamily: FONT_MONO,
    fontSize: '14px',
    color: style.text,
    wordWrap: { width: 560 },
    align: 'center',
  }).setOrigin(0.5).setDepth(depth + 1).setAlpha(0);

  const bw = Math.min(600, text.width + padX * 2);
  const bh = text.height + padY * 2;
  const bg = scene.add.graphics().setDepth(depth).setAlpha(0);
  bg.fillStyle(style.bg, 0.95);
  bg.fillRoundedRect(400 - bw / 2, y - bh / 2, bw, bh, 4);
  bg.lineStyle(1, style.border, 0.9);
  bg.strokeRoundedRect(400 - bw / 2, y - bh / 2, bw, bh, 4);

  scene.tweens.add({
    targets: [bg, text],
    alpha: 1,
    duration: 200,
    ease: 'Power2',
    onComplete: () => {
      scene.time.delayedCall(2200, () => {
        scene.tweens.add({
          targets: [bg, text],
          alpha: 0,
          y: y - 12,
          duration: 300,
          onComplete: () => {
            bg.destroy();
            text.destroy();
            onDone();
          },
        });
      });
    },
  });
}

/** Show a transient toast message (success | warning | error | info). */
export function showToast(scene, message, type = 'info') {
  toastQueue.push({ message, type });
  drainQueue(scene);
}
