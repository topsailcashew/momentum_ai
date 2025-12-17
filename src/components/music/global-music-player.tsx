'use client';

import * as React from 'react';
import { useEnergyTracker } from '@/hooks/use-energy-tracker';
import { PomodoroContext } from '@/components/dashboard/pomodoro-provider';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    globalYouTubePlayer?: any;
  }
}

interface MusicGenre {
  id: string;
  name: string;
  playlistId: string;
  energyLevel?: string;
}

const MUSIC_GENRES: MusicGenre[] = [
  {
    id: 'jazz',
    name: 'Jazz',
    playlistId: 'PLRk72bN9cpOY5FRwXYpkDYe2PfalxLY10',
    energyLevel: 'Low',
  },
  {
    id: 'lofi',
    name: 'Lo-Fi',
    playlistId: 'PLOzDu-MXXLljymo0oXEkTSLKf5TqxY-JN',
    energyLevel: 'Medium',
  },
  {
    id: 'synthwave',
    name: 'Synth Wave',
    playlistId: 'PLOtNYlNIGer0jmWpFtTWqMkfP56iuZg1w',
    energyLevel: 'High',
  },
  {
    id: 'chilltrap',
    name: 'Chill Trap',
    playlistId: 'PLDb-Ft6VaSqKkDDqOAakiUp9W6PHjs594',
    energyLevel: 'Medium',
  },
];

export function GlobalMusicPlayer() {
  const [player, setPlayer] = React.useState<any>(null);
  const [isAPIReady, setIsAPIReady] = React.useState(false);
  const [selectedGenre, setSelectedGenre] = React.useState<string>('');
  const { isTimerActive } = React.useContext(PomodoroContext);
  const { currentEnergy } = useEnergyTracker();

  // Load YouTube IFrame API
  React.useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsAPIReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

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

  // Automatic music selection based on energy level
  React.useEffect(() => {
    if (!currentEnergy) return;

    const matchingGenre = MUSIC_GENRES.find(genre => genre.energyLevel === currentEnergy);

    if (matchingGenre && matchingGenre.id !== selectedGenre) {
      setSelectedGenre(matchingGenre.id);
      localStorage.setItem('musicGenre', matchingGenre.id);

      if (player) {
        try {
          player.destroy();
        } catch (error) {
          console.error('Error destroying player:', error);
        }
        setPlayer(null);
      }
    }
  }, [currentEnergy, selectedGenre, player]);

  // Initialize player
  React.useEffect(() => {
    const currentGenre = MUSIC_GENRES.find((g) => g.id === selectedGenre);
    const playlistId = currentGenre?.playlistId || '';

    if (isAPIReady && playlistId && !player) {
      const newPlayer = new window.YT.Player('global-youtube-player', {
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
      });
      setPlayer(newPlayer);
      window.globalYouTubePlayer = newPlayer;
    }
  }, [isAPIReady, selectedGenre, player]);

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

  return <div id="global-youtube-player" className="hidden" />;
}
