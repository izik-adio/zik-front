# Zik Frontend Architecture Documentation

## 1. Project Overview

- **Application Name:** Zik
- **Purpose:** Zik is a personal wellness companion app that helps users achieve their goals through mindful practices, daily tasks, and AI-powered chat guidance.
- **Core Tech Stack:**
  - React Native
  - Expo
  - TypeScript
  - Zustand (state management)
  - React Context (theme, auth, query)
  - React Navigation (via expo-router)
  - @tanstack/react-query (API caching)
  - AsyncStorage (persistence)

## 2. Directory Structure Overview

```
/src
├── /api         # API service layer for backend communication (tasks, goals, profile, axios)
├── /context     # React Context providers (Auth, Theme, Query)
├── /services    # Low-level API and Cognito service wrappers
├── /store       # Zustand stores for global state (tasks/goals, chat)
├── /types       # TypeScript types for API and data models
├── /utils       # Helper functions (storage, JWT, reset)
/components      # Reusable UI and feature components (onboarding, today, quests, zik, ui)
```

**Note:** There are no `/screens` or `/navigation` folders; navigation and screens are defined in the `/app` directory using the Expo Router convention.

## 3. State Management Strategy

- **Primary Library:** Zustand (with persistence via AsyncStorage)
- **Core Concepts:**
  - `useTaskGoalStore` (Zustand): Holds arrays of `tasks` and `goals`, loading/error state, and provides async actions for CRUD operations (fetch, create, update, delete, mark complete) for both tasks and goals.
  - `useChatStore` (Zustand): Holds chat `messages`, loading/streaming state, and provides async actions for sending messages, streaming AI responses, and refreshing quests after chat.
  - React Contexts: `AuthContext` (user/session), `ThemeContext` (theme/colors), `QueryProvider` (react-query client).
- **Data Flow:**
  1. UI triggers an action (e.g., add task, send chat message).
  2. The relevant Zustand store method calls the API layer (`src/api/quests.ts`, etc.).
  3. On success, the store updates its state, which re-renders subscribed components.
  4. Data is persisted to AsyncStorage for offline support.

## 4. API / Service Layer

- **Location:**
  - `src/api/quests.ts` (tasks/goals CRUD)
  - `src/api/profile.ts` (user profile)
  - `src/services/api.ts` (low-level axios instance, auth headers, interceptors)
- **Purpose:**
  - Encapsulates all backend communication, including authentication, CRUD for tasks/goals, and chat message posting.
- **Key Functions:**
  - `tasksApi.fetchTasksByDate(date)` – Fetch tasks for a specific date
  - `tasksApi.createTask(data)` – Create a new task
  - `tasksApi.updateTask(id, data)` – Update a task
  - `tasksApi.deleteTask(id)` – Delete a task
  - `goalsApi.fetchGoals()` – Fetch all goals
  - `goalsApi.createGoal(data)` – Create a new goal
  - `goalsApi.updateGoal(id, data)` – Update a goal
  - `goalsApi.deleteGoal(id)` – Delete a goal
  - `profileApi.getProfile()` – Fetch user profile
  - `profileApi.updateProfile(data)` – Update user profile
  - `apiService.postChatMessage(message, onChunk, onComplete, onError)` – Send a chat message and stream AI response

## 5. Navigation Flow

- **Root Navigator:** Stack Navigator (via Expo Router)
- **Tabs:** Defined in `app/(tabs)/_layout.tsx`:
  - **Today** (`index`) – Main daily tasks screen
  - **Zik** (`zik`) – AI chat interface
  - **Goals** (`quests`) – Goals management
  - **Profile** (`profile`) – User profile/settings
- **Nested Stacks:**
  - **Auth Stack:** (`app/auth/_layout.tsx`) – Contains `login` and `signup` screens
  - **Onboarding Stack:** (`app/onboarding/index.tsx`) – Multi-step onboarding (Welcome, GoalsSelection, Permissions)
  - **Not Found:** (`+not-found.tsx`)

## 6. Screen & Component Breakdown

---

### Screen: `TodayScreen`

- **File Path:** `app/(tabs)/index.tsx`
- **Purpose:** Display today's tasks, allow marking complete, and adding new tasks.
- **Data Displayed:**
  - List of today's tasks (`tasks` from `useTasks`)
- **State Management:**
  - `useTasks` (Zustand)
  - Actions: `markTaskComplete`, `createTask`, `deleteTask`
- **User Actions:**
  - Add, complete, or delete a task
- **Key Reusable Components Used:**
  - `<GreetingHeader />`, `<WellnessCard />`, `<QuestCard />`, `<AddTaskModal />`, `<EmptyStateCard />`

---

### Screen: `ZikScreen`

- **File Path:** `app/(tabs)/zik.tsx`
- **Purpose:** AI-powered chat interface for guidance, reflection, and quest creation
- **Data Displayed:**
  - Chat messages (`messages` from `useChatStore`)
  - Suggestions for quick prompts
- **State Management:**
  - `useChatStore` (Zustand)
- **User Actions:**
  - Send a message, select a suggestion
- **Key Reusable Components Used:**
  - `<ChatBubble />`, `<SuggestionChip />`, `<LogoImage />`

---

### Screen: `GoalsScreen`

- **File Path:** `app/(tabs)/quests.tsx`
- **Purpose:** Manage user goals (view, create, delete)
- **Data Displayed:**
  - List of goals (`goals` from `useGoals`)
- **State Management:**
  - `useGoals` (Zustand)
  - Actions: `createGoal`, `deleteGoal`, `updateGoal`
- **User Actions:**
  - Add or delete a goal
- **Key Reusable Components Used:**
  - `<GoalCard />`, `<CreateQuestModal />`, `<EmptyStateCard />`

---

### Screen: `ProfileScreen`

- **File Path:** `app/(tabs)/profile.tsx`
- **Purpose:** User profile, preferences, notification settings, and app info
- **Data Displayed:**
  - User info, notification toggle, theme, privacy, support, about
- **State Management:**
  - `useAuth` (React Context)
  - `profileApi` (React Query)
- **User Actions:**
  - Edit/save profile, toggle notifications, change theme, clear cache, logout
- **Key Reusable Components Used:**
  - `<Switch />`, `<TextInput />`, `<TouchableOpacity />`

---

### Onboarding Screens

- **WelcomeScreen:** (`components/onboarding/WelcomeScreen.tsx`) – App intro, get started/skip
- **GoalsSelectionScreen:** (`components/onboarding/GoalsSelectionScreen.tsx`) – Select focus areas/goals
- **PermissionsScreen:** (`components/onboarding/PermissionsScreen.tsx`) – Enable notifications
- **AuthWelcomeScreen:** (`components/onboarding/AuthWelcomeScreen.tsx`) – Welcome, sign up, or log in
- **SplashScreen:** (`components/onboarding/SplashScreen.tsx`) – Animated splash/logo

## 7. Key Reusable Components

- **`<QuestCard />`** (`components/today/QuestCard.tsx`): Displays a single task with completion and delete actions
- **`<GoalCard />`** (`components/quests/QuestCard.tsx`): Displays a single goal with delete action
- **`<EmptyStateCard />`** (`components/today/EmptyStateCard.tsx`): Shows a friendly prompt when no tasks/goals exist
- **`<AddTaskModal />`** (`components/today/AddTaskModal.tsx`): Modal for adding a new task
- **`<ChatBubble />`** (`components/zik/ChatBubble.tsx`): Renders a chat message (user or AI)
- **`<SuggestionChip />`** (`components/zik/SuggestionChip.tsx`): Tappable suggestion for chat input
- **`<GreetingHeader />`** (`components/today/GreetingHeader.tsx`): Header with user greeting and completion rate
- **`<WellnessCard />`** (`components/today/WellnessCard.tsx`): Displays wellness tips or stats
- **`<LogoImage />`** (`components/onboarding/LogoImage.tsx`): App logo, used in headers and splash
- **`<TypingCursor />`** (`components/ui/TypingCursor.tsx`): Animated typing cursor for chat
