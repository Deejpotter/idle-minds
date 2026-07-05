const DEFAULT_BASE_URL = 'http://localhost:1234/v1';
const REQUEST_TIMEOUT = 5000;

export class LLMService {
  constructor(baseUrl = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
    this.connected = false;
    this.queue = [];
    this.processing = false;
  }

  async checkConnection() {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        signal: AbortSignal.timeout(3000)
      });
      this.connected = res.ok;
      return this.connected;
    } catch {
      this.connected = false;
      return false;
    }
  }

  async narrate(event) {
    if (!this.connected) return this.fallback(event);

    const prompt = this.buildNarrationPrompt(event);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'local-model',
          messages: [
            { role: 'system', content: 'You narrate dungeon adventures in 1-2 sentences. Be exciting and concise. Only output the narration text, nothing else.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 80,
          temperature: 0.8
        }),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!res.ok) return this.fallback(event);

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      return text || this.fallback(event);
    } catch {
      return this.fallback(event);
    }
  }

  async generateBossDialogue(bossName, party) {
    if (!this.connected) return this.fallbackBoss(bossName);

    const partyNames = party.map(h => h.name).join(', ');
    const prompt = `${bossName} is about to fight the adventuring party: ${partyNames}. As the boss, say one threatening or taunting line.`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'local-model',
          messages: [
            { role: 'system', content: 'You are a dungeon boss. Speak one short threatening line. Only output the line, nothing else.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 50,
          temperature: 0.9
        }),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!res.ok) return this.fallbackBoss(bossName);

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      return text || this.fallbackBoss(bossName);
    } catch {
      return this.fallbackBoss(bossName);
    }
  }

  buildNarrationPrompt(event) {
    if (event.type === 'damage') {
      return `Narrate: ${event.source} attacked ${event.target} for ${event.amount} damage${event.isCrit ? '. It was a critical hit!' : ''}. Describe this briefly.`;
    }
    if (event.type === 'heal') {
      return `Narrate: ${event.source} healed ${event.target} for ${event.amount} HP. Describe this briefly.`;
    }
    if (event.type === 'death') {
      return `Narrate: ${event.target} has been defeated. Describe the fall briefly.`;
    }
    if (event.type === 'enrage') {
      return `Narrate: ${event.source} has become enraged, growing more powerful and dangerous. Describe this transformation briefly.`;
    }
    return `Narrate an exciting dungeon battle moment.`;
  }

  fallback(event) {
    if (event.type === 'damage') {
      const crit = event.isCrit ? ' — a devastating critical hit!' : '.';
      return `${event.source} strikes ${event.target} for ${event.amount} damage${crit}`;
    }
    if (event.type === 'heal') {
      return `${event.source} restores ${event.amount} HP to ${event.target}.`;
    }
    if (event.type === 'death') {
      return `${event.target} collapses, defeated.`;
    }
    if (event.type === 'enrage') {
      return `${event.source} grows furious and more dangerous!`;
    }
    return '';
  }

  fallbackBoss(bossName) {
    const lines = [
      `"You dare challenge ${bossName}? Foolish mortals!"`,
      `${bossName} laughs: "You will not leave this place alive!"`,
      `"Another group of adventurers... ${bossName} will enjoy this."`,
      `${bossName} roars, shaking the very walls.`
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
}
