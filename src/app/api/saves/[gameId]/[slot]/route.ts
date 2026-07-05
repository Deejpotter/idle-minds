import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readSave, writeSave, deleteSave } from '@/lib/save-store';

export async function GET(req: Request, { params }: { params: Promise<{ gameId: string; slot: string }> }) {
  try {
    const userId = await requireAuth();
    const { gameId, slot } = await params;
    const data = await readSave(userId, gameId, slot);
    return NextResponse.json(data ?? { empty: true });
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ gameId: string; slot: string }> }) {
  try {
    const userId = await requireAuth();
    const { gameId, slot } = await params;
    const body = await req.json();
    await writeSave(userId, gameId, slot, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ gameId: string; slot: string }> }) {
  try {
    const userId = await requireAuth();
    const { gameId, slot } = await params;
    await deleteSave(userId, gameId, slot);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
