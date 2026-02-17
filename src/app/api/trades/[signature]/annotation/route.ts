import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tradeAnnotations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ signature: string }> }
) {
  try {
    const { signature } = await params;
    const searchParams = _request.nextUrl?.searchParams;
    const userId = searchParams?.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    const rows = await db
      .select()
      .from(tradeAnnotations)
      .where(
        and(
          eq(tradeAnnotations.tradeSignature, signature),
          eq(tradeAnnotations.userId, userId)
        )
      )
      .limit(1);
    const annotation = rows[0] ?? null;
    return NextResponse.json(annotation ? { note: annotation.note, tags: annotation.tags } : null);
  } catch (error) {
    console.error('Annotation GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch annotation' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ signature: string }> }
) {
  try {
    const { signature } = await params;
    const body = await request.json();
    const { userId, note, tags } = body as { userId?: string; note?: string; tags?: string[] };
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    const id = `${userId}:${signature}`;
    await db
      .insert(tradeAnnotations)
      .values({
        id,
        tradeSignature: signature,
        userId,
        note: typeof note === 'string' ? note : '',
        tags: Array.isArray(tags) ? tags : undefined,
      })
      .onConflictDoUpdate({
        target: tradeAnnotations.id,
        set: {
          note: typeof note === 'string' ? note : '',
          tags: Array.isArray(tags) ? tags : undefined,
          updatedAt: new Date(),
        },
      });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Annotation POST error:', error);
    return NextResponse.json({ error: 'Failed to save annotation' }, { status: 500 });
  }
}
