import { listGames } from '@/lib/game-registry';
import { GameCard } from '@/components/GameCard';
import { Header } from '@/components/Header';

export default async function Home() {
  const games = await listGames();
  return (
    <main>
      <Header />
      <h1 style={{ textAlign: 'center', padding: '32px 0', fontSize: '20px' }}>
        IDLE MINDS
      </h1>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
        padding: '0 32px 32px',
      }}>
        {games.map(g => <GameCard key={g.id} game={g} />)}
      </div>
    </main>
  );
}
