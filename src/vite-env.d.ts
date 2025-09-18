/// <reference types="vite/client" />

// Global type declarations for browser extension protection
declare global {
  interface Window {
    __CLEAN_APIS__?: {
      fetch?: typeof fetch;
      Headers?: typeof Headers;
      Request?: typeof Request;
      Response?: typeof Response;
      XMLHttpRequest?: typeof XMLHttpRequest;
    };
    __PROTECTION_ACTIVE__?: boolean;
    __PROTECTION_TIMESTAMP__?: number;
    __PROTECTION_FAILED__?: boolean;
    __SB_CLIENT_MARK__?: string;
  }
}
