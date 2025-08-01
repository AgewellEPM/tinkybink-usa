# Claude Development Notes - TinkyBink AAC

## Project Context
This is a modern Next.js conversion of a 1.4MB single HTML file AAC (Augmentative and Alternative Communication) application. The original had 64 modules embedded in one file - we're converting it to a modular, maintainable architecture.

## Quick Commands
- **Run dev server**: `npm run dev` (runs on port 3456)
- **Type check**: `npm run type-check`
- **Lint**: `npm run lint`
- **Build**: `npm run build`

## Module Implementation Status

### ✅ Completed Phases (20/63 modules)
1. **Foundation Phase (1-5)**: Core speech, data, board management, AI, analytics
2. **UI Enhancement (6-10)**: Effects, tile management, emergency tiles, sessions, haptics
3. **Communication Enhancement (11-15)**: Languages, voice recognition, import/export, cloud sync, accessibility
4. **Professional Features (16-20)**: Therapy goals, dashboard, billing, prescriptions, compliance

### 🔄 Pending Phases
5. **Learning & Games (21-25)**: Educational games and activities
6. **Collaboration (26-30)**: Multi-user features
7. **Advanced Communication (31-35)**: Prediction, symbols, gestures
8. **AI & Machine Learning (36-40)**: Advanced AI features
9. **Customization (41-45)**: Themes, layouts, personalization
10. **Integration (46-50)**: Third-party integrations
11. **Advanced Analytics (51-55)**: Deep analytics
12. **Enterprise (56-60)**: Enterprise features
13. **Experimental (61-63)**: Future features

## Architecture Patterns

### Service Pattern
All modules use singleton pattern:
```typescript
export class ServiceName {
  private static instance: ServiceName;
  
  private constructor() {}
  
  static getInstance(): ServiceName {
    if (!ServiceName.instance) {
      ServiceName.instance = new ServiceName();
    }
    return ServiceName.instance;
  }
  
  initialize(): void {
    // Setup code
  }
}

export function getServiceName(): ServiceName {
  return ServiceName.getInstance();
}
```

### Module Registration
New modules must be registered in `/src/modules/module-system.ts`:
1. Import the service
2. Register in the appropriate phase
3. Export the getter function

## Key Directories
- `/src/modules/core/` - Foundation services
- `/src/modules/ui/` - UI enhancement services
- `/src/modules/communication/` - Communication services
- `/src/modules/professional/` - Professional/healthcare services
- `/src/components/` - React components
- `/src/hooks/` - Custom React hooks
- `/src/store/` - Zustand state management

## Important Files
- `/src/modules/module-system.ts` - Central module registry
- `/src/app/page.tsx` - Main app page
- `/src/app/globals.css` - Global styles
- `/src/store/app-store.ts` - Global app state

## Common Tasks

### Adding a New Module
1. Create service file in appropriate directory
2. Implement singleton pattern
3. Add to module-system.ts
4. Create React hook if needed
5. Update UI components to use service

### Adding UI Features
1. Check if related service exists
2. Add methods to service
3. Create/update React components
4. Add to settings panel if configurable

### Debugging
- Check browser console for errors
- Module initialization logs to console
- All services track analytics events
- Check dev.log for server errors

## Style Guidelines
- Use TypeScript for all new code
- Follow existing patterns in codebase
- Services handle business logic
- Components handle presentation
- Hooks bridge services and components
- Keep accessibility in mind

## Testing Approach
- Manual testing via dev server
- Check all module initializations
- Test cross-module interactions
- Verify data persistence
- Test error scenarios

## Performance Considerations
- Services are singletons (initialized once)
- Use lazy loading for heavy components
- Module system initializes on demand
- Local storage for persistence
- Debounce frequent operations

## Security Notes
- HIPAA compliance tracking in place
- Audit trail for all actions
- Consent management system
- No PHI in code/logs
- Encryption for sensitive data

## Known Issues
- Language selector styling needs refinement
- Some modules pending implementation
- Cloud sync currently uses localStorage (needs backend)

## Next Steps
1. Implement Learning & Games modules (21-25)
2. Add collaboration features (26-30)
3. Build prediction engine (31-35)
4. Enhance AI capabilities (36-40)
5. Add backend API for cloud features

## Resources
- Original HTML file analysis in PROJECT_SUMMARY.md
- Module list and descriptions in project docs
- Next.js docs: https://nextjs.org/docs
- Zustand docs: https://zustand-demo.pmnd.rs/

Last Updated: 2025-07-31