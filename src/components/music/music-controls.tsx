'use client';

import * as React from 'react';
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

export function MusicControls() {
  const [player, setPlayer] = React.useState<any>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(100);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [selectedGenre, setSelectedGenre] = React.useState<string>('');
  const [showSettings, setShowSettings] = React.useState(false);

  // Get player from global window object
  React.useEffect(() => {
    const checkPlayer = setInterval(() => {
      if (window.globalYouTubePlayer) {
        setPlayer(window.globalYouTubePlayer);
        clearInterval(checkPlayer);
      }
    }, 100);

    return () => clearInterval(checkPlayer);
  }, []);

  // Load saved genre
  React.useEffect(() => {
    const saved = localStorage.getItem('musicGenre');
    if (saved) {
      setSelectedGenre(saved);
    }
  }, []);

  // Update player state periodically
  React.useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      try {
        if (typeof player.getPlayerState === 'function') {
          const state = player.getPlayerState();
          setIsPlaying(state === 1); // YT.PlayerState.PLAYING
        }
        if (typeof player.getCurrentTime === 'function') {
          setCurrentTime(player.getCurrentTime());
        }
        if (typeof player.getDuration === 'function') {
          setDuration(player.getDuration());
        }
        if (typeof player.getVolume === 'function') {
          setVolume(player.getVolume());
        }
        if (typeof player.isMuted === 'function') {
          setIsMuted(player.isMuted());
        }
      } catch (error) {
        // Player not ready yet
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [player]);

  const handleSelectGenre = (genreId: string) => {
    setSelectedGenre(genreId);
    localStorage.setItem('musicGenre', genreId);
    setShowSettings(false);

    // Trigger reload by destroying global player
    if (window.globalYouTubePlayer) {
      try {
        window.globalYouTubePlayer.destroy();
      } catch (error) {
        console.error('Error destroying player:', error);
      }
      window.globalYouTubePlayer = undefined;
    }
    // The GlobalMusicPlayer component will recreate it
  };

  const togglePlayPause = () => {
    if (!player) return;
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
    if (!player) return;
    try {
      player.previousVideo();
    } catch (error) {
      console.error('Error going to previous track:', error);
    }
  };

  const handleNext = () => {
    if (!player) return;
    try {
      player.nextVideo();
    } catch (error) {
      console.error('Error going to next track:', error);
    }
  };

  const handleSeek = (value: number[]) => {
    if (!player) return;
    try {
      player.seekTo(value[0], true);
      setCurrentTime(value[0]);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (!player) return;
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
    if (!player) return;
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

  const currentGenre = MUSIC_GENRES.find((g) => g.id === selectedGenre);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          {currentGenre?.name || 'No music selected'}
        </p>
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Settings className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Music Genre</DialogTitle>
              <DialogDescription>
                Music is automatically selected based on your energy level.
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

      {selectedGenre ? (
        <>
          {/* Compact playback controls */}
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              disabled={!player}
              className="h-7 w-7"
            >
              <SkipBack className="h-3 w-3" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={togglePlayPause}
              disabled={!player}
              className="h-8 w-8"
            >
              {isPlaying ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={!player}
              className="h-7 w-7"
            >
              <SkipForward className="h-3 w-3" />
            </Button>
          </div>

          {/* Compact progress */}
          <div className="space-y-1">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <p className="text-[10px] text-muted-foreground text-center">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>

          {/* Compact volume control */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-6 w-6 flex-shrink-0"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-3 w-3" />
              ) : (
                <Volume2 className="h-3 w-3" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="flex-1"
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 text-center text-muted-foreground">
          <Music className="h-6 w-6 mb-1 opacity-20" />
          <p className="text-xs">No music selected</p>
        </div>
      )}
    </div>
  );
}
