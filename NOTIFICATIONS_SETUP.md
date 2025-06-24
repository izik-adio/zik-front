# Push Notifications Setup Guide

## Current Issue

Your app shows warnings about `expo-notifications` not being fully supported in Expo Go since SDK 53. This affects push notification functionality.

## Solutions

### Option 1: Development Build (Recommended for Production)

A development build gives you full access to native functionality including push notifications.

#### Setup Steps:

1. **Install Required Packages** (Already done):

   ```bash
   npm install expo-dev-client
   npm install -g @expo/cli eas-cli
   ```

2. **Configuration Files Created**:

   - Updated `app.json` with notification and dev-client plugins
   - Created `eas.json` for build configuration
   - Added build scripts to `package.json`

3. **To Create a Development Build**:

   ```bash
   # For Android
   npm run build:android

   # For iOS (requires Apple Developer account)
   npm run build:ios
   ```

4. **To Run with Development Build**:
   ```bash
   # After installing the development build on your device
   npm run dev:dev-client
   ```

#### Benefits:

- Full push notification support
- Access to all native features
- Same as production environment
- Can be installed on physical devices

#### Requirements:

- EAS account (free tier available)
- For iOS: Apple Developer account ($99/year)
- Physical device to test

### Option 2: Continue with Expo Go (Limited)

Modified your `PermissionsScreen.tsx` to handle Expo Go limitations gracefully:

- Detects when running in Expo Go
- Shows appropriate messaging to users
- Skips notification permission requests
- Allows app to continue functioning

#### Current Behavior:

- In Expo Go: Shows "Continue (Limited in Expo Go)" button
- In Development Build: Normal notification permission flow

## Next Steps

### For Development (Short-term):

- Continue using Expo Go for development
- Notifications will show warnings but app will function
- Users will see appropriate messaging about limitations

### For Production (Long-term):

1. Create EAS account: `npx eas whoami` (then sign up if needed)
2. Build development build: `npm run build:android`
3. Install development build on test devices
4. Test full notification functionality
5. Build production version when ready

## Files Modified:

- `app.json` - Added notification and dev-client plugins
- `package.json` - Added build scripts
- `eas.json` - Created build configuration
- `PermissionsScreen.tsx` - Added Expo Go detection and handling

## Commands Available:

```bash
# Development with Expo Go (current)
npm run dev

# Development with dev client (after building)
npm run dev:dev-client

# Build development version
npm run build:android
npm run build:ios
```

## Testing Push Notifications:

- In Expo Go: Limited functionality, shows appropriate warnings
- In Development Build: Full functionality available
- Use Expo's push notification tool for testing: https://expo.dev/notifications
