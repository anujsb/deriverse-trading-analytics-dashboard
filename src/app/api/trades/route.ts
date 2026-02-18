import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { trades } from '@/lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { count } from 'drizzle-orm';


export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const symbol = searchParams.get('symbol');
        const status = searchParams.get('status'); // 'OPEN' | 'CLOSED' to filter
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }


        const conditions = [eq(trades.userId, userId)];

        if (startDate) {
            conditions.push(gte(trades.timestamp, new Date(startDate)));
        }
        if (endDate) {
            conditions.push(lte(trades.timestamp, new Date(endDate)));
        }
        if (symbol) {
            conditions.push(eq(trades.symbol, symbol));
        }
        if (status === 'OPEN' || status === 'CLOSED') {
            conditions.push(eq(trades.status, status));
        }

        const userTrades = await db
            .select()
            .from(trades)
            .where(and(...conditions))
            .orderBy(desc(trades.timestamp))
            .limit(limit)
            .offset(offset);


        const totalCount = await db
            //   .select({ count: sql<number>`count(*)` })
            .select({ value: count() })
            .from(trades)
            .where(and(...conditions));

        return NextResponse.json({
            trades: userTrades,
            total: totalCount[0]?.value || 0,
            limit,
            offset,
        });
    } catch (error) {
        console.error('Trades fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch trades' },
            { status: 500 }
        );
    }
}