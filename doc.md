## 1. Project Overview

**Application Name:**
- The project folder is named `zik-front`, and the main app is likely called "Zik" (verify in `app.json` for the display name).

**Purpose:**
- You will need to check the onboarding components or any README/app.json for a one-sentence description of what the app does for the user.

**Core Tech Stack:**
- From the structure and file extensions, the project uses:
  - React Native (Expo managed workflow)
  - TypeScript
  - Likely React Navigation (look for navigation setup in `app/` or a `navigation/` folder)
  - State management: Context API and custom stores (see `src/context/` and `src/store/`)
  - API communication: Axios (see `src/api/axios.ts`)
  - Other: Custom hooks, reusable components

---

## 2. Directory Structure Overview

The main source folder is `src/`. Here are the key directories and their likely purposes, verified from the file search:

```
/src
├── /api         # API service layer for backend communication (axios, endpoints, tests)
├── /components  # Reusable, shared UI components (onboarding, quests, today, ui, zik)
├── /context     # React Context providers (Auth, Theme, Query)
├── /hooks       # Custom React hooks (e.g., useTypewriter, useFrameworkReady)
├── /services    # Service logic (api, cognito)
├── /store       # Global state management (chatStore, questStore)
├── /types       # TypeScript type definitions (api, env, images)
└── /utils       # Helper functions (jwt, resetApp, storage)
```

There is no `/navigation` or `/screens` directory; navigation and screens are organized under the `/app` directory (with subfolders for tabs, auth, onboarding).

---

## 3. State Management Strategy

**Primary Library:**
- The project uses a combination of React Context (see `src/context/`) and custom store files (see `src/store/`).

**Core Concepts:**
- Context Providers: `AuthContext`, `ThemeContext`, `QueryProvider` (likely for authentication, theming, and data fetching/caching).
- Custom Stores: `chatStore.ts`, `questStore.ts` (likely using Zustand or a similar pattern, but verify the implementation).

**Data Flow:**
- Data is fetched via API functions (in `src/api/`), then stored in context or custom stores, and accessed by screen/components.

---

## 4. API / Service Layer

**Location:**
- Main API logic is in `src/api/` (with files for `axios`, `goals`, `profile`, `quests`, etc.).
- Additional service logic in `src/services/` (e.g., `api.ts`, `cognito.ts`).

**Purpose:**
- Handles all backend communication, including authentication (Cognito), fetching goals, quests, profiles, etc.

**Key Functions:**
- Each file in `src/api/` likely exports functions for CRUD operations (e.g., `getGoals`, `getProfile`, `getQuests`, etc.).
- `src/services/api.ts` and `src/services/cognito.ts` may wrap or extend API logic.

---

## 5. Navigation Flow

**Root Navigator:**
- Navigation is defined in the `/app` directory, with a main `_layout.tsx` and subfolders for tabs, auth, onboarding.
- The presence of `(tabs)/_layout.tsx` suggests a Tab Navigator as the root.

**Tabs:**
- Tabs are defined in `/app/(tabs)/`:
  - `index.tsx`
  - `profile.tsx`
  - `quests.tsx`
  - `zik.tsx`

**Nested Stacks:**
- Each tab may have its own stack or screen components.
- Auth flow is in `/app/auth/` (with `login.tsx`, `signup.tsx`).
- Onboarding flow is in `/app/onboarding/`.

---

## 6. Screen & Component Breakdown

**Major Screens:**
- `/app/(tabs)/index.tsx` (likely the main/home screen)
- `/app/(tabs)/profile.tsx`
- `/app/(tabs)/quests.tsx`
- `/app/(tabs)/zik.tsx`
- `/app/auth/login.tsx`
- `/app/auth/signup.tsx`
- `/app/onboarding/index.tsx`

**For each screen, you should:**
- Check the file for its purpose, data displayed, state management, user actions, and key components used.
- Example: `/app/(tabs)/index.tsx` likely displays today's tasks and chat interface, using components from `components/today/` and `components/zik/`.

---

## 7. Key Reusable Components

**From `/components/`:**
- `/components/zik/ChatBubble.tsx`, `/components/zik/SuggestionChip.tsx` (chat UI)
- `/components/today/QuestCard.tsx`, `/components/today/WellnessCard.tsx`, `/components/today/EmptyStateCard.tsx`, `/components/today/AddTaskModal.tsx`, `/components/today/GreetingHeader.tsx` (today/task UI)
- `/components/quests/QuestCard.tsx`, `/components/quests/QuestPath.tsx`, `/components/quests/CreateQuestModal.tsx` (quest UI)
- `/components/onboarding/WelcomeScreen.tsx`, `/components/onboarding/SplashScreen.tsx`, `/components/onboarding/PermissionsScreen.tsx`, `/components/onboarding/GoalsSelectionScreen.tsx`, `/components/onboarding/AuthWelcomeScreen.tsx`, `/components/onboarding/LogoImage.tsx` (onboarding UI)
- `/components/ui/TypingCursor.tsx` (UI utility)

---

**To complete the documentation:**
- For each section, open the relevant files to extract exact details (e.g., app name, screen purposes, state usage, API function names).
- For the screen breakdown, read each screen file and note the data, state, actions, and components.
- For the API/service layer, list the exported functions from each file in `src/api/` and `src/services/`.
- For state management, check the implementation of each context and store.

This summary gives you a precise map of where to look for each required detail, ensuring your documentation is accurate and source-verified.```markdown
# Zik Frontend Architecture Documentation

## 1. Project Overview

* **Application Name:** Zik
* **Purpose:** Zik is a personal growth companion app that helps users set, track, and complete daily tasks and long-term goals, while providing chat-based guidance and wellness features.
* **Core Tech Stack:**
  - React Native (with Expo)
  - TypeScript
  - React Navigation
  - Zustand (for state management)
  - React Context (for theme and authentication)
  - @tanstack/react-query (for server state/query caching)
  - AWS Cognito (authentication, via custom service)
  - Axios (API requests)
  - AsyncStorage (persistent storage)
  - react-native-reanimated, react-native-svg (animations and SVGs)

## 2. Directory Structure Overview

```
/src
├── /api         # API service layer for backend communication (REST endpoints, data models)
├── /components  # Reusable UI components (Cards, Modals, Onboarding, Chat, etc.)
├── /context     # React Context providers (Auth, Theme, Query)
├── /hooks       # Custom React hooks (e.g., useTypewriter, useFrameworkReady)
├── /services    # Business logic and API abstraction (e.g., Cognito, apiService)
├── /store       # Zustand stores for chat and quest/task/goal state
├── /types       # TypeScript type definitions for API and environment
└── /utils       # Helper utilities (JWT, storage, app reset, etc.)
```

**Notes:**
- The main source folder is at the project root, not under `/src`, for `/components`, `/hooks`, and `/types`.
- The `/app` directory contains the main navigation and screen entry points, following Expo Router conventions.

## 3. State Management Strategy

* **Primary Library:** Zustand (for chat and quest/task/goal state), React Context (for theme and authentication), React Query (for server state)
* **Core Concepts:**
  - **Zustand:** Used for managing chat state (`chatStore.ts`) and task/goal state (`questStore.ts`). Each store exposes hooks for accessing and mutating state.
  - **React Context:** Used for authentication (`AuthContext.tsx`) and theming (`ThemeContext.tsx`). Providers wrap the app and expose hooks (`useAuth`, `useTheme`).
  - **React Query:** Used for caching and managing server state, with a `QueryProvider` wrapping the app.
* **Data Flow:**
  1. UI triggers an action (e.g., add task, send chat message).
  2. The action calls an API/service function (via `/api` or `/services`).
  3. On success, the relevant Zustand store is updated.
  4. Components subscribe to store slices and re-render on changes.
  5. Persistent data (e.g., chat history, tasks) is stored in AsyncStorage via Zustand's `persist` middleware.

## 4. API / Service Layer

* **Location:** `src/api/` and `src/services/`
* **Purpose:** Abstracts backend communication, handles authentication, and provides typed interfaces for all data operations.
* **Key Functions:**
  - **Profile:** `getProfile()`, `updateProfile()` (`src/api/profile.ts`)
  - **Goals/Tasks/Quests:** `getGoals()`, `createGoal()`, `updateGoal()`, `deleteGoal()`, `getDashboard()`, `createTask()`, `updateTask()`, `deleteTask()` (`src/api/goals.ts`, `src/api/quests.ts`, `src/services/api.ts`)
  - **Chat:** Managed via `chatStore` and possibly a chat API (not fully detailed in the provided code)
  - **Authentication:** `signUp()`, `signIn()`, `confirmSignUp()`, `forgotPassword()`, `refreshTokens()`, `getUser()` (`src/services/cognito.ts`)
  - **Storage:** `setItem()`, `getItem()`, `removeItem()`, `clear()` (`src/utils/storage.ts`)
  - **App Reset:** `resetAppForTesting()`, `resetOnboarding()` (`src/utils/resetApp.ts`)

## 5. Navigation Flow

* **Root Navigator:** Expo Router-based navigation (file-based, under `/app`)
* **Tabs:** Defined in `app/(tabs)/_layout.tsx`
  - **Tab Screens:**
    - `index.tsx` (likely Home/Dashboard)
    - `profile.tsx`
    - `quests.tsx`
    - `zik.tsx` (possibly Chat)
* **Nested Stacks:**
  - Each tab can have its own stack (e.g., onboarding, auth, and main app flows are separated in `/app/onboarding/`, `/app/auth/`, etc.).
  - Onboarding flow: `/app/onboarding/index.tsx` and related screens.
  - Auth flow: `/app/auth/login.tsx`, `/app/auth/signup.tsx`, etc.
  - Not Found: `/app/+not-found.tsx`

## 6. Screen & Component Breakdown

---

### Screen: `Onboarding/WelcomeScreen`

* **File Path:** `components/onboarding/WelcomeScreen.tsx`
* **Purpose:** Greets the user and introduces the app, with options to proceed or skip onboarding.
* **Data Displayed:**
  - App logo and tagline.
  - Welcome message and description.
* **State Management:**
  - Theme via `useTheme()`.
* **User Actions:**
  - `onNext()`: Proceeds to the next onboarding step.
  - `onSkip()`: Skips onboarding.
* **Key Reusable Components Used:**
  - Likely uses `<LogoImage />` and custom buttons.

---

### Screen: `Onboarding/GoalsSelectionScreen`

* **File Path:** `components/onboarding/GoalsSelectionScreen.tsx`
* **Purpose:** Allows the user to select their personal growth goals from a predefined list.
* **Data Displayed:**
  - List of goal categories (e.g., Work Habits, Wellbeing, Skills, etc.), each with icon, title, and description.
* **State Management:**
  - Local state for selected goals.
* **User Actions:**
  - Select/deselect goals.
  - `onNext()`: Proceeds after selection.
  - `onSkip()`: Skips goal selection.
* **Key Reusable Components Used:**
  - Custom goal selection cards/chips.

---

### Screen: `Onboarding/PermissionsScreen`

* **File Path:** `components/onboarding/PermissionsScreen.tsx`
* **Purpose:** Requests necessary permissions from the user (e.g., notifications).
* **Data Displayed:**
  - Permission request UI.
* **State Management:**
  - Local state for permission status.
* **User Actions:**
  - Grant/deny permissions.
  - `onNext()`: Proceeds after permissions are handled.

---

### Screen: `Onboarding/AuthWelcomeScreen`

* **File Path:** `components/onboarding/AuthWelcomeScreen.tsx`
* **Purpose:** Welcomes the user to the authentication flow.
* **Data Displayed:**
  - Welcome/auth prompt.
* **State Management:** None.
* **User Actions:** Proceeds to login/signup.

---

### Screen: `Onboarding/SplashScreen`

* **File Path:** `components/onboarding/SplashScreen.tsx`
* **Purpose:** Animated splash screen shown on app launch.
* **Data Displayed:**
  - Animated logo and background.
* **State Management:**
  - Animation state via `react-native-reanimated`.
* **User Actions:** None (auto-advances on animation complete).

---

### Screen: `Today/GreetingHeader`

* **File Path:** `components/today/GreetingHeader.tsx`
* **Purpose:** Displays a personalized greeting and daily completion progress.
* **Data Displayed:**
  - Greeting (e.g., "Good morning, [userName]").
  - Current date.
  - Circular progress indicator for daily completion rate.
* **State Management:**
  - Props: `userName`, `completionRate`.
* **User Actions:** None (display only).

---

### Screen: `Today/EmptyStateCard`

* **File Path:** `components/today/EmptyStateCard.tsx`
* **Purpose:** Shown when there are no tasks or goals; prompts user to add new ones.
* **Data Displayed:**
  - Message and icon for empty state.
* **State Management:**
  - Props: `type` ('quests' or 'goals').
* **User Actions:**
  - `onAddPress()`: Opens modal to add a new task/goal.

---

### Screen: `Today/AddTaskModal`

* **File Path:** `components/today/AddTaskModal.tsx`
* **Purpose:** Modal for adding a new daily task.
* **Data Displayed:**
  - Task input fields.
* **State Management:**
  - Local form state.
* **User Actions:**
  - `onAdd()`: Submits new task.
  - `onClose()`: Closes modal.

---

### Screen: `Today/QuestCard`

* **File Path:** `components/today/QuestCard.tsx`
* **Purpose:** Displays a single daily quest/task with completion and delete options.
* **Data Displayed:**
  - Task title, description, status, and target date.
* **State Management:**
  - Props: `quest`, `completed`.
* **User Actions:**
  - `onToggle()`: Marks task as complete/incomplete.
  - `onDelete()`: Deletes the task.

---

### Screen: `Today/WellnessCard`

* **File Path:** `components/today/WellnessCard.tsx`
* **Purpose:** Displays wellness tips or reminders, possibly with notification integration.
* **Data Displayed:**
  - Wellness content.
* **State Management:** None.
* **User Actions:** None.

---

### Screen: `Quests/QuestCard`

* **File Path:** `components/quests/QuestCard.tsx`
* **Purpose:** Displays a single goal/epic quest with status and delete options.
* **Data Displayed:**
  - Goal title, description, category, status, and target date.
* **State Management:**
  - Props: `goal`, `completed`.
* **User Actions:**
  - `onDelete()`: Deletes the goal.

---

### Screen: `Quests/CreateQuestModal`

* **File Path:** `components/quests/CreateQuestModal.tsx`
* **Purpose:** Modal for creating a new quest/goal.
* **Data Displayed:**
  - Goal input fields.
* **State Management:**
  - Local form state.
* **User Actions:**
  - `onCreate()`: Submits new goal.
  - `onClose()`: Closes modal.

---

### Screen: `Quests/QuestPath`

* **File Path:** `components/quests/QuestPath.tsx`
* **Purpose:** Visualizes the user's progress along a quest path using SVG.
* **Data Displayed:**
  - Progress path and quest nodes.
* **State Management:**
  - Props: `quests` (array of quest progress).
* **User Actions:** None.

---

### Screen: `Zik/ChatBubble`

* **File Path:** `components/zik/ChatBubble.tsx`
* **Purpose:** Displays a single chat message in the conversation with Zik.
* **Data Displayed:**
  - Message content, sender, typing indicator.
* **State Management:**
  - Props: `message`, `isTyping`.
* **User Actions:** None.

---

### Screen: `Zik/SuggestionChip`

* **File Path:** `components/zik/SuggestionChip.tsx`
* **Purpose:** Displays a tappable suggestion chip for quick chat replies.
* **Data Displayed:**
  - Suggestion text.
* **State Management:**
  - Props: `text`.
* **User Actions:**
  - `onPress()`: Sends the suggestion as a chat message.

---

### Screen: `UI/TypingCursor`

* **File Path:** `components/ui/TypingCursor.tsx`
* **Purpose:** Animated blinking cursor for typewriter/chat effects.
* **Data Displayed:**
  - Blinking cursor.
* **State Management:**
  - Props: `isVisible`, `color`.
* **User Actions:** None.

---

## 7. Key Reusable Components

* **`<QuestCard />`:** Displays a single goal or task with status, category, and delete options (`components/quests/QuestCard.tsx`, `components/today/QuestCard.tsx`).
* **`<CreateQuestModal />`:** Modal for creating new goals/quests (`components/quests/CreateQuestModal.tsx`).
* **`<AddTaskModal />`:** Modal for adding new daily tasks (`components/today/AddTaskModal.tsx`).
* **`<EmptyStateCard />`:** Shows a friendly message and action when there are no tasks/goals (`components/today/EmptyStateCard.tsx`).
* **`<GreetingHeader />`:** Personalized greeting and progress ring for the day (`components/today/GreetingHeader.tsx`).
* **`<WellnessCard />`:** Wellness tips/reminders, with notification integration (`components/today/WellnessCard.tsx`).
* **`<ChatBubble />`:** Renders a chat message in the conversation with Zik (`components/zik/ChatBubble.tsx`).
* **`<SuggestionChip />`:** Tappable suggestion for chat quick replies (`components/zik/SuggestionChip.tsx`).
* **`<TypingCursor />`:** Animated blinking cursor for chat/typewriter effects (`components/ui/TypingCursor.tsx`).
* **`<LogoImage />`:** Renders the app logo in various sizes and variants (`components/onboarding/LogoImage.tsx`).
* **`<QuestPath />`:** SVG-based visualization of quest progress (`components/quests/QuestPath.tsx`).

---

**Note:** This documentation is based strictly on the provided source code and file summaries. For a full redesign, further exploration of navigation, screen composition, and business logic may be required.
