import PhaserGameClient from '@/components/PhaserGameClient';
import { listGames } from '@/lib/game-registry';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ gameId: string }>;
}

export default async function GamePage({ params }: Props) {
  const { gameId } = await params;
  const games = await listGames();
  const game = games.find(g => g.id === gameId);
  if (!game) notFound();

  return <PhaserGameClient gameId={game.id} gameName={game.name} />;
}
