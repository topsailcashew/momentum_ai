import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getDb } from '@/firebase/server-init';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getOAuth2Client } from '@/lib/google';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
  }

  try {
    // Check if Google OAuth is configured
    const oauth2Client = getOAuth2Client();

    const db = getDb();
    const userTokensRef = doc(db, 'users', userId, 'private', 'googleTokens');
    const tokenDoc = await getDoc(userTokensRef);

    if (!tokenDoc.exists()) {
      return NextResponse.json({ error: 'No Google Calendar connected' }, { status: 404 });
    }

    const tokenData = tokenDoc.data();

    // Set credentials from stored tokens
    oauth2Client.setCredentials({
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken,
      expiry_date: tokenData.expiryDate,
    });

    // Check if token needs refresh
    const now = Date.now();
    if (tokenData.expiryDate && tokenData.expiryDate < now) {
      console.log('Token expired, refreshing...');
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);

        // Update stored tokens
        await setDoc(userTokensRef, {
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token || tokenData.refreshToken,
          expiryDate: credentials.expiry_date,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        return NextResponse.json({ error: 'Failed to refresh token. Please reconnect your calendar.' }, { status: 401 });
      }
    }

    // Initialize Calendar API
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get time range for events (next 7 days by default)
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 7);

    // Fetch events
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    // Transform events to a simpler format
    const transformedEvents = events.map(event => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location,
      htmlLink: event.htmlLink,
      attendees: event.attendees?.map(a => ({
        email: a.email,
        displayName: a.displayName,
        responseStatus: a.responseStatus,
      })),
    }));

    return NextResponse.json({ events: transformedEvents });
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }

    // Check if this is a configuration error
    if (error.message?.includes('client ID or secret')) {
      return NextResponse.json({
        error: 'Google Calendar integration is not configured. Please contact the administrator.',
        details: error.message,
        configError: true,
      }, { status: 503 });
    }

    return NextResponse.json({
      error: 'Failed to fetch calendar events',
      details: error.message
    }, { status: 500 });
  }
}
