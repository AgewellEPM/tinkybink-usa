'use client';

import { useEffect, useState } from 'react';
import { whiteLabelService, WhiteLabelConfig } from '@/services/white-label-service';

interface WhiteLabelPreviewProps {
  subdomain?: string;
  config?: Partial<WhiteLabelConfig>;
}

export function WhiteLabelPreview({ subdomain, config }: WhiteLabelPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [previewConfig, setPreviewConfig] = useState<WhiteLabelConfig | null>(null);

  useEffect(() => {
    loadPreview();
  }, [subdomain, config]);

  const loadPreview = async () => {
    try {
      if (config) {
        // Direct config preview
        const fullConfig = await whiteLabelService.createWhiteLabelConfig(config);
        const loadedConfig = await whiteLabelService.getConfigForOrganization(fullConfig);
        setPreviewConfig(loadedConfig);
      } else if (subdomain) {
        // Load by subdomain
        // In production, this would load from API
        console.log('Loading preview for subdomain:', subdomain);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white mx-auto"></div>
          <p className="text-white mt-4">Loading white label preview...</p>
        </div>
      </div>
    );
  }

  if (!previewConfig) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900 to-pink-900 text-white p-4 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold">White Label Preview:</span>
          <span className="text-lg">{previewConfig.organizationName}</span>
          <span className="text-sm opacity-70">({previewConfig.subdomain}.tinkybink.com)</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Primary:</span>
            <div 
              className="w-6 h-6 rounded border-2 border-white/50"
              style={{ backgroundColor: previewConfig.branding.colors.primary }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Secondary:</span>
            <div 
              className="w-6 h-6 rounded border-2 border-white/50"
              style={{ backgroundColor: previewConfig.branding.colors.secondary }}
            />
          </div>
          <button
            onClick={() => window.location.href = window.location.href.split('?')[0]}
            className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
          >
            Exit Preview
          </button>
        </div>
      </div>
    </div>
  );
}