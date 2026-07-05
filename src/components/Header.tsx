import { UserButton, Show } from '@clerk/nextjs';
import Link from 'next/link';

export function Header() {
  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 32px',
      borderBottom: '2px solid var(--border)',
      background: '#0a0812',
    }}>
      <Link href="/" style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '14px',
        color: 'var(--accent)',
      }}>
        IDLE MINDS
      </Link>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Show when="signed-out">
          <Link href="/sign-in" style={{ color: 'var(--text-dim)' }}>Sign In</Link>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
