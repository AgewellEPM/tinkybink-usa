export interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  enabled: boolean;
}

export interface Translation {
  key: string;
  translations: Record<string, string>;
}

export class LanguageService {
  private currentLanguage = 'en';
  private supportedLanguages: Language[] = [];
  private translations: Map<string, Translation> = new Map();
  private voiceMap: Map<string, string> = new Map();

  initialize() {
    console.log('Language Service ready');
    this.setupLanguages();
    this.loadTranslations();
    this.detectUserLanguage();
  }

  private setupLanguages() {
    this.supportedLanguages = [
      { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', enabled: true },
      { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', enabled: true },
      { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', enabled: true },
      { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', enabled: true },
      { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr', enabled: true },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr', enabled: true },
      { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr', enabled: true },
      { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', enabled: true },
      { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr', enabled: true },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', enabled: true },
      { code: 'he', name: 'Hebrew', nativeName: 'עברית', direction: 'rtl', enabled: true },
      { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr', enabled: true },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', enabled: true },
      { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', direction: 'ltr', enabled: true },
      { code: 'th', name: 'Thai', nativeName: 'ไทย', direction: 'ltr', enabled: true }
    ];

    // Map languages to preferred voice names
    this.voiceMap.set('es', 'Microsoft Maria - Spanish');
    this.voiceMap.set('fr', 'Microsoft Julie - French');
    this.voiceMap.set('de', 'Microsoft Katja - German');
    this.voiceMap.set('it', 'Microsoft Elsa - Italian');
    this.voiceMap.set('pt', 'Microsoft Maria - Portuguese');
    this.voiceMap.set('zh', 'Microsoft Hanhan - Chinese');
    this.voiceMap.set('ja', 'Microsoft Haruka - Japanese');
    this.voiceMap.set('ko', 'Microsoft Heami - Korean');
    this.voiceMap.set('ar', 'Microsoft Hoda - Arabic');
    this.voiceMap.set('he', 'Microsoft Asaf - Hebrew');
    this.voiceMap.set('ru', 'Microsoft Pavel - Russian');
    this.voiceMap.set('hi', 'Microsoft Hemant - Hindi');
  }

  private loadTranslations() {
    // Common UI translations
    this.addTranslation('want', {
      en: 'I want',
      es: 'Yo quiero',
      fr: 'Je veux',
      de: 'Ich möchte',
      it: 'Io voglio',
      pt: 'Eu quero',
      zh: '我想要',
      ja: '欲しい',
      ko: '원해요',
      ar: 'أريد',
      he: 'אני רוצה',
      ru: 'Я хочу',
      hi: 'मैं चाहता हूं'
    });

    this.addTranslation('need', {
      en: 'I need',
      es: 'Necesito',
      fr: 'J\'ai besoin',
      de: 'Ich brauche',
      it: 'Ho bisogno',
      pt: 'Eu preciso',
      zh: '我需要',
      ja: '必要',
      ko: '필요해요',
      ar: 'أحتاج',
      he: 'אני צריך',
      ru: 'Мне нужно',
      hi: 'मुझे चाहिए'
    });

    this.addTranslation('help', {
      en: 'Help',
      es: 'Ayuda',
      fr: 'Aide',
      de: 'Hilfe',
      it: 'Aiuto',
      pt: 'Ajuda',
      zh: '帮助',
      ja: '助けて',
      ko: '도움',
      ar: 'مساعدة',
      he: 'עזרה',
      ru: 'Помощь',
      hi: 'मदद'
    });

    this.addTranslation('yes', {
      en: 'Yes',
      es: 'Sí',
      fr: 'Oui',
      de: 'Ja',
      it: 'Sì',
      pt: 'Sim',
      zh: '是',
      ja: 'はい',
      ko: '네',
      ar: 'نعم',
      he: 'כן',
      ru: 'Да',
      hi: 'हाँ'
    });

    this.addTranslation('no', {
      en: 'No',
      es: 'No',
      fr: 'Non',
      de: 'Nein',
      it: 'No',
      pt: 'Não',
      zh: '不',
      ja: 'いいえ',
      ko: '아니요',
      ar: 'لا',
      he: 'לא',
      ru: 'Нет',
      hi: 'नहीं'
    });

    this.addTranslation('thank_you', {
      en: 'Thank you',
      es: 'Gracias',
      fr: 'Merci',
      de: 'Danke',
      it: 'Grazie',
      pt: 'Obrigado',
      zh: '谢谢',
      ja: 'ありがとう',
      ko: '감사합니다',
      ar: 'شكرا',
      he: 'תודה',
      ru: 'Спасибо',
      hi: 'धन्यवाद'
    });

    this.addTranslation('bathroom', {
      en: 'Bathroom',
      es: 'Baño',
      fr: 'Toilettes',
      de: 'Badezimmer',
      it: 'Bagno',
      pt: 'Banheiro',
      zh: '洗手间',
      ja: 'トイレ',
      ko: '화장실',
      ar: 'حمام',
      he: 'שירותים',
      ru: 'Туалет',
      hi: 'बाथरूम'
    });

    // Load saved custom translations
    this.loadCustomTranslations();
  }

  private detectUserLanguage() {
    // Try to detect from browser
    const browserLang = navigator.language.split('-')[0];
    if (this.isLanguageSupported(browserLang)) {
      this.currentLanguage = browserLang;
    }

    // Check saved preference
    const savedLang = localStorage.getItem('preferred_language');
    if (savedLang && this.isLanguageSupported(savedLang)) {
      this.currentLanguage = savedLang;
    }
  }

  setLanguage(languageCode: string): boolean {
    if (!this.isLanguageSupported(languageCode)) {
      return false;
    }

    this.currentLanguage = languageCode;
    localStorage.setItem('preferred_language', languageCode);
    
    // Update document direction
    const lang = this.getLanguage(languageCode);
    if (lang) {
      document.documentElement.dir = lang.direction;
      document.documentElement.lang = languageCode;
    }

    // Dispatch language change event
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: languageCode } 
    }));

    return true;
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  getLanguage(code: string): Language | undefined {
    return this.supportedLanguages.find(lang => lang.code === code);
  }

  getSupportedLanguages(): Language[] {
    return this.supportedLanguages.filter(lang => lang.enabled);
  }

  isLanguageSupported(code: string): boolean {
    return this.supportedLanguages.some(lang => lang.code === code && lang.enabled);
  }

  translate(key: string, language?: string): string {
    const lang = language || this.currentLanguage;
    const translation = this.translations.get(key);
    
    if (translation && translation.translations[lang]) {
      return translation.translations[lang];
    }

    // Fallback to English
    if (translation && translation.translations['en']) {
      return translation.translations['en'];
    }

    // Return key if no translation found
    return key;
  }

  translateTile(tile: { text: string; speech?: string }, language?: string): { 
    text: string; 
    speech: string;
  } {
    const lang = language || this.currentLanguage;
    
    return {
      text: this.translate(tile.text.toLowerCase().replace(/\s+/g, '_'), lang) || tile.text,
      speech: this.translate((tile.speech || tile.text).toLowerCase().replace(/\s+/g, '_'), lang) || tile.speech || tile.text
    };
  }

  addTranslation(key: string, translations: Record<string, string>) {
    this.translations.set(key, { key, translations });
    this.saveCustomTranslations();
  }

  updateTranslation(key: string, language: string, translation: string) {
    const existing = this.translations.get(key);
    if (existing) {
      existing.translations[language] = translation;
      this.saveCustomTranslations();
    } else {
      this.addTranslation(key, { [language]: translation });
    }
  }

  private saveCustomTranslations() {
    const customTranslations = Array.from(this.translations.entries()).map(([key, value]) => ({
      key,
      translations: value.translations
    }));
    
    localStorage.setItem('custom_translations', JSON.stringify(customTranslations));
  }

  private loadCustomTranslations() {
    const saved = localStorage.getItem('custom_translations');
    if (saved) {
      try {
        const customTranslations = JSON.parse(saved);
        customTranslations.forEach((trans: any) => {
          this.translations.set(trans.key, trans);
        });
      } catch (error) {
        console.error('Failed to load custom translations:', error);
      }
    }
  }

  getVoiceForLanguage(languageCode: string): string | undefined {
    return this.voiceMap.get(languageCode);
  }

  async translateText(text: string, targetLanguage?: string): Promise<string> {
    // In a real implementation, this would call a translation API
    // For now, return translated text if we have it in our dictionary
    const target = targetLanguage || this.currentLanguage;
    const key = text.toLowerCase().replace(/\s+/g, '_');
    
    return this.translate(key, target) || text;
  }

  exportTranslations(): string {
    const data = {
      translations: Array.from(this.translations.entries()).map(([key, value]) => ({
        key,
        translations: value.translations
      })),
      currentLanguage: this.currentLanguage,
      exportDate: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  }

  importTranslations(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.translations && Array.isArray(data.translations)) {
        data.translations.forEach((trans: any) => {
          this.addTranslation(trans.key, trans.translations);
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to import translations:', error);
      return false;
    }
  }
}

// Singleton instance
let languageServiceInstance: LanguageService | null = null;

export function getLanguageService(): LanguageService {
  if (!languageServiceInstance) {
    languageServiceInstance = new LanguageService();
    languageServiceInstance.initialize();
  }
  return languageServiceInstance;
}