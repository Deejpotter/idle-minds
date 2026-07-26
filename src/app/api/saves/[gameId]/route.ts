import { requireAuth } from '@/lib/auth';
import { listSaves } from '@/lib/save-store';
import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const userId = await requireAuth();
  const { gameId } = await params;
  const slots = await listSaves(userId, gameId);
  return NextResponse.json({ slots });
}
