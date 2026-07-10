import { listGames } from '@/lib/game-registry';
import { GameCard } from '@/components/GameCard';
import { Header } from '@/components/Header';

export default async function Home() {
  const games = await listGames();
  return (
    <main>
      <Header />
      <h1 className="home-title">IDLE MINDS</h1>
      <div className="game-grid">
        {games.map(g => <GameCard key={g.id} game={g} />)}
      </div>
    </main>
  );
}
