export class SpeechService {
  private synth: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private settings = {
    rate: 1,
    pitch: 1,
    volume: 1,
    selectedVoice: null as number | null
  };

  constructor() {
    this.synth = window.speechSynthesis;
    this.initialize();
  }

  initialize() {
    const loadVoices = () => {
      this.voices = this.synth.getVoices();
      console.log(`Loaded ${this.voices.length} voices`);
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  speak(text: string) {
    if (this.synth.speaking) {
      this.synth.cancel();
    }

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.rate = this.settings.rate;
    this.utterance.pitch = this.settings.pitch;
    this.utterance.volume = this.settings.volume;

    if (this.settings.selectedVoice !== null && this.voices[this.settings.selectedVoice]) {
      this.utterance.voice = this.voices[this.settings.selectedVoice];
    }

    this.synth.speak(this.utterance);
  }

  stop() {
    this.synth.cancel();
  }

  pause() {
    this.synth.pause();
  }

  resume() {
    this.synth.resume();
  }

  getVoices() {
    return this.voices;
  }

  setVoice(index: number) {
    if (index >= 0 && index < this.voices.length) {
      this.settings.selectedVoice = index;
    }
  }

  updateSettings(settings: Partial<typeof this.settings>) {
    this.settings = { ...this.settings, ...settings };
  }

  getSettings() {
    return { ...this.settings };
  }
}

// Singleton instance
let speechServiceInstance: SpeechService | null = null;

export function getSpeechService(): SpeechService {
  if (!speechServiceInstance) {
    speechServiceInstance = new SpeechService();
  }
  return speechServiceInstance;
}