# Caching and Persistence Implementation

## Overview

This document outlines the caching and persistence improvements implemented to fix data loss issues and improve user experience.

## Problems Solved

### 1. ❌ Chat History Lost on Refresh

**Before**: Chat conversations were lost whenever the app was refreshed or restarted
**After**: ✅ Chat history is now persisted to device storage and restored on app restart

### 2. ❌ Quest Data Always Loading

**Before**: Quest and today page data required network calls on every app launch
**After**: ✅ Cached data loads immediately, then refreshes in background if stale

### 3. ❌ No Offline Support

**Before**: No data available without network connection
**After**: ✅ Previously cached data available offline

## Implementation Details

### Chat Store Persistence (`src/store/chatStore.ts`)

- **Added Zustand Persist Middleware**: Uses AsyncStorage for persistent chat history
- **Selective Persistence**: Only persists messages, not loading states or errors
- **Automatic Restoration**: Chat history automatically restored on app startup

```typescript
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      /* store logic */
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);
```

### Quest Store Persistence (`src/store/questStore.ts`)

- **Added Zustand Persist Middleware**: Caches quest data to device storage
- **Smart Refresh Strategy**: Shows cached data immediately, refreshes if data is stale (>5 minutes)
- **Background Updates**: Fresh data loads silently without affecting UI

```typescript
export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      /* store logic */
    }),
    {
      name: 'quest-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        epicQuests: state.epicQuests,
        dailyQuests: state.dailyQuests,
        lastFetch: state.lastFetch,
      }),
    }
  )
);
```

### UI Updates

#### Today Page (`app/(tabs)/index.tsx`)

- **Immediate Cache Load**: Shows cached quest data instantly
- **Background Refresh**: Only fetches fresh data if cache is stale
- **Better UX**: No loading state for cached data

#### Quest Page (`app/(tabs)/quests.tsx`)

- **Same Caching Strategy**: Immediate cache display with background refresh
- **Persistent Quest Progress**: User progress maintained across app restarts

## Cache Strategy

### Chat Messages

- **Persistence**: All messages stored permanently until manually cleared
- **Initial Message**: Default greeting message shown if no history exists
- **Real-time Updates**: New messages immediately saved to cache

### Quest Data

- **Stale Time**: 5 minutes (configurable)
- **Cache-First**: Always show cached data first
- **Background Refresh**: Silently update if data is older than stale time
- **Network Fallback**: Fresh fetch if no cached data exists

## Benefits

### 🚀 Performance Improvements

- **Instant Load**: Cached data appears immediately (no loading states)
- **Reduced API Calls**: Only refresh when data is actually stale
- **Better Perceived Performance**: Users see content instantly

### 💾 Data Persistence

- **Chat History**: Never lose conversation context
- **Quest Progress**: Maintain progress across app sessions
- **Offline Access**: View previously loaded data without internet

### 🔧 Developer Experience

- **Type Safety**: Full TypeScript support with proper typing
- **Error Handling**: Graceful fallbacks if persistence fails
- **Debugging**: Clear separation of cache vs fresh data

## Usage Examples

### Chat Store

```typescript
// Messages automatically persist and restore
const { messages, sendMessage } = useChatStore();

// Clear history (if needed)
const { clearMessages } = useChatStore();
```

### Quest Store

```typescript
// Get cached data (instant)
const { dailyQuests, epicQuests } = useQuestStore();

// Force refresh from API
const actions = getQuestStoreActions();
actions.fetchTodayQuests();
```

## Configuration

### Stale Time

To adjust when data is considered stale, modify the check in the useEffect:

```typescript
const shouldRefresh =
  !lastFetch || Date.now() - new Date(lastFetch).getTime() > 5 * 60 * 1000; // 5 minutes
```

### Storage Keys

- Chat: `chat-store`
- Quests: `quest-store`

These can be changed in the persist configuration if needed.

## Testing

To test the persistence:

1. **Chat History**:

   - Send messages in Zik chat
   - Close and reopen app
   - Verify chat history is restored

2. **Quest Caching**:

   - Load quest data on Today/Quest pages
   - Go offline
   - Navigate away and back
   - Verify cached data still displays

3. **Background Refresh**:
   - Load quest data
   - Wait 6+ minutes
   - Navigate to page
   - Should see cached data instantly, then update

## Future Enhancements

- **Cache Expiration**: Automatic cleanup of very old data
- **Compression**: Reduce storage size for large chat histories
- **Sync Conflicts**: Handle data conflicts between cache and server
- **Analytics**: Track cache hit rates and performance improvements
