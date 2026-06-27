export class CombatSystem {
  constructor() {
    this.party = [];
    this.enemies = [];
    this.combatLog = [];
    this.tickCount = 0;
    this.onTick = null;
    this.onRoomClear = null;
    this.onPartyWipe = null;
    this.onDungeonComplete = null;
    this.onLootDrop = null;
    this._threatTable = new Map();
  }

  startCombat(party, enemies) {
    this.party = party;
    this.enemies = enemies;
    this.combatLog = [];
    this.tickCount = 0;
    this._threatTable = new Map();

    for (const hero of party) {
      this._threatTable.set(hero.id, new Map());
    }
  }

  processTick() {
    this.tickCount++;
    const events = [];

    this._reduceCooldowns(this.party);
    this._reduceCooldowns(this.enemies);

    for (const hero of this.party) {
      if (hero.isAlive()) {
        const maxMp = hero.getEffectiveStats().mp;
        const regen = Math.min(3, maxMp - hero.currentMp);
        if (regen > 0) hero.currentMp += regen;
      }
    }

    const aliveHeroes = this.party.filter(h => h.isAlive()).sort((a, b) => {
      const statsA = a.getEffectiveStats();
      const statsB = b.getEffectiveStats();
      return statsB.speed - statsA.speed;
    });

    for (const hero of aliveHeroes) {
      const heroEvents = this._heroAction(hero);
      events.push(...heroEvents);
      if (this._isRoomCleared()) break;
    }

    const aliveEnemies = this.enemies.filter(e => e.currentHp > 0);
    for (const enemy of aliveEnemies) {
      if (enemy.isBoss && !enemy.isEnraged && enemy.enrageThreshold != null) {
        if (enemy.currentHp / enemy.maxHp < enemy.enrageThreshold) {
          enemy.isEnraged = true;
          events.push({
            type: 'enrage',
            source: enemy.name,
            target: null,
            amount: 0,
            ability: null,
            isCrit: false,
            message: `${enemy.name} has become enraged!`
          });
        }
      }

      const enemyEvents = this._enemyAction(enemy);
      events.push(...enemyEvents);
      if (this._isPartyWiped()) break;
    }

    const deathEvents = this._checkDeaths();
    events.push(...deathEvents);

    const isComplete = this._isRoomCleared();
    const partyWiped = this._isPartyWiped();

    this.combatLog.push(...events);

    if (this.onTick) {
      this.onTick(events, this.tickCount);
    }

    if (isComplete && this.onRoomClear) {
      this.onRoomClear(this.party, this.enemies);
    }

    if (partyWiped && this.onPartyWipe) {
      this.onPartyWipe(this.party);
    }

    return { events, isComplete, partyWiped };
  }

  _reduceCooldowns(units) {
    for (const unit of units) {
      for (const ability of unit.abilities) {
        if (ability.currentCooldown > 0) {
          ability.currentCooldown--;
        }
      }
    }
  }

  _heroAction(hero) {
    const events = [];
    const aliveEnemies = this.enemies.filter(e => e.currentHp > 0);
    if (aliveEnemies.length === 0) return events;

    let selectedAbility = null;
    for (const ability of hero.abilities) {
      if (ability.id === 'basic_attack') continue;
      if (ability.currentCooldown > 0) continue;
      if (hero.currentMp < ability.manaCost) continue;
      selectedAbility = ability;
      break;
    }

    if (!selectedAbility) {
      selectedAbility = hero.abilities.find(a => a.id === 'basic_attack');
    }

    if (selectedAbility.manaCost > 0) {
      hero.useMana(selectedAbility.manaCost);
    }

    const targets = this._selectTarget(hero, selectedAbility, 'hero');

    if (Array.isArray(targets)) {
      for (const target of targets) {
        const actionEvents = this._executeAction(hero, target, selectedAbility);
        events.push(...actionEvents);
      }
    } else {
      const actionEvents = this._executeAction(hero, targets, selectedAbility);
      events.push(...actionEvents);
    }

    if (selectedAbility.cooldown > 0) {
      selectedAbility.currentCooldown = selectedAbility.cooldown;
    }

    return events;
  }

  _enemyAction(enemy) {
    const events = [];
    const aliveHeroes = this.party.filter(h => h.isAlive());
    if (aliveHeroes.length === 0) return events;

    let selectedAbility = null;
    for (const ability of enemy.abilities) {
      if (ability.currentCooldown > 0) continue;
      selectedAbility = ability;
      break;
    }

    if (!selectedAbility) {
      selectedAbility = {
        id: 'basic_attack',
        name: 'Basic Attack',
        type: 'physical',
        power: 1.0,
        cooldown: 0,
        currentCooldown: 0,
        manaCost: 0,
        targeting: 'random_hero'
      };
    }

    const targets = this._selectTarget(enemy, selectedAbility, 'enemy');

    if (Array.isArray(targets)) {
      for (const target of targets) {
        const actionEvents = this._executeAction(enemy, target, selectedAbility);
        events.push(...actionEvents);
      }
    } else {
      const actionEvents = this._executeAction(enemy, targets, selectedAbility);
      events.push(...actionEvents);
    }

    if (selectedAbility.cooldown > 0) {
      selectedAbility.currentCooldown = selectedAbility.cooldown;
    }

    return events;
  }

  _selectTarget(unit, ability, side) {
    if (ability.targeting === 'self') return unit;

    if (side === 'hero') {
      return this._selectHeroTarget(unit, ability);
    }
    return this._selectEnemyTarget(unit, ability);
  }

  _selectHeroTarget(hero, ability) {
    const aliveEnemies = this.enemies.filter(e => e.currentHp > 0);

    switch (ability.targeting) {
      case 'enemy_threat': {
        const threatMap = this._threatTable.get(hero.id);
        let maxThreat = -1;
        let target = aliveEnemies[0];
        for (const enemy of aliveEnemies) {
          const threat = threatMap ? (threatMap.get(enemy.id) || 0) : 0;
          if (threat > maxThreat) {
            maxThreat = threat;
            target = enemy;
          }
        }
        return target;
      }
      case 'lowest_hp_enemy': {
        let minHpPct = 1;
        let target = aliveEnemies[0];
        for (const enemy of aliveEnemies) {
          const pct = enemy.currentHp / enemy.maxHp;
          if (pct < minHpPct) {
            minHpPct = pct;
            target = enemy;
          }
        }
        return target;
      }
      case 'all_enemies':
        return aliveEnemies;
      case 'lowest_hp_ally': {
        const aliveAllies = this.party.filter(h => h.isAlive() && h.id !== hero.id);
        if (aliveAllies.length === 0) return hero;
        let minPct = 1;
        let target = aliveAllies[0];
        for (const ally of aliveAllies) {
          const stats = ally.getEffectiveStats ? ally.getEffectiveStats() : ally.stats;
          const pct = ally.currentHp / stats.hp;
          if (pct < minPct) {
            minPct = pct;
            target = ally;
          }
        }
        if (minPct >= 0.95) {
          let maxPct = 0;
          for (const ally of aliveAllies) {
            const stats = ally.getEffectiveStats ? ally.getEffectiveStats() : ally.stats;
            const pct = ally.currentHp / stats.hp;
            if (pct > maxPct) { maxPct = pct; target = ally; }
          }
          return null;
        }
        return target;
      }
      default:
        return aliveEnemies[0];
    }
  }

  _selectEnemyTarget(enemy, ability) {
    const aliveHeroes = this.party.filter(h => h.isAlive());

    switch (ability.targeting) {
      case 'highest_threat': {
        let maxThreat = -1;
        let target = aliveHeroes[0];
        for (const hero of aliveHeroes) {
          let totalThreat = 0;
          const threatMap = this._threatTable.get(hero.id);
          if (threatMap) {
            for (const threat of threatMap.values()) {
              totalThreat += threat;
            }
          }
          if (totalThreat > maxThreat) {
            maxThreat = totalThreat;
            target = hero;
          }
        }
        return target;
      }
      case 'random_hero':
        return aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
      case 'lowest_hp_hero': {
        let minHpPct = 1;
        let target = aliveHeroes[0];
        for (const hero of aliveHeroes) {
          const stats = hero.getEffectiveStats();
          const pct = hero.currentHp / stats.hp;
          if (pct < minHpPct) {
            minHpPct = pct;
            target = hero;
          }
        }
        return target;
      }
      case 'all_heroes':
        return aliveHeroes;
      default:
        return aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
    }
  }

  _calculateDamage(attacker, defender, ability) {
    const attackerStats = attacker.getEffectiveStats
      ? attacker.getEffectiveStats()
      : attacker.stats;
    const defenderStats = defender.getEffectiveStats
      ? defender.getEffectiveStats()
      : defender.stats;

    const attackPower = (ability.type === 'magic' || ability.type === 'aoe_magic')
      ? attackerStats.magic : attackerStats.attack;
    const baseDamage = attackPower * ability.power;
    const isCrit = Math.random() < attackerStats.critChance;
    const critBonus = isCrit ? attackerStats.critMultiplier : 1.0;
    const rawDamage = baseDamage * critBonus;
    const variance = 0.8 + Math.random() * 0.4;
    const damage = Math.max(1, Math.floor(rawDamage * variance - defenderStats.defense * 0.5));

    return { damage, isCrit };
  }

  _executeAction(attacker, defender, ability) {
    const events = [];
    const attackerName = attacker.name;

    if (!defender || !defender.takeDamage) return events;

    if (ability.type === 'heal_self') {
      const attackerStats = attacker.getEffectiveStats
        ? attacker.getEffectiveStats()
        : attacker.stats;
      const healAmount = Math.floor(attackerStats.attack * ability.power);
      attacker.heal(healAmount);

      events.push({
        type: 'heal',
        source: attackerName,
        target: attackerName,
        amount: healAmount,
        ability: ability.name,
        isCrit: false,
        message: `${attackerName} uses ${ability.name} and heals for ${healAmount} HP`
      });

      if (attacker.id && attacker.id.startsWith('hero_')) {
        const threatAmount = Math.floor(healAmount * 0.5);
        for (const enemy of this.enemies) {
          if (enemy.currentHp > 0) {
            this._addThreat(attacker.id, enemy.id, threatAmount);
          }
        }
      }

      return events;
    }

    if (ability.type === 'heal_ally') {
      if (!defender || !defender.heal) return events;
      const attackerStats = attacker.getEffectiveStats
        ? attacker.getEffectiveStats()
        : attacker.stats;
      const healAmount = Math.floor((attackerStats.magic || attackerStats.attack) * ability.power);
      defender.heal(healAmount);

      events.push({
        type: 'heal',
        source: attackerName,
        target: defender.name,
        amount: healAmount,
        ability: ability.name,
        isCrit: false,
        message: `${attackerName} uses ${ability.name} on ${defender.name} for ${healAmount} HP`
      });

      if (attacker.id && attacker.id.startsWith('hero_')) {
        const threatAmount = Math.floor(healAmount * 0.3);
        for (const enemy of this.enemies) {
          if (enemy.currentHp > 0) {
            this._addThreat(attacker.id, enemy.id, threatAmount);
          }
        }
      }

      return events;
    }

    if (ability.type === 'summon') {
      events.push({
        type: 'ability',
        source: attackerName,
        target: attackerName,
        amount: 0,
        ability: ability.name,
        isCrit: false,
        message: `${attackerName} uses ${ability.name}!`
      });
      return events;
    }

    if (Array.isArray(defender)) {
      for (const target of defender) {
        if (target.currentHp <= 0) continue;
        const { damage, isCrit } = this._calculateDamage(attacker, target, ability);
        target.takeDamage(damage);

        events.push({
          type: 'damage',
          source: attackerName,
          target: target.name,
          amount: damage,
          ability: ability.name,
          isCrit: isCrit,
          message: `${attackerName} uses ${ability.name} on ${target.name} for ${damage}${isCrit ? ' (CRIT!)' : ''} damage`
        });

        if (attacker.id && attacker.id.startsWith('hero_')) {
          this._addThreat(attacker.id, target.id, damage);
        }
      }
    } else {
      const { damage, isCrit } = this._calculateDamage(attacker, defender, ability);
      defender.takeDamage(damage);

      events.push({
        type: 'damage',
        source: attackerName,
        target: defender.name,
        amount: damage,
        ability: ability.name,
        isCrit: isCrit,
        message: `${attackerName} uses ${ability.name} on ${defender.name} for ${damage}${isCrit ? ' (CRIT!)' : ''} damage`
      });

      if (attacker.id && attacker.id.startsWith('hero_')) {
        this._addThreat(attacker.id, defender.id, damage);
      }
    }

    return events;
  }

  _checkDeaths() {
    const events = [];

    for (const enemy of this.enemies) {
      if (enemy.currentHp <= 0 && !enemy._dead) {
        enemy._dead = true;
        events.push({
          type: 'death',
          source: null,
          target: enemy.name,
          amount: 0,
          ability: null,
          isCrit: false,
          message: `${enemy.name} has been defeated!`
        });
      }
    }

    for (const hero of this.party) {
      if (!hero.isAlive() && !hero._dead) {
        hero._dead = true;
        events.push({
          type: 'death',
          source: null,
          target: hero.name,
          amount: 0,
          ability: null,
          isCrit: false,
          message: `${hero.name} has fallen!`
        });
      }
    }

    return events;
  }

  _isRoomCleared() {
    return this.enemies.every(e => e.currentHp <= 0);
  }

  _isPartyWiped() {
    return this.party.every(h => !h.isAlive());
  }

  _addLog(message, type) {
    this.combatLog.push({
      type: type,
      source: null,
      target: null,
      amount: 0,
      ability: null,
      isCrit: false,
      message: message
    });
  }

  _addThreat(heroId, enemyId, amount) {
    if (!this._threatTable.has(heroId)) return;
    const hero = this.party.find(h => h.id === heroId);
    let finalAmount = amount;
    if (hero && hero.className === 'paladin') {
      finalAmount = Math.floor(amount * 1.5);
    }
    const threatMap = this._threatTable.get(heroId);
    const current = threatMap.get(enemyId) || 0;
    threatMap.set(enemyId, current + finalAmount);
  }

  _getHighestThreatTarget(heroId) {
    const threatMap = this._threatTable.get(heroId);
    if (!threatMap) return null;

    let maxThreat = -1;
    let target = null;
    for (const [enemyId, threat] of threatMap) {
      if (threat > maxThreat) {
        maxThreat = threat;
        target = enemyId;
      }
    }
    return target;
  }
}
