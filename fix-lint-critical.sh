#!/bin/bash

echo "🔧 Fixing critical lint errors..."

# Fix unescaped quotes in WhichOneDoesntBelong.tsx
echo "Fixing unescaped quotes..."
sed -i '' "s/which one doesn't belong/which one doesn\&apos;t belong/g" src/components/games/WhichOneDoesntBelong.tsx

# Fix unescaped quotes in VelcroGuides.tsx  
echo "Fixing unescaped quotes in VelcroGuides..."
sed -i '' 's/"4"/\&quot;4\&quot;/g' src/components/pecs/advanced/VelcroGuides.tsx
sed -i '' 's/"2.5"/\&quot;2.5\&quot;/g' src/components/pecs/advanced/VelcroGuides.tsx
sed -i '' 's/"3"/\&quot;3\&quot;/g' src/components/pecs/advanced/VelcroGuides.tsx

# Run ESLint auto-fix on specific directories
echo "Running ESLint auto-fix..."
npx eslint 'src/**/*.{ts,tsx}' --fix --quiet

# Show remaining errors
echo ""
echo "📊 Remaining lint errors:"
npx eslint 'src/**/*.{ts,tsx}' --quiet | grep -E "error|Error" | wc -l

echo "✅ Lint fixes applied. Most warnings are acceptable (unused vars, any types in legacy code)."