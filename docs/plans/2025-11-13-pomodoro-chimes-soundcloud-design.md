# Pomodoro Bell Chimes and SoundCloud Music Player Design

**Date:** 2025-11-13
**Status:** Approved
**Architecture:** Hybrid Web Audio + Widget

## Overview

This design adds two features to the existing Pomodoro timer:

1. **Bell Chimes**: Distinct audio tones when timers start and end
2. **SoundCloud Music Player**: Collapsible widget that auto-plays concentration music during Focus sessions

## Requirements

### Bell Chimes
- Different sounds for timer start (lower tone) vs timer end (higher tone)
- Play when Focus or Break session starts
- Play when Focus or Break session ends
- Use Web Audio API to generate tones programmatically (no audio files needed)

### SoundCloud Music Player
- Collapsible widget (always present, can minimize/expand)
- Auto-plays concentration music when Focus starts
- Manual play/pause/skip controls available
- Smart recommendations from concentration music categories
- Music stops when Break starts
- Music resumes on next Focus session
- Uses SoundCloud API credentials from environment variables

## Architecture

### Three Main Components

**1. Audio Service (`useChime` hook)**
- Custom React hook encapsulating Web Audio API logic
- Generates two synthesized bell tones:
  - Lower frequency (432 Hz) for timer starts
  - Higher frequency (864 Hz) for timer ends
- Creates oscillators on demand
- Plays tone with fade-out envelope (~600ms duration)
- Cleans up resources after playback

**2. SoundCloud Player Component**
- Collapsible component wrapping SoundCloud Widget API
- Loads widget iframe
- Provides manual controls (play/pause/skip/volume)
- Exposes methods for auto-playing recommended tracks
- Fetches "focus" or "study" tracks using SoundCloud API

**3. Enhanced Pomodoro Logic**
- Extends existing `pomodoro.tsx` to integrate both features
- Triggers start chime when timer begins
- Auto-plays SoundCloud music for Focus sessions
- Triggers end chime when timer completes
- Pauses music when transitioning to Break

## Component Structure

### New Files

**`src/hooks/use-chime.ts`** - Audio hook for bell chimes
- `playChime(type: 'start' | 'end')` method
- Shared AudioContext instance
- Tone generation:
  - Start: 432 Hz sine wave
  - End: 864 Hz sine wave
- Duration: ~600ms with fade-out envelope

**`src/components/dashboard/soundcloud-player.tsx`** - Music player widget
- Props:
  - `isPlaying: boolean`
  - `onPlayPause: () => void`
  - `collapsed: boolean`
  - `onToggleCollapse: () => void`
- Embeds SoundCloud Widget iframe
- Widget controls: play, pause, skip, volume
- Displays currently playing track info

**`src/lib/soundcloud-service.ts`** - SoundCloud API integration
- `fetchConcentrationTracks()` - Gets recommended tracks
- Uses SoundCloud credentials from environment variables
- Returns track URIs for widget to load

### Modified Files

**`src/components/dashboard/pomodoro.tsx`**
- Import `useChime` hook
- Add state:
  - `musicPlayerCollapsed: boolean`
  - `currentTrack: string | null`
  - `isMusicPlaying: boolean`
- Call `playChime('start')` in `toggle()` when starting timer
- Call `playChime('end')` in timer completion logic (around line 26-34)
- Auto-play/pause music based on session type
- Render SoundCloud player component

**`.env.local`**
- Add `NEXT_PUBLIC_SOUNDCLOUD_CLIENT_ID`

## Data Flow

```
Timer State Change → playChime() + Music Control
       ↓                    ↓              ↓
   [Start/End]      [Web Audio API]  [Widget API]
       ↓                    ↓              ↓
   User hears chime + sees music player update
```

## Implementation Details

### Web Audio API Chime

```typescript
// Oscillator configuration:
// - Type: sine wave (pleasant bell-like tone)
// - Frequency: 432 Hz (start) or 864 Hz (end)
// - Gain envelope:
//   - Attack: 0-50ms (fade in)
//   - Sustain: 400ms (hold)
//   - Release: 150ms (fade out)
// - Total duration: ~600ms
```

### SoundCloud Widget Integration

```typescript
// Widget API integration:
// 1. Load widget script dynamically
// 2. Initialize iframe with playlist/track URI
// 3. Use Widget API methods:
//    - play(), pause(), next()
//    - getVolume(), setVolume()
// 4. Listen to events: PLAY, PAUSE, FINISH
// 5. Sync events with React state
```

### Track Selection Strategy

**Smart Recommendations:**
- Use SoundCloud API `/tracks` endpoint
- Search query: "focus study concentration lofi"
- Filter by genre tags:
  - "ambient"
  - "classical"
  - "lofi"
  - "instrumental"
- Create rotating pool of ~10-20 tracks
- Store selection in component state
- Future: Add localStorage for persistence

### State Management

All state managed in Pomodoro component (no new context needed):

```typescript
const [musicPlayerCollapsed, setMusicPlayerCollapsed] = useState(false);
const [currentTrack, setCurrentTrack] = useState<string | null>(null);
const [isMusicPlaying, setIsMusicPlaying] = useState(false);
```

### Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| AudioContext not supported | Silent fallback (no chimes, timer works) |
| SoundCloud API errors | Show "Music unavailable" message, timer continues |
| Network issues | Graceful degradation, core Pomodoro unaffected |
| Widget load failure | Display error state, allow retry |

## Edge Cases & User Experience

### Edge Cases

1. **Browser Autoplay Policies**
   - Modern browsers block autoplay
   - Solution: Play chime/music only after user interaction (Start button click counts)

2. **Multiple Tabs**
   - Each tab has independent timer/music
   - Document this behavior (future: add tab sync)

3. **User Pauses Timer**
   - Music continues playing (manual override respected)
   - Only auto-pause when session naturally ends

4. **SoundCloud Rate Limiting**
   - Cache track list in component state
   - Refresh only on component remount or extended time

5. **Audio Context Suspended**
   - Browsers may suspend AudioContext when tab inactive
   - Resume context before playing chime

### UX Considerations

- **Collapsible Player**:
  - Starts expanded on first Focus session
  - Remember user preference in localStorage

- **Visual Feedback**:
  - Loading state while fetching SoundCloud tracks
  - Clear play/pause button states

- **Volume Control**:
  - SoundCloud widget has built-in volume slider
  - Future: Add chime volume control

- **Accessibility**:
  - ARIA labels for music controls
  - Keyboard navigation support
  - Screen reader announcements for state changes

### Performance

- **SoundCloud widget**: Lazy-loaded (only on first Focus session)
- **AudioContext**: Created once, reused for all chimes
- **Break sessions**: No audio processing (minimal resource usage)
- **API calls**: Throttled and cached

## Future Enhancements

Out of scope for initial implementation:

- User-selectable playlists
- Custom chime sounds upload
- Volume control for chimes
- Statistics: tracks played during focus sessions
- Cross-tab synchronization
- Offline mode with cached tracks
- Integration with other music services (Spotify, Apple Music)

## Success Criteria

- ✅ Chimes play at correct times (start/end)
- ✅ Music auto-plays on Focus start
- ✅ Music auto-pauses on Break start
- ✅ Manual controls work (play/pause/skip)
- ✅ Widget is collapsible/expandable
- ✅ Core Pomodoro works even if audio features fail
- ✅ No console errors in normal operation
- ✅ Works on Chrome, Firefox, Safari (latest versions)

## Technical Constraints

- **Browser Support**: Modern browsers with Web Audio API support (Chrome 35+, Firefox 25+, Safari 14+)
- **SoundCloud API**: Requires valid client credentials
- **Network Dependency**: Music features require internet connection
- **User Interaction**: First audio requires user gesture due to browser policies
