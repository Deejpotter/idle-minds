'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function DungeonCrawlGameClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>(null);
  const { userId, isSignedIn } = useAuth();

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    if (isSignedIn && userId) {
      (window as any).__IDLE_MINDS_USER_ID__ = userId;
    }

    let cancelled = false;

    async function loadGame() {
      const Phaser = (await import('phaser')).default;
      (window as any).Phaser = Phaser;

      if (cancelled || !containerRef.current) return;

      const script = document.createElement('script');
      script.type = 'module';
      script.src = '/games/dungeon-crawl/js/main.js';
      script.onload = () => {
        if ((window as any).__PHASER_GAME__) {
          gameRef.current = (window as any).__PHASER_GAME__;
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
      (window as any).__PHASER_GAME__ = undefined;
    };
  }, [userId, isSignedIn]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#08060f',
    }}>
      <div ref={containerRef} id="game-container" />
    </div>
  );
}
