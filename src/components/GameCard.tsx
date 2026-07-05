import Link from 'next/link';
import type { Game } from '@/lib/game-registry';

export function GameCard({ game }: { game: Game }) {
  return (
    <Link href={`/${game.id}`} className="game-card">
      <img src={game.thumbnail} alt={game.name} />
      <div style={{ marginTop: '8px' }}>
        <h3 style={{
          fontSize: '12px',
          color: 'var(--accent)',
          margin: '0 0 4px 0',
          lineHeight: 1.4,
        }}>
          {game.name}
        </h3>
        <p style={{
          color: 'var(--text-dim)',
          fontSize: '16px',
          margin: 0,
          lineHeight: 1.3,
        }}>
          {game.description}
        </p>
        <div style={{
          display: 'flex',
          gap: '6px',
          marginTop: '8px',
          flexWrap: 'wrap',
        }}>
          {game.tags.map(tag => (
            <span key={tag} style={{
              fontSize: '12px',
              color: 'var(--accent-2)',
              border: '1px solid var(--border)',
              padding: '1px 6px',
              borderRadius: '2px',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
