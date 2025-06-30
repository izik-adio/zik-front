// Global auth redirect utility
let globalLogoutCallback: (() => Promise<void>) | null = null;

export const setGlobalLogoutCallback = (callback: () => Promise<void>) => {
  globalLogoutCallback = callback;
};

export const triggerGlobalLogout = async () => {
  if (globalLogoutCallback) {
    await globalLogoutCallback();
  }
};