import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsEngine } from '@/lib/analytics/metrics';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const analytics = new AnalyticsEngine();
    
    const timeSeriesData = await analytics.getTimeSeriesData(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json(timeSeriesData);
  } catch (error) {
    console.error('Time series error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time series data' },
      { status: 500 }
    );
  }
}