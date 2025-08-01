'use client';

import { useEffect, useState } from 'react';
import { getEmergencyTilesService, getSessionTrackingService } from '@/modules/module-system';
import { useSpeech } from '@/hooks/use-speech';

export function BottomNav() {
  const { speak } = useSpeech();
  const [emergencyService, setEmergencyService] = useState<ReturnType<typeof getEmergencyTilesService> | null>(null);
  const [sessionTracking, setSessionTracking] = useState<ReturnType<typeof getSessionTrackingService> | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEmergencyService(getEmergencyTilesService());
      setSessionTracking(getSessionTrackingService());
    }
  }, []);

  const handleEmergencyClick = (tileId: string, text: string, speech: string) => {
    // Trigger emergency service
    emergencyService?.triggerEmergency(tileId);
    
    // Track in session
    sessionTracking?.addCommunicationAct({
      type: 'request',
      content: speech,
      method: 'tile',
      success: true
    });
    
    // Speak with urgency
    speak(speech);
  };

  return (
    <div className="bottom-nav">
      <button 
        className="nav-btn yes" 
        onClick={() => handleEmergencyClick('emergency_yes', 'YES', 'Yes')}
        title="Yes"
      >
        ✅
      </button>
      <button 
        className="nav-btn no" 
        onClick={() => handleEmergencyClick('emergency_no', 'NO', 'No')}
        title="No"
      >
        ❌
      </button>
      <button 
        className="nav-btn help" 
        onClick={() => handleEmergencyClick('emergency_help', 'HELP', 'I need help now!')}
        title="Help"
      >
        🆘
      </button>
      <button 
        className="nav-btn bathroom" 
        onClick={() => handleEmergencyClick('emergency_bathroom', 'BATHROOM', 'I need the bathroom urgently!')}
        title="Bathroom"
      >
        🚽
      </button>
    </div>
  );
}