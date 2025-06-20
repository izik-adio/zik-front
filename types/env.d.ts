declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_AWS_REGION: string;
      EXPO_PUBLIC_USER_POOL_ID: string;
      EXPO_PUBLIC_CLIENT_ID: string;
      EXPO_PUBLIC_API_URL: string;
      EXPO_PUBLIC_DEV_MODE: string;
    }
  }
}

export {};