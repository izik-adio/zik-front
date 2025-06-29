# Zik Frontend Architecture Documentation

*Last Updated: June 29, 2025*

## 1. Project Overview

- **Application Name:** Zik - AI Life Companion
- **Purpose:** Zik is a personal wellness companion app that helps users achieve their goals through mindful practices, daily tasks, Epic Quests (long-term goals), and AI-powered chat guidance.
- **Core Tech Stack:**
  - React Native (0.79.4)
  - Expo (53.0.12)
  - TypeScript (5.x)
  - Zustand (state management with persistence)
  - React Context (auth, theme, query providers)
  - Expo Router (file-based routing)
  - @tanstack/react-query (server state management)
  - AsyncStorage (local persistence)
  - AWS Cognito (authentication)
  - Lucide React Native (icons)
  - React Native Reanimated (animations)

## 2. Directory Structure Overview

```
/app                    # Expo Router pages & navigation
├── (tabs)/            # Tab navigation screens
│   ├── index.tsx      # Today/Daily Tasks screen
│   ├── zik.tsx        # AI Chat interface
│   ├── quests.tsx     # Epic Quests management
│   └── profile.tsx    # User profile & settings
├── auth/              # Authentication flow
│   ├── login.tsx      # Login screen
│   └── signup.tsx     # Registration screen
├── epic/              # Epic Quest details
│   └── [id].tsx       # Dynamic Epic Quest detail page
├── onboarding/        # User onboarding flow
│   └── index.tsx      # Multi-step onboarding
├── profile/           # Profile-related screens
│   └── settings.tsx   # Profile settings
├── _layout.tsx        # Root layout
└── +not-found.tsx     # 404 page

/src                    # Core application logic
├── /api               # API service layer (quests, profile, axios config)
├── /components        # Shared components (ProfileGuard)
├── /context           # React Context providers (Auth, Profile, Theme, Query)
├── /services          # External service integrations (API, Cognito, ChatHistory)
├── /store             # Zustand stores (chatStore, questStore)
├── /types             # TypeScript type definitions
└── /utils             # Helper functions (JWT, storage, sound, reset)

/components             # Feature-specific UI components
├── /onboarding        # Onboarding flow components
├── /profile           # Profile-specific components
├── /quests            # Quest management components (Epic & Daily)
├── /today             # Daily tasks & wellness components
├── /ui                # Generic UI components (animations, modals, etc.)
├── /zik               # AI chat interface components
└── Analytics.tsx      # Analytics component

/hooks                  # Custom React hooks
├── useFrameworkReady.ts
├── useNetworkStatus.ts
└── useTypewriter.ts

/assets                 # Static assets
├── /icons             # App icons (iOS/Android)
├── /sounds            # Audio files
└── images             # App images & logos
```

## 3. State Management Strategy

- **Primary Library:** Zustand with AsyncStorage persistence
- **Core Concepts:**
  - `useQuestStore` (Zustand): Manages both Daily Quests (tasks) and Epic Quests (long-term goals)
    - **Daily Quests**: Today's tasks, completion tracking, CRUD operations
    - **Epic Quests**: Long-term goals with milestones, roadmap generation, progress tracking
    - **Roadmap Cache**: Caches generated roadmaps for Epic Quests
    - **Actions**: fetch, create, update, delete, complete for both quest types
  - `useChatStore` (Zustand): Handles AI chat functionality
    - **Messages**: Chat history with user and AI (Zik) messages
    - **Streaming**: Real-time AI response streaming
    - **Actions**: sendMessage, clearMessages, refreshQuests integration
  - **React Contexts**: 
    - `AuthContext`: User authentication, AWS Cognito integration
    - `ProfileContext`: User profile data and preferences
    - `ThemeContext`: App theming and color schemes
    - `QueryProvider`: React Query client configuration

- **Data Flow:**
  1. UI triggers an action (e.g., create Epic Quest, send chat message)
  2. Zustand store method calls the appropriate API layer
  3. On success, store updates state and persists to AsyncStorage
  4. Subscribed components re-render with new data
  5. Real-time updates via streaming (chat) or optimistic updates (quests)

## 4. API / Service Layer

- **Location:**
  - `src/api/quests.ts` - Daily Quests and Epic Quests CRUD operations
  - `src/api/profile.ts` - User profile management
  - `src/services/api.ts` - Core HTTP client with authentication
  - `src/services/cognito.ts` - AWS Cognito authentication service
  - `src/services/chatHistory.ts` - Chat message persistence

- **Key API Functions:**
  - **Daily Quests API:**
    - `dailyQuestsApi.getTodaysQuests()` - Fetch today's daily quests
    - `dailyQuestsApi.createQuest(data)` - Create a new daily quest
    - `dailyQuestsApi.updateQuest(id, data)` - Update a daily quest
    - `dailyQuestsApi.deleteQuest(id)` - Delete a daily quest
    - `dailyQuestsApi.completeQuest(id)` - Mark daily quest as complete
  
  - **Epic Quests API:**
    - `epicQuestsApi.getEpicQuests()` - Fetch all epic quests
    - `epicQuestsApi.createEpicQuest(data)` - Create a new epic quest
    - `epicQuestsApi.updateEpicQuest(id, data)` - Update an epic quest
    - `epicQuestsApi.deleteEpicQuest(id)` - Delete an epic quest
    - `roadmapApi.generateRoadmap(questId, description)` - Generate AI roadmap for epic quest
  
  - **Profile API:**
    - `profileApi.getProfile()` - Fetch user profile
    - `profileApi.updateProfile(data)` - Update user profile
    - `profileApi.updatePreferences(preferences)` - Update user preferences
  
  - **Chat/AI API:**
    - `apiService.postChatMessage(message, onChunk, onComplete, onError)` - Send chat message with streaming response
    - `apiService.refreshQuests()` - Trigger quest refresh after AI suggestions

- **Authentication:**
  - JWT token-based authentication via AWS Cognito
  - Automatic token refresh and request interceptors
  - Secure storage of authentication tokens

## 5. Navigation Flow

- **Root Navigator:** Expo Router with Stack Navigation
- **Authentication Flow:** Handled by `AuthContext` and route guards
- **Main Tabs:** Defined in `app/(tabs)/_layout.tsx`:
  - **Today** (`index.tsx`) – Daily tasks, wellness tracking, milestone focus
  - **Zik** (`zik.tsx`) – AI chat interface with conversation history
  - **Quests** (`quests.tsx`) – Epic Quests management and roadmap visualization
  - **Profile** (`profile.tsx`) – User profile, settings, and preferences

- **Nested Navigation:**
  - **Auth Stack:** (`app/auth/`) – Login and signup screens
  - **Onboarding Flow:** (`app/onboarding/`) – Multi-step user onboarding
  - **Epic Quest Details:** (`app/epic/[id].tsx`) – Dynamic epic quest detail pages
  - **Profile Settings:** (`app/profile/settings.tsx`) – Advanced profile configuration
  - **Not Found:** (`app/+not-found.tsx`) – 404 error handling

- **Route Protection:**
  - `ProfileGuard` component ensures user profile is loaded
  - Authentication redirects handled by `AuthContext`
  - Onboarding flow managed by user state

## 6. Screen & Component Breakdown

---

### Screen: `TodayScreen` (Daily Hub)

- **File Path:** `app/(tabs)/index.tsx`
- **Purpose:** Central hub for daily activities, wellness tracking, and milestone focus
- **Data Displayed:**
  - Today's daily quests and completion status
  - Current milestone focus from active Epic Quests
  - Wellness cards and goal progress overview
  - Personalized greeting and motivational content
- **State Management:**
  - `useQuestStore` for daily quests and epic quest milestones
  - Local state for modals and interactions
- **User Actions:**
  - Create, complete, and manage daily quests
  - Focus on specific milestones
  - Access wellness breaks and activities
  - Navigate to detailed quest management
- **Key Components:**
  - `<SimpleGreetingHeader />` - Personalized daily greeting
  - `<TodaysFocusSection />` - Current milestone focus
  - `<ProgressiveTaskList />` - Today's quests with completion tracking
  - `<GoalsOverviewCard />` - Epic quest progress overview
  - `<SimpleWellnessCard />` - Wellness tips and activities
  - `<MilestoneFocusCard />` - Active milestone tracking
  - `<AddTaskModal />` - Quest creation modal
  - `<WellnessBreakModal />` - Wellness activity suggestions

---

### Screen: `ZikScreen` (AI Chat Interface)

- **File Path:** `app/(tabs)/zik.tsx`
- **Purpose:** AI-powered conversational interface for guidance, reflection, and quest assistance
- **Data Displayed:**
  - Real-time chat conversation history
  - Streaming AI responses
  - Contextual suggestion chips
  - Quest-related recommendations
- **State Management:**
  - `useChatStore` for message history and streaming
  - Integration with `useQuestStore` for quest context
- **User Actions:**
  - Send messages to AI companion
  - Select from suggested conversation starters
  - Receive and act on quest recommendations
  - Clear conversation history
- **Key Components:**
  - `<ChatBubble />` - Individual message display (user/AI)
  - `<SuggestionChip />` - Quick conversation starters
  - `<TypingCursor />` - AI typing indicator
  - Chat input with real-time streaming
  - Message history with persistence

---

### Screen: `QuestsScreen` (Epic Quests Management)

- **File Path:** `app/(tabs)/quests.tsx`
- **Purpose:** Comprehensive Epic Quest management with roadmap visualization
- **Data Displayed:**
  - List of active and completed Epic Quests
  - Quest progress and milestone tracking
  - AI-generated roadmaps and timelines
  - Quest creation and editing interface
- **State Management:**
  - `useQuestStore` for Epic Quest CRUD operations
  - Roadmap caching and generation
- **User Actions:**
  - Create new Epic Quests with AI assistance
  - View and navigate quest roadmaps
  - Update quest progress and milestones
  - Delete or archive completed quests
- **Key Components:**
  - `<EpicQuestCard />` - Individual epic quest display
  - `<RoadmapVisualizer />` - AI-generated roadmap visualization
  - `<QuestPath />` - Progress tracking visualization
  - `<CreateQuestModal />` - Epic quest creation with AI
  - `<EmptyStateCard />` - Onboarding for new users

---

### Screen: `ProfileScreen` (User Management)

- **File Path:** `app/(tabs)/profile.tsx`
- **Purpose:** User profile management, preferences, and app settings
- **Data Displayed:**
  - User profile information and avatar
  - Notification and privacy settings
  - App preferences and customization
  - Account management and support options
- **State Management:**
  - `useAuthContext` for authentication
  - `ProfileContext` for profile data
  - `useThemeContext` for app theming
- **User Actions:**
  - Edit profile information and preferences
  - Manage notification settings
  - Access app settings and support
  - Logout and account management
- **Key Components:**
  - `<ProfileSettingsScreen />` - Comprehensive settings management
  - Profile editing forms and validation
  - Settings toggles and preferences
  - Support and help sections

---

### Onboarding Flow Components

- **WelcomeScreen:** (`components/onboarding/WelcomeScreen.tsx`) - App introduction and value proposition
- **GoalsSelectionScreen:** (`components/onboarding/GoalsSelectionScreen.tsx`) - Initial goal and focus area selection
- **PermissionsScreen:** (`components/onboarding/PermissionsScreen.tsx`) - System permissions and notifications
- **AuthWelcomeScreen:** (`components/onboarding/AuthWelcomeScreen.tsx`) - Authentication flow entry point
- **SplashScreen:** (`components/onboarding/SplashScreen.tsx`) - Animated app loading and branding

## 7. Key Reusable Components

### Daily Tasks & Wellness Components (`components/today/`)
- **`<SimpleGreetingHeader />`** - Personalized daily greeting with user context
- **`<TodaysFocusSection />`** - Highlights current milestone or daily focus
- **`<ProgressiveTaskList />`** - Advanced task list with completion tracking
- **`<GoalsOverviewCard />`** - Epic quest progress summary and insights
- **`<SimpleWellnessCard />`** - Wellness tips, stats, and activity suggestions
- **`<MilestoneFocusCard />`** - Current milestone focus with progress tracking
- **`<AddTaskModal />`** - Modal for creating new daily quests
- **`<WellnessBreakModal />`** - Guided wellness activities and breaks
- **`<QuestCard />`** - Individual daily quest display with actions
- **`<EmptyStateCard />`** - Friendly prompts when no tasks exist

### Epic Quests Components (`components/quests/`)
- **`<EpicQuestCard />`** - Comprehensive epic quest display with progress
- **`<RoadmapVisualizer />`** - AI-generated roadmap visualization and navigation
- **`<QuestPath />`** - Visual progress tracking for quest milestones
- **`<CreateQuestModal />`** - Epic quest creation with AI assistance
- **`<QuestCard />`** - Simplified quest card for various contexts

### AI Chat Components (`components/zik/`)
- **`<ChatBubble />`** - Message display for user and AI conversations
- **`<SuggestionChip />`** - Interactive conversation starter suggestions

### UI & Animation Components (`components/ui/`)
- **`<TypingCursor />`** - Animated typing indicator for AI responses
- **`<CelebrationAnimation />`** - Quest completion celebrations
- **`<MilestoneCelebrationModal />`** - Milestone achievement celebrations
- **`<RoadmapStatusIndicator />`** - Visual quest progress indicators
- **`<SkeletonLoader />`** - Loading state placeholders
- **`<Toast />`** - App-wide notification system
- **`<DesktopBlocker />`** - Mobile-first experience enforcement
- **`<DesktopHandler />`** - Desktop experience optimization

### Profile Components (`components/profile/`)
- **`<ProfileSettingsScreen />`** - Comprehensive profile management interface

### Onboarding Components (`components/onboarding/`)
- **`<AuthWelcomeScreen />`** - Authentication flow welcome screen
- **`<GoalsSelectionScreen />`** - Initial goal and focus selection
- **`<LogoImage />`** - App branding and logo display
- **`<PermissionsScreen />`** - System permissions management
- **`<SplashScreen />`** - Animated app loading experience
- **`<WelcomeScreen />`** - App introduction and value proposition

### Shared Components (`src/components/`)
- **`<ProfileGuard />`** - Route protection ensuring profile data is loaded

### Analytics & Monitoring
- **`<Analytics />`** - App usage tracking and performance monitoring

## 8. Custom Hooks

### Core Hooks (`/hooks/`)
- **`useFrameworkReady`** - Ensures Expo framework is ready before app initialization
- **`useNetworkStatus`** - Monitors network connectivity and handles offline states
- **`useTypewriter`** - Creates typewriter text animation effects for AI responses

### Context Hooks (from `src/context/`)
- **`useAuth`** - Authentication state and methods from AuthContext
- **`useProfile`** - User profile data and management from ProfileContext  
- **`useTheme`** - App theming and color scheme management from ThemeContext

### Store Hooks (from `src/store/`)
- **`useQuestStore`** - Daily and Epic Quest state management
- **`useChatStore`** - AI chat messages and streaming functionality

## 9. Performance Optimizations

### State Management
- **Zustand with Persistence**: Efficient state management with AsyncStorage integration
- **Selective Re-renders**: Components only re-render when relevant state changes
- **Optimistic Updates**: Immediate UI updates with rollback on API failure

### API & Networking
- **React Query Integration**: Intelligent caching and background updates
- **Request Deduplication**: Prevents duplicate API calls
- **Offline Support**: AsyncStorage persistence for offline functionality
- **Streaming Responses**: Real-time AI chat with chunked responses

### UI & Animations
- **React Native Reanimated**: Hardware-accelerated animations
- **Lazy Loading**: Components and screens loaded on demand
- **Image Optimization**: Expo's optimized image handling
- **Memory Management**: Proper cleanup in useEffect hooks

### Bundle Optimization
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Compressed images and optimized bundle size
- **Code Splitting**: Logical separation of features and dependencies

## 10. Development Tools & Configuration

### Build Configuration
- **EAS Build**: Cloud-based build system for iOS and Android
- **Metro Config**: Custom bundler configuration for React Native
- **Babel Config**: JavaScript transpilation and plugin configuration
- **TypeScript Config**: Strict type checking and modern JavaScript features

### Code Quality
- **ESLint**: Code linting with Expo recommended rules
- **Prettier**: Code formatting consistency
- **TypeScript**: Type safety and enhanced developer experience

### Development Scripts
- **`npm run dev`**: Start development server with telemetry disabled
- **`npm run dev:dev-client`**: Development client mode for custom native code
- **`npm run build:android/ios`**: Platform-specific development builds
- **`npm run lint`**: Code quality checks

### Environment Management
- **Environment Variables**: Secure configuration management
- **Multiple Build Profiles**: Development, staging, and production configurations
- **AWS Integration**: Cognito authentication and API gateway connectivity

## 11. Security & Privacy

### Authentication Security
- **AWS Cognito Integration**: Enterprise-grade authentication service
- **JWT Token Management**: Secure token storage and automatic refresh
- **Biometric Authentication**: Optional device-based authentication (future)

### Data Protection
- **Encrypted Storage**: Sensitive data encrypted in AsyncStorage
- **API Security**: HTTPS-only communication with authenticated endpoints
- **Privacy by Design**: Minimal data collection and user consent

### App Security
- **Code Obfuscation**: Production builds with code protection
- **Certificate Pinning**: API communication security (future enhancement)
- **Secure Development**: Regular security audits and dependency updates

---

## 12. Deployment & Distribution

### Development Workflow
1. **Local Development**: Expo development server with hot reloading
2. **Testing**: Component testing and API integration validation
3. **Build**: EAS cloud builds for iOS and Android
4. **Distribution**: App Store and Google Play Store deployment

### Build Profiles
- **Development**: Development builds with debugging enabled
- **Preview**: Internal testing builds with production optimizations
- **Production**: Store-ready builds with full optimizations

### Continuous Integration
- **Automated Testing**: Unit tests and integration tests
- **Build Automation**: Automated builds on code changes
- **Quality Gates**: Code quality checks before deployment

*This documentation serves as a comprehensive guide to the Zik frontend architecture and should be updated as the application evolves.*
