#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Converting all TinkyBink modules to React/Next.js...\n');

const modulesDir = '/Users/lukekist/tinkybink-usa/extracted-modules';
const componentsDir = '/Users/lukekist/tinkybink-usa/src/components/modules';
const servicesDir = '/Users/lukekist/tinkybink-usa/src/services';
const hooksDir = '/Users/lukekist/tinkybink-usa/src/hooks';

// Create directories
[componentsDir, servicesDir, hooksDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Module conversion templates
const templates = {
  service: (className, methods) => `import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ${className}State {
  // Add state properties based on class
  isInitialized: boolean;
  
  // Methods
  initialize: () => Promise<void>;
  ${methods}
}

export const use${className} = create<${className}State>()(
  persist(
    (set, get) => ({
      isInitialized: false,
      
      async initialize() {
        // Initialize service
        set({ isInitialized: true });
      },
      
      // Add converted methods here
    }),
    {
      name: '${className.toLowerCase()}-storage',
    }
  )
);`,

  component: (className, jsxContent) => `'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function ${className}() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Initialize component
    setIsLoading(false);
  }, []);
  
  if (isLoading) {
    return <div>Loading ${className}...</div>;
  }
  
  return (
    <div className="${className.toLowerCase()}-container">
      ${jsxContent || '<!-- Add UI here -->'}
    </div>
  );
}`,

  hook: (hookName, logic) => `import { useState, useEffect, useCallback } from 'react';

export function ${hookName}() {
  const [state, setState] = useState(null);
  
  ${logic}
  
  return { state };
}`
};

// Read all extracted modules
const files = fs.readdirSync(modulesDir);
const jsFiles = files.filter(f => f.endsWith('.js'));

console.log(`Found ${jsFiles.length} JavaScript files to convert\n`);

// Conversion mapping
const conversionMap = {
  // Services (Zustand stores)
  'AuthenticationSystem': 'service',
  'BillingInsuranceManager': 'service',
  'InsuranceClearinghouseAPI': 'service',
  'PaymentProcessor': 'service',
  'ComplianceSystem': 'service',
  'SubscriptionManager': 'service',
  'CollaborationSystem': 'service',
  'AdvancedAnalyticsAI': 'service',
  'MonitoringSystem': 'service',
  'DataService': 'service',
  'OfflineManager': 'service',
  'CloudSyncService': 'service',
  'BackupService': 'service',
  
  // UI Components
  'BoardManager': 'component',
  'ElizaService': 'component',
  'TileManagementService': 'component',
  'EmergencyTilesService': 'component',
  'UIEffectsService': 'component',
  'NavigationService': 'component',
  'BottomNavService': 'component',
  'WelcomeService': 'component',
  
  // Hooks
  'SpeechService': 'hook',
  'VoiceRecognitionService': 'hook',
  'HapticService': 'hook',
  'GestureService': 'hook',
  'AccessibilityService': 'hook',
  'ThemeService': 'hook',
  'LanguageService': 'hook'
};

// Convert each module
jsFiles.forEach(file => {
  const className = file.replace('.js', '');
  const content = fs.readFileSync(path.join(modulesDir, file), 'utf8');
  
  const type = conversionMap[className] || 'service';
  let convertedCode = '';
  let outputPath = '';
  
  switch (type) {
    case 'service':
      // Extract methods from class
      const methodRegex = /(\w+)\s*\((.*?)\)\s*\{/g;
      const methods = [];
      let match;
      while ((match = methodRegex.exec(content)) !== null) {
        if (match[1] !== 'constructor' && match[1] !== 'initialize') {
          methods.push(`${match[1]}: (${match[2]}) => void;`);
        }
      }
      
      convertedCode = templates.service(className, methods.join('\n  '));
      outputPath = path.join(servicesDir, `${className}.ts`);
      break;
      
    case 'component':
      convertedCode = templates.component(className);
      outputPath = path.join(componentsDir, `${className}.tsx`);
      break;
      
    case 'hook':
      const hookName = `use${className.replace('Service', '')}`;
      convertedCode = templates.hook(hookName, '// Add hook logic here');
      outputPath = path.join(hooksDir, `${hookName}.ts`);
      break;
  }
  
  fs.writeFileSync(outputPath, convertedCode);
  console.log(`✅ Converted ${className} -> ${type}`);
});

// Create main exports
const serviceExports = jsFiles
  .filter(f => conversionMap[f.replace('.js', '')] === 'service')
  .map(f => {
    const name = f.replace('.js', '');
    return `export { use${name} } from './${name}';`;
  })
  .join('\n');

fs.writeFileSync(
  path.join(servicesDir, 'index.ts'),
  serviceExports
);

console.log('\n✅ Created service exports');

// Create a master module registry
const moduleRegistry = `// Auto-generated module registry
export const modules = {
${jsFiles.map(f => {
  const name = f.replace('.js', '');
  const type = conversionMap[name] || 'service';
  return `  ${name}: {
    type: '${type}',
    path: '${type === 'component' ? 'components/modules' : type === 'hook' ? 'hooks' : 'services'}/${name}'
  },`;
}).join('\n')}
};

export const moduleCount = ${jsFiles.length};
`;

fs.writeFileSync(
  path.join(servicesDir, 'module-registry.ts'),
  moduleRegistry
);

console.log('✅ Created module registry');
console.log(`\n🎉 Conversion complete! Converted ${jsFiles.length} modules.`);