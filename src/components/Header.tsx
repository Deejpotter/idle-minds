import { UserButton, Show } from '@clerk/nextjs';
import Link from 'next/link';

export function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        IDLE MINDS
      </Link>
      <div className="nav">
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
