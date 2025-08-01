import { useEffect, useState } from 'react';
import { getSpeechService } from '@/modules/module-system';
import { useAppStore } from '@/store/app-store';

export function useSpeech() {
  const [speechService, setSpeechService] = useState<ReturnType<typeof getSpeechService> | null>(null);
  const { speechRate, speechPitch, speechVolume } = useAppStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const service = getSpeechService();
      setSpeechService(service);
    }
  }, []);

  useEffect(() => {
    if (speechService) {
      speechService.updateSettings({
        rate: speechRate,
        pitch: speechPitch,
        volume: speechVolume
      });
    }
  }, [speechService, speechRate, speechPitch, speechVolume]);

  const speak = (text: string) => {
    if (speechService) {
      speechService.speak(text);
    }
  };

  const stop = () => {
    if (speechService) {
      speechService.stop();
    }
  };

  return { speak, stop };
}