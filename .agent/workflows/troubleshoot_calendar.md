---
description: Troubleshoot Google Calendar API connection issues
---
1. **Check Server Logs**
   - Look at the terminal where `npm run dev` is running.
   - Refresh the `/calendar` page.
   - You should see an error log starting with "Error fetching calendar events".
   - If it says "Google Calendar API has not been used in project...", follow step 2.

2. **Enable Google Calendar API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com).
   - Select your project.
   - Click **Enable**.
   - Wait a few minutes for changes to propagate.

3. **Verify Scopes**
   - Ensure your OAuth consent screen includes the scope: `https://www.googleapis.com/auth/calendar.readonly`.
   - If you changed scopes, you may need to disconnect and reconnect your account in the app settings.

4. **Check Token Storage**
   - If the logs say "No Google Calendar connected" but the UI says connected, there might be a mismatch in Firestore.
   - Try disconnecting and reconnecting in the Settings page.
