// Ensure critical Web APIs exist before MSW and tests initialize
// This file runs via Jest's setupFiles (before setupFilesAfterEnv)

// TextEncoder/TextDecoder for Node/JSDOM
import { TextEncoder, TextDecoder } from 'util';
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder;
}

// Fetch and related globals are provided by 'cross-fetch/polyfill' configured in Jest setupFiles

// BroadcastChannel stub (used by MSW v2 in some flows)
if (typeof globalThis.BroadcastChannel === 'undefined') {
  globalThis.BroadcastChannel = class BroadcastChannel {
    constructor(name) { this.name = name; }
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

// TransformStream for @mswjs/interceptors fetch brotli utils
if (typeof globalThis.TransformStream === 'undefined') {
  try {
    const { TransformStream } = require('stream/web');
    if (TransformStream) {
      globalThis.TransformStream = TransformStream;
    }
  } catch {
    // ignore; Node <16 may not have stream/web
  }
}
