import { useEffect, useState } from 'react';
import { whiteLabelService, WhiteLabelConfig } from '@/services/white-label-service';

export function useWhiteLabel() {
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const currentConfig = whiteLabelService.getCurrentConfiguration();
        setConfig(currentConfig);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();

    // Listen for configuration changes
    const handleConfigChange = (event: CustomEvent) => {
      setConfig(event.detail);
    };

    window.addEventListener('tinkybink:config:changed' as any, handleConfigChange);

    return () => {
      window.removeEventListener('tinkybink:config:changed' as any, handleConfigChange);
    };
  }, []);

  const isFeatureEnabled = (feature: string): boolean => {
    return whiteLabelService.isFeatureEnabled(feature);
  };

  const getBranding = () => {
    return config?.branding || {
      logo: {
        light: '/logo-light.png',
        dark: '/logo-dark.png',
        favicon: '/favicon.ico'
      },
      colors: {
        primary: '#FF6B6B',
        secondary: '#845EC2',
        accent: '#4ECDC4',
        background: '#1a1a2e',
        text: '#FFFFFF',
        success: '#4ECDC4',
        warning: '#FFE66D',
        error: '#FF6B6B',
        info: '#4E8BFF'
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
        mono: 'JetBrains Mono'
      },
      theme: {
        borderRadius: '12px',
        shadowStyle: 'medium' as const,
        animationSpeed: 'normal' as const
      }
    };
  };

  const getOrganizationName = () => {
    return config?.organizationName || 'TinkyBink';
  };

  const getCustomContent = () => {
    return config?.content || {
      defaultLanguage: 'en',
      supportedLanguages: ['en'],
      customCategories: [],
      preloadedPhrases: [],
      customSymbolSets: []
    };
  };

  const isWhiteLabeled = () => {
    return config !== null;
  };

  return {
    config,
    isLoading,
    isFeatureEnabled,
    getBranding,
    getOrganizationName,
    getCustomContent,
    isWhiteLabeled
  };
}