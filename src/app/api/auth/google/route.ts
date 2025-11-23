import { getOAuth2Client } from '@/lib/google';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
  }

  try {
    const oauth2Client = getOAuth2Client();

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],
      prompt: 'consent',
      state: userId, // Pass user ID through OAuth flow
    });

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error('Error generating auth URL:', error);

    // Check if this is a configuration error
    if (error.message?.includes('client ID or secret')) {
      return NextResponse.json({
        error: 'Google Calendar integration is not configured.',
        details: error.message,
        configError: true,
      }, { status: 503 });
    }

    return NextResponse.json({
      error: 'Failed to initiate Google Calendar connection',
      details: error.message
    }, { status: 500 });
  }
}
