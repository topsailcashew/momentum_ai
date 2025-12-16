'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Volume2, VolumeX, Settings, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  isTimerActive: boolean;
  currentEnergy?: string | null;
  compact?: boolean;
}

interface MusicGenre {
  id: string;
  name: string;
  playlistId: string;
  description: string;
  energyLevel?: string;
}

const MUSIC_GENRES: MusicGenre[] = [
  {
    id: 'jazz',
    name: 'Jazz',
    playlistId: 'PLRk72bN9cpOY5FRwXYpkDYe2PfalxLY10',
    description: 'Smooth jazz for focus',
    energyLevel: 'Low',
  },
  {
    id: 'lofi',
    name: 'Lo-Fi',
    playlistId: 'PLOzDu-MXXLljymo0oXEkTSLKf5TqxY-JN',
    description: 'Chill lo-fi hip hop beats',
    energyLevel: 'Medium',
  },
  {
    id: 'synthwave',
    name: 'Synth Wave',
    playlistId: 'PLOtNYlNIGer0jmWpFtTWqMkfP56iuZg1w',
    description: 'Retro synth wave vibes',
    energyLevel: 'High',
  },
  {
    id: 'chilltrap',
    name: 'Chill Trap',
    playlistId: 'PLDb-Ft6VaSqKkDDqOAakiUp9W6PHjs594',
    description: 'Relaxing trap music',
    energyLevel: 'Medium',
  },
];

export function YouTubePlayer({ isTimerActive, currentEnergy, compact = false }: YouTubePlayerProps) {
  const [player, setPlayer] = React.useState<any>(null);
  const [isAPIReady, setIsAPIReady] = React.useState(false);
  const [isPlayerReady, setIsPlayerReady] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [selectedGenre, setSelectedGenre] = React.useState<string>('');
  const [showSettings, setShowSettings] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(100);
  const [trackTitle, setTrackTitle] = React.useState('No track loaded');

  // Load YouTube IFrame API
  React.useEffect(() => {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      setIsAPIReady(true);
      return;
    }

    // Load the API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // API ready callback
    window.onYouTubeIframeAPIReady = () => {
      setIsAPIReady(true);
    };
  }, []);

  // Load saved genre from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('musicGenre');
    if (saved) {
      setSelectedGenre(saved);
    }
  }, []);

  // Get current genre data
  const currentGenre = MUSIC_GENRES.find((g) => g.id === selectedGenre);
  const playlistId = currentGenre?.playlistId || '';

  // Initialize player when API is ready
  React.useEffect(() => {
    if (isAPIReady && playlistId && !player) {
      setIsPlayerReady(false);
      const newPlayer = new window.YT.Player('youtube-player', {
        height: '1',
        width: '1',
        playerVars: {
          listType: 'playlist',
          list: playlistId,
          autoplay: 0,
          loop: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            setIsPlayerReady(true);
            setVolume(event.target.getVolume());
            updateTrackInfo(event.target);
          },
          onStateChange: (event: any) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
            if (event.data === window.YT.PlayerState.PLAYING || event.data === window.YT.PlayerState.CUED) {
              updateTrackInfo(event.target);
            }
          },
        },
      });
      setPlayer(newPlayer);
    }
  }, [isAPIReady, playlistId, player]);

  // Control playback based on timer state
  React.useEffect(() => {
    if (player && player.playVideo && player.pauseVideo) {
      if (isTimerActive && selectedGenre) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    }
  }, [isTimerActive, player, selectedGenre]);

  const handleSelectGenre = (genreId: string) => {
    setSelectedGenre(genreId);
    localStorage.setItem('musicGenre', genreId);
    setShowSettings(false);
    // Reload player with new playlist
    if (player) {
      setIsPlayerReady(false);
      try {
        player.destroy();
      } catch (error) {
        console.error('Error destroying player:', error);
      }
      setPlayer(null);
    }
  };

  const updateTrackInfo = (playerInstance: any) => {
    try {
      const videoData = playerInstance.getVideoData();
      if (videoData && videoData.title) {
        setTrackTitle(videoData.title);
      }
      const videoDuration = playerInstance.getDuration();
      if (videoDuration) {
        setDuration(videoDuration);
      }
    } catch (error) {
      console.error('Error updating track info:', error);
    }
  };

  // Update current time periodically
  React.useEffect(() => {
    if (!player || !isPlayerReady) return;

    const interval = setInterval(() => {
      try {
        if (typeof player.getCurrentTime === 'function') {
          const time = player.getCurrentTime();
          setCurrentTime(time);
        }
        if (typeof player.getDuration === 'function') {
          const dur = player.getDuration();
          if (dur && dur !== duration) {
            setDuration(dur);
          }
        }
      } catch (error) {
        // Player might not be ready yet
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [player, isPlayerReady, duration]);

  const togglePlayPause = () => {
    if (!player || typeof player.playVideo !== 'function' || typeof player.pauseVideo !== 'function') return;
    try {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const handlePrevious = () => {
    if (!player || typeof player.previousVideo !== 'function') return;
    try {
      player.previousVideo();
    } catch (error) {
      console.error('Error going to previous track:', error);
    }
  };

  const handleNext = () => {
    if (!player || typeof player.nextVideo !== 'function') return;
    try {
      player.nextVideo();
    } catch (error) {
      console.error('Error going to next track:', error);
    }
  };

  const handleSeek = (value: number[]) => {
    if (!player || typeof player.seekTo !== 'function') return;
    try {
      player.seekTo(value[0], true);
      setCurrentTime(value[0]);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (!player || typeof player.setVolume !== 'function') return;
    try {
      player.setVolume(value[0]);
      setVolume(value[0]);
      if (value[0] === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    } catch (error) {
      console.error('Error changing volume:', error);
    }
  };

  const toggleMute = () => {
    if (!player || typeof player.mute !== 'function' || typeof player.unMute !== 'function') return;
    try {
      if (isMuted) {
        player.unMute();
        setIsMuted(false);
      } else {
        player.mute();
        setIsMuted(true);
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Music className="h-5 w-5" />
              Concentration Music
            </CardTitle>
            <CardDescription className="text-xs">
              {currentGenre ? `${currentGenre.name} • Auto-plays when timer starts` : 'Select a music genre'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select Music Genre</DialogTitle>
                  <DialogDescription>
                    Choose a music genre to play when your Pomodoro timer is running.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  {MUSIC_GENRES.map((genre) => (
                    <Button
                      key={genre.id}
                      variant={selectedGenre === genre.id ? 'default' : 'outline'}
                      onClick={() => handleSelectGenre(genre.id)}
                      className="h-auto flex-col items-start p-4 text-left"
                    >
                      <span className="font-semibold">{genre.name}</span>
                      <span className="text-xs text-muted-foreground mt-1 font-normal">
                        {genre.description}
                      </span>
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Hidden YouTube player for audio */}
        <div id="youtube-player" className="hidden" />

        {selectedGenre ? (
          <div className="flex flex-col gap-4 justify-center flex-1">
            {/* Track title */}
            <div className="text-center">
              <p className="font-medium text-sm truncate" title={trackTitle}>
                {trackTitle}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="w-full"
              />
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                disabled={!isPlayerReady}
                className="h-9 w-9"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="default"
                size="icon"
                onClick={togglePlayPause}
                disabled={!isPlayerReady}
                className="h-11 w-11"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                disabled={!isPlayerReady}
                className="h-9 w-9"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Volume control */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-8 w-8 flex-shrink-0"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8 text-right">
                {Math.round(isMuted ? 0 : volume)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Music className="h-12 w-12 mb-3 opacity-20" />
            <p className="font-medium">No genre selected</p>
            <p className="text-sm mt-1">Click the settings icon to choose a music genre</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
