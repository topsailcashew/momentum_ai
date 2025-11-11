
'use client';

import * as React from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, Wind, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type WeatherCondition = 'Sunny' | 'Cloudy' | 'Rainy' | 'Snowy' | 'Windy';

interface WeatherData {
  condition: WeatherCondition;
  temperature: number; // in Fahrenheit
}

// Mock function to simulate a weather API call
const getMockWeather = (lat: number, lon: number): Promise<WeatherData> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const conditions: WeatherCondition[] = ['Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Windy'];
      const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
      const randomTemp = Math.floor(Math.random() * (95 - 30 + 1)) + 30; // Temp between 30°F and 95°F
      
      // A little logic to make it seem more real
      if (randomCondition === 'Snowy') {
        resolve({ condition: randomCondition, temperature: Math.min(randomTemp, 32) });
      } else if (randomCondition === 'Rainy') {
         resolve({ condition: randomCondition, temperature: Math.min(randomTemp, 60) });
      }
      else {
        resolve({ condition: randomCondition, temperature: randomTemp });
      }
    }, 1500); // Simulate network delay
  });
};

const weatherIcons = {
    Sunny: Sun,
    Cloudy: Cloud,
    Rainy: CloudRain,
    Snowy: CloudSnow,
    Windy: Wind
};


export function WeatherWidget() {
  const [weather, setWeather] = React.useState<WeatherData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const weatherData = await getMockWeather(latitude, longitude);
            setWeather(weatherData);
          } catch (apiError) {
            setError('Could not fetch weather data.');
          } finally {
            setIsLoading(false);
          }
        },
        (error) => {
          switch(error.code) {
            case error.PERMISSION_DENIED:
              setError("Location access denied.");
              break;
            case error.POSITION_UNAVAILABLE:
              setError("Location information is unavailable.");
              break;
            case error.TIMEOUT:
              setError("Location request timed out.");
              break;
            default:
              setError("An unknown error occurred.");
              break;
          }
          setIsLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setIsLoading(false);
    }
  }, []);

  const WeatherIcon = weather ? weatherIcons[weather.condition] : null;

  return (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted/50">
                    {isLoading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
                    {error && <Sun className="h-6 w-6 text-muted-foreground" />}
                    {!isLoading && !error && WeatherIcon && (
                        <WeatherIcon className="h-6 w-6 text-primary" />
                    )}
                </div>
            </TooltipTrigger>
            <TooltipContent>
                {isLoading && <p>Fetching weather...</p>}
                {error && <p>{error}</p>}
                {weather && <p>{weather.condition}, {weather.temperature}°F</p>}
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
}
