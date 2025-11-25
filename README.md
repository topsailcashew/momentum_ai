# Pace Pilot ⚡

> **Because productivity shouldn't feel like rocket science.**

Ever noticed how some days you're crushing it, and other days even making a simple to-do list feels like climbing Everest? That's where Pace Pilot comes in. We're not here to shame you with guilt-inducing notifications or turn task management into yet another chore. Instead, we're building your personal productivity sidekick that actually *gets* you.

## The Big Idea 💡

**Work with your energy, not against it.**

You know that feeling when you try to write a complex proposal at 3 PM when you're running on fumes? Or when you waste your peak morning energy on busywork? Yeah, we've all been there. Pace Pilot fixes that.

Here's the deal: you tell the app how you're feeling (Low, Medium, or High energy), and our AI analyzes your task list to suggest what you should actually work on right now. No judgment. No pressure. Just smart suggestions that match your current vibe.

Complete tasks that align with your energy? You build momentum. String together productive days? You get a streak. The app literally gamifies working smart, not just working hard.

## What Makes This Different? 🎯

**It's ridiculously simple to use.** We stripped away the complexity that makes most productivity apps feel like work themselves. Adding a task? Just type the name and hit Enter. That's it. Want to add more details like deadlines or categories? Cool, they're there when you need them. But they're not required.

**AI that actually helps.** Our AI doesn't just remind you of stuff you already know. It:
- Suggests which tasks match your current energy level
- Calculates a daily "momentum score" based on how well you aligned tasks with your energy
- Generates end-of-day reports that celebrate what you accomplished (not just what you didn't)
- Spots patterns in your productivity and shares insights without being preachy

**Music that helps you focus.** Pick from Jazz, Lo-Fi, Synth Wave, or Chill Trap, and let the beats roll while you work. The player automatically starts when you run the Pomodoro timer because multitasking is overrated.

**Automatic theme switching.** Your OS goes dark mode at sunset? So does the app. One less thing to think about.

## The Tour 🎪

### Workday: Your Daily Mission Control

This is home base. Start here every day.

- **Set your vibe** → Report your energy level (totally optional, but it unlocks the magic)
- **Get AI suggestions** → See the top 3 tasks that make sense for right now
- **Quick-add tasks** → Type and Enter. Done.
- **Focus mode** → Fire up the Pomodoro timer with your curated lo-fi playlist
- **See your streak** → Daily momentum score + how many days you've been on a roll
- **End your day** → Add notes, generate an AI report, and call it a wrap

### Reports: The Numbers (Made Interesting)

Forget boring analytics. This page actually tells you stuff worth knowing:

- **Your productivity patterns** → Which day of the week you're a beast, your energy sweet spot, top category
- **Weekly completion chart** → See your week at a glance
- **Category breakdown** → Where your energy actually goes
- **AI Flow Visualizer** → Get personalized insights on your task-energy alignment
- **Daily reports archive** → Browse past reports and email them to yourself

### Projects: The Big Picture Stuff

Group related tasks under projects (like "Launch podcast" or "Get abs"). Each project shows a completion percentage so you can see progress without drowning in details.

### Recurring Tasks: Set It and Forget It

Got weekly check-ins or monthly reviews? Add them once, and they'll auto-reset. No more manually recreating the same tasks like it's Groundhog Day.

### Weekly Planner: The Week Ahead

See all 7 days in a grid. Add tasks to specific dates. Spot which days are gonna be chaotic and which are chill. Balance your week like a pro.

## The Vibe ✨

**Encouraging, not guilt-tripping.** When you end your day, our AI writes a report that celebrates wins and acknowledges challenges without making you feel like garbage.

**Clean and simple.** No cluttered interface. No mystery buttons. Just the stuff that matters.

**Fast as heck.** Built with Next.js 15, everything loads instantly and feels smooth.

**Your data stays yours.** Everything is locked to your account with Firebase security rules. We can't see your tasks even if we wanted to.

## Tech Stack (For the Nerds) 🤓

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **UI**: Radix UI + shadcn/ui (because we're not animals)
- **AI**: Google Gemini 2.5 Flash via Genkit
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Charts**: Recharts
- **Email**: Resend
- **Music**: YouTube IFrame API (audio-only, no video bandwidth waste)

## Getting Started 🚀

### You'll Need:
- Node.js 18+
- A Firebase project (free tier is fine)
- Google AI API key for Gemini

### Setup:

1. **Clone it:**
   ```bash
   git clone <repository-url>
   cd momentum-ai
   ```

2. **Install:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create `.env` in the root:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   GOOGLE_GENAI_API_KEY=your_gemini_api_key
   ```

4. **Deploy Firestore rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Fire it up:**
   ```bash
   npm run dev
   ```

6. **Visit:**
   Open [http://localhost:3000](http://localhost:3000)

## The Philosophy 🧘

**Productivity shouldn't add stress to your life.** Most task apps become another source of anxiety. We're building the opposite: a tool that meets you where you are, adapts to your energy, and actually makes task management feel... dare we say... *fun*?

**Progress > Perfection.** Got low energy today? Cool, knock out some easy tasks. Feeling like a superhero? Tackle the gnarly stuff. Either way, you're building momentum.

**AI as a coach, not a boss.** Our AI suggests, celebrates, and provides insights. It doesn't nag, judge, or make you feel bad. Think of it as that supportive friend who knows when to push you and when to tell you to chill.

## Daily Workflow (How This Thing Actually Works) 📅

1. **Morning:** Open the app → Report your energy → Check AI suggestions
2. **During the day:** Add tasks with quick-add → Use Pomodoro timer → Complete stuff
3. **End of day:** Hit "End Day" → Add notes → Generate AI report
4. **Whenever:** Check Reports page to see patterns and celebrate progress

## Contributing 🤝

Got ideas? Found a bug? Want to make this better? Pull requests are welcome! We're building this in the open.

## License 📜

MIT License - use it, fork it, make it your own. Just don't blame us if you become too productive.

---

**Built by someone who was tired of productivity apps that felt like homework.**

*Now go build some momentum.* ⚡
