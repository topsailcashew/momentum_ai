---
description: Set up Google Calendar integration for Momentum AI
---
1. **Create .env.local** (if it doesn't exist) and add the three variables:
   ```dotenv
   GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
   NEXT_PUBLIC_BASE_URL=http://localhost:3000   # or your production URL
   ```
2. **Google Cloud Console**  
   - Open **APIs & Services → OAuth consent screen**.  
   - Set the app name, support email, and add the scope `https://www.googleapis.com/auth/calendar.readonly`.  
   - Save.

3. **Create OAuth credentials**  
   - Go to **Credentials → Create OAuth client ID → Web application**.  
   - Add **Authorized redirect URIs**:
     - Development: `http://localhost:3000/api/auth/google/callback`  
     - Production: `https://yourdomain.com/api/auth/google/callback`  
   - Copy the **Client ID** and **Client Secret** into `.env.local`.

4. **Enable Google Calendar API**  
   - In the Cloud Console, navigate to **Library** and enable **Google Calendar API** for the project.

5. **Update Firestore security rules** (if needed) to allow the user to read/write `users/{uid}/private/googleTokens`. Example:
   ```js
   match /users/{uid} {
     allow read, write: if request.auth.uid == uid;
     match /private/{docId} {
       allow read, write: if request.auth.uid == uid;
     }
   }
   ```

6. **Restart the dev server** (`npm run dev`) so Next.js picks up the new env vars.

7. **Test the integration**  
   - Visit `/settings`.  
   - Click **Connect**, go through Google consent, and verify the status badge changes to **Connected**.  
   - Open `/calendar` and confirm upcoming events appear.

8. **Deploy**  
   - Add the same env vars to your hosting provider.  
   - Update the authorized redirect URI in Google Cloud to the production URL.  
   - Deploy the app.

**Done!** 🎉
