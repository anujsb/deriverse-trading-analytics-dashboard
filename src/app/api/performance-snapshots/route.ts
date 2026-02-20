// src/app/api/performance-snapshots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { performanceSnapshots } from '@/lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId    = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate   = searchParams.get('endDate');
    const limit     = parseInt(searchParams.get('limit') || '90');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const conditions = [eq(performanceSnapshots.userId, userId)];
    if (startDate) conditions.push(gte(performanceSnapshots.date, new Date(startDate)));
    if (endDate)   conditions.push(lte(performanceSnapshots.date, new Date(endDate)));

    const snapshots = await db
      .select()
      .from(performanceSnapshots)
      .where(and(...conditions))
      .orderBy(desc(performanceSnapshots.date))
      .limit(limit);

    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error('Snapshots fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
  }
}