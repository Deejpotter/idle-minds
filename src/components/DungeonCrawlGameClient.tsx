'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import type Phaser from 'phaser';

declare global {
  interface Window {
    __IDLE_MINDS_USER_ID__?: string;
    Phaser?: typeof Phaser;
    __PHASER_GAME__?: Phaser.Game;
  }
}

export default function DungeonCrawlGameClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const { userId, isSignedIn } = useAuth();

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    if (isSignedIn && userId) {
      window.__IDLE_MINDS_USER_ID__ = userId;
    }

    let cancelled = false;

    async function loadGame() {
      const PhaserCtor = (await import('phaser')).default;
      window.Phaser = PhaserCtor;

      if (cancelled || !containerRef.current) return;

      const script = document.createElement('script');
      script.type = 'module';
      script.src = '/games/dungeon-crawl/js/main.js';
      script.onload = () => {
        if (window.__PHASER_GAME__) {
          gameRef.current = window.__PHASER_GAME__;
        }
      };
      document.body.appendChild(script);
    }

    loadGame();

    return () => {
      cancelled = true;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      window.__PHASER_GAME__ = undefined;
    };
  }, [userId, isSignedIn]);

  return (
    <div className="game-shell">
      <div ref={containerRef} id="game-container" />
    </div>
  );
}
