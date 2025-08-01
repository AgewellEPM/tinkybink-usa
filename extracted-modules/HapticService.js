class HapticService {
      initialize() { console.log('Haptic Service ready'); }
      
      vibrate(pattern = [50]) {
        if ('vibrate' in navigator) {
          navigator.vibrate(pattern);
        }
      }
    }