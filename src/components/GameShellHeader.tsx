'use client';

import Link from 'next/link';
import { UserButton, Show } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

type SaveStatus = 'idle' | 'saving' | 'cloud-saved' | 'local-only' | 'error';

const STATUS_LABELS: Record<SaveStatus, string> = {
  idle: '',
  saving: 'Saving…',
  'cloud-saved': 'Cloud saved',
  'local-only': 'Local save',
  error: 'Save failed',
};

export function GameShellHeader({ gameName }: { gameName?: string }) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { status?: SaveStatus };
      if (detail?.status) setSaveStatus(detail.status);
    };
    window.addEventListener('idle-minds-save-status', handler);
    return () => window.removeEventListener('idle-minds-save-status', handler);
  }, []);

  return (
    <header className="game-shell-header">
      <div className="game-shell-header-left">
        <Link href="/" className="brand game-shell-back">
          ← Games
        </Link>
        {gameName && <span className="game-shell-title">{gameName}</span>}
      </div>
      <div className="game-shell-header-right">
        {saveStatus !== 'idle' && (
          <span className={`save-status save-status-${saveStatus}`}>
            {STATUS_LABELS[saveStatus]}
          </span>
        )}
        <Show when="signed-out">
          <Link href="/sign-in" className="game-shell-signin">
            Sign in to sync
          </Link>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
