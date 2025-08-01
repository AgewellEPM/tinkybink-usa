class SpeechService {
      constructor() {
        this.synth = window.speechSynthesis;
        this.utterance = null;
      }
      
      initialize() {
        // Load voices
        const loadVoices = () => {
          voices = this.synth.getVoices();
          this.populateVoiceList();
        };
        
        loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
          speechSynthesis.onvoiceschanged = loadVoices;
        }
      }
      
      populateVoiceList() {
        const voiceSelect = document.getElementById('voiceSelect');
        if (!voiceSelect || voices.length === 0) return;
        
        voiceSelect.innerHTML = '';
        voices.forEach((voice, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.textContent = `${voice.name} (${voice.lang})`;
          if (voice.default) option.selected = true;
          voiceSelect.appendChild(option);
        });
      }
      
      speak(text) {
        if (this.synth.speaking) {
          this.synth.cancel();
        }
        
        this.utterance = new SpeechSynthesisUtterance(text);
        this.utterance.rate = settings.speechRate;
        this.utterance.pitch = settings.speechPitch;
        this.utterance.volume = settings.speechVolume;
        
        if (settings.selectedVoice !== null && voices[settings.selectedVoice]) {
          this.utterance.voice = voices[settings.selectedVoice];
        }
        
        this.synth.speak(this.utterance);
        
        // Track speech analytics
        const analytics = moduleSystem.get('AnalyticsService');
        if (analytics) {
          analytics.trackSpeech(text);
        }
      }
    }