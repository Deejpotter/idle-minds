'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import type Phaser from 'phaser';
import { GameShellHeader } from './GameShellHeader';
import { SAVE_KEY } from '@/lib/save-constants';

declare global {
  interface Window {
    __IDLE_MINDS_USER_ID__?: string;
    __IDLE_MINDS_GAME_ID__?: string;
    Phaser?: typeof Phaser;
    __PHASER_GAME__?: Phaser.Game;
  }
}

interface PhaserGameClientProps {
  gameId: string;
  gameName?: string;
}

export default function PhaserGameClient({ gameId, gameName }: PhaserGameClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const { userId, isSignedIn, isLoaded } = useAuth();
  const [mergeOffer, setMergeOffer] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && userId) {
      window.__IDLE_MINDS_USER_ID__ = userId;
      if (typeof localStorage !== 'undefined' && localStorage.getItem(SAVE_KEY)) {
        setMergeOffer(true);
      }
    } else {
      window.__IDLE_MINDS_USER_ID__ = undefined;
    }
  }, [userId, isSignedIn, isLoaded]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    window.__IDLE_MINDS_GAME_ID__ = gameId;
    let cancelled = false;

    async function loadGame() {
      const PhaserCtor = (await import('phaser')).default;
      window.Phaser = PhaserCtor;

      if (cancelled || !containerRef.current) return;

      const script = document.createElement('script');
      script.type = 'module';
      script.src = `/games/${gameId}/js/main.js`;
      script.onload = () => {
        if (window.__PHASER_GAME__) {
          gameRef.current = window.__PHASER_GAME__;
        }
      };
      scriptRef.current = script;
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
      scriptRef.current?.remove();
      scriptRef.current = null;
    };
  }, [gameId]);

  const handleMergeSave = async () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw || !userId) return;
      const data = JSON.parse(raw);
      await fetch(`/api/saves/${gameId}/slot1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(data),
      });
      setMergeOffer(false);
    } catch {
      setMergeOffer(false);
    }
  };

  return (
    <div className="game-shell-with-header">
      <GameShellHeader gameName={gameName} />
      {mergeOffer && (
        <div className="merge-banner">
          <span>Upload your local save to the cloud?</span>
          <button type="button" onClick={handleMergeSave}>Upload</button>
          <button type="button" onClick={() => setMergeOffer(false)}>Dismiss</button>
        </div>
      )}
      <div className="game-shell">
        <div ref={containerRef} id="game-container" />
      </div>
    </div>
  );
}
