import { getOAuth2Client } from '@/lib/google';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getDb } from '@/firebase/server-init';
import { doc, setDoc } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // User ID passed through state

  if (typeof code !== 'string') {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  }

  if (!state) {
    console.error('Missing state parameter (userId)');
    return NextResponse.redirect(new URL('/profile?status=error&message=missing_user', req.url));
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const userId = state;

    // Save tokens to Firestore for the user
    const db = getDb();
    const userTokensRef = doc(db, 'users', userId, 'private', 'googleTokens');
    await setDoc(userTokensRef, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        updatedAt: new Date().toISOString(),
    }, { merge: true });


    // Redirect user to the profile page with a success message
    return NextResponse.redirect(new URL('/profile?status=success', req.url));
  } catch (error: any) {
    console.error('Error exchanging code for tokens:', error);
    // Redirect with an error
    return NextResponse.redirect(new URL(`/profile?status=error&message=${encodeURIComponent(error.message || 'Unknown error')}`, req.url));
  }
}
