import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/firebase/server-init';
import { getOAuth2Client } from '@/lib/google';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const db = getDb();
    const userTokensRef = db.collection('users').doc(userId).collection('private').doc('googleTokens');
    const tokenDoc = await userTokensRef.get();

    if (tokenDoc.exists) {
      const tokenData = tokenDoc.data();

      // Revoke the token with Google
      if (tokenData?.accessToken) {
        try {
          const oauth2Client = getOAuth2Client();
          await oauth2Client.revokeToken(tokenData.accessToken);
        } catch (revokeError) {
          // Log but don't fail - we still want to delete local tokens
          console.error('Error revoking token with Google:', revokeError);
        }
      }

      // Delete tokens from Firestore
      await userTokensRef.delete();
    }

    return NextResponse.json({ success: true, message: 'Calendar disconnected successfully' });
  } catch (error: any) {
    console.error('Error disconnecting calendar:', error);
    return NextResponse.json({
      error: 'Failed to disconnect calendar',
      details: error.message
    }, { status: 500 });
  }
}
