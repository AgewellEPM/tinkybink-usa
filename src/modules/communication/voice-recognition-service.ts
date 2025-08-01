export interface VoiceCommand {
  command: string;
  action: () => void;
  aliases?: string[];
}

export class VoiceRecognitionService {
  private recognition: any = null;
  private isListening = false;
  private commands: VoiceCommand[] = [];
  private onResultCallback: ((text: string) => void) | null = null;
  private continuous = false;
  private language = 'en-US';

  initialize() {
    console.log('Voice Recognition Service ready');
    
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.setupRecognition();
      this.setupDefaultCommands();
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = this.continuous;
    this.recognition.interimResults = true;
    this.recognition.lang = this.language;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.dispatchEvent('start');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.dispatchEvent('end');
      
      // Restart if continuous mode
      if (this.continuous && this.isListening) {
        setTimeout(() => this.start(), 100);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      this.dispatchEvent('error', { error: event.error });
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.handleFinalResult(finalTranscript);
      }

      this.dispatchEvent('result', { 
        final: finalTranscript, 
        interim: interimTranscript 
      });
    };
  }

  private setupDefaultCommands() {
    // Navigation commands
    this.addCommand({
      command: 'go home',
      action: () => window.dispatchEvent(new Event('goHome')),
      aliases: ['home', 'main menu']
    });

    this.addCommand({
      command: 'go back',
      action: () => window.dispatchEvent(new Event('goBack')),
      aliases: ['back', 'previous']
    });

    // Communication commands
    this.addCommand({
      command: 'clear sentence',
      action: () => window.dispatchEvent(new Event('clearSentence')),
      aliases: ['clear', 'delete all']
    });

    this.addCommand({
      command: 'speak sentence',
      action: () => window.dispatchEvent(new Event('speakSentence')),
      aliases: ['speak', 'say it']
    });

    // Emergency commands
    this.addCommand({
      command: 'help me',
      action: () => window.dispatchEvent(new CustomEvent('emergency', { detail: 'help' })),
      aliases: ['help', 'emergency', 'need help']
    });

    this.addCommand({
      command: 'stop',
      action: () => {
        window.speechSynthesis.cancel();
        this.stop();
      },
      aliases: ['stop speaking', 'quiet', 'silence']
    });

    // Mode commands
    this.addCommand({
      command: 'open eliza',
      action: () => window.dispatchEvent(new Event('openEliza')),
      aliases: ['eliza', 'chat', 'talk to eliza']
    });

    this.addCommand({
      command: 'edit mode',
      action: () => window.dispatchEvent(new Event('toggleEditMode')),
      aliases: ['edit', 'customize']
    });
  }

  start(): boolean {
    if (!this.recognition || this.isListening) {
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start recognition:', error);
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  toggle(): boolean {
    if (this.isListening) {
      this.stop();
      return false;
    } else {
      return this.start();
    }
  }

  setContinuous(continuous: boolean) {
    this.continuous = continuous;
    if (this.recognition) {
      this.recognition.continuous = continuous;
    }
  }

  setLanguage(language: string) {
    this.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
      
      // Restart if currently listening
      if (this.isListening) {
        this.stop();
        setTimeout(() => this.start(), 100);
      }
    }
  }

  addCommand(command: VoiceCommand) {
    this.commands.push(command);
  }

  removeCommand(commandText: string) {
    this.commands = this.commands.filter(cmd => cmd.command !== commandText);
  }

  onResult(callback: (text: string) => void) {
    this.onResultCallback = callback;
  }

  private handleFinalResult(text: string) {
    const lowerText = text.toLowerCase().trim();

    // Check for commands
    for (const command of this.commands) {
      if (this.matchesCommand(lowerText, command)) {
        command.action();
        return;
      }
    }

    // If no command matched, call the result callback
    if (this.onResultCallback) {
      this.onResultCallback(text);
    }
  }

  private matchesCommand(text: string, command: VoiceCommand): boolean {
    if (text.includes(command.command.toLowerCase())) {
      return true;
    }

    if (command.aliases) {
      return command.aliases.some(alias => text.includes(alias.toLowerCase()));
    }

    return false;
  }

  private dispatchEvent(type: string, detail?: any) {
    window.dispatchEvent(new CustomEvent(`voiceRecognition:${type}`, { detail }));
  }

  isAvailable(): boolean {
    return this.recognition !== null;
  }

  isActive(): boolean {
    return this.isListening;
  }

  getCommands(): VoiceCommand[] {
    return [...this.commands];
  }

  // Dictation mode - just transcribe without commands
  startDictation(callback: (text: string) => void) {
    const previousCallback = this.onResultCallback;
    const previousCommands = [...this.commands];
    
    // Temporarily disable commands
    this.commands = [];
    this.onResultCallback = callback;
    
    this.start();

    // Return cleanup function
    return () => {
      this.stop();
      this.commands = previousCommands;
      this.onResultCallback = previousCallback;
    };
  }

  // Voice feedback
  speak(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.language;
      window.speechSynthesis.speak(utterance);
    }
  }

  // Calibration helpers
  async calibrate(): Promise<boolean> {
    return new Promise((resolve) => {
      this.speak('Please say: Hello, testing voice recognition');
      
      const cleanup = this.startDictation((text) => {
        if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('testing')) {
          this.speak('Voice recognition is working correctly');
          cleanup();
          resolve(true);
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        cleanup();
        this.speak('Voice recognition calibration timed out');
        resolve(false);
      }, 10000);
    });
  }
}

// Singleton instance
let voiceRecognitionInstance: VoiceRecognitionService | null = null;

export function getVoiceRecognitionService(): VoiceRecognitionService {
  if (typeof window !== 'undefined' && !voiceRecognitionInstance) {
    voiceRecognitionInstance = new VoiceRecognitionService();
  }
  return voiceRecognitionInstance!;
}