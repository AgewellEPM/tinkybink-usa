// Browser polyfills for server-side rendering
if (typeof window === 'undefined') {
  // Define self for server environment
  if (typeof global !== 'undefined' && typeof self === 'undefined') {
    (global as any).self = global;
  }
  
  // Define additional browser globals if needed
  if (typeof globalThis !== 'undefined' && typeof self === 'undefined') {
    (globalThis as any).self = globalThis;
  }
}

export {};