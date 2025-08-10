// Polyfill for 'self' in Node.js/server environment
if (typeof global !== 'undefined' && typeof self === 'undefined') {
  global.self = global;
}

// For older Node.js versions
if (typeof globalThis !== 'undefined' && typeof self === 'undefined') {
  globalThis.self = globalThis;
}

// Export for ES modules
export const selfPolyfill = () => {
  if (typeof global !== 'undefined' && typeof self === 'undefined') {
    global.self = global;
  }
  if (typeof globalThis !== 'undefined' && typeof self === 'undefined') {
    globalThis.self = globalThis;
  }
};