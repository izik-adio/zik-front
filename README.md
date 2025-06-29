# 🎯 Zik - AI Life Companion

<div align="center">
  <img src="./assets/transparent zik.png" alt="Zik Logo" width="120" height="120">
  
  <p align="center">
    <strong>A personal wellness companion app that helps you achieve your goals through mindful practices, daily tasks, and AI-powered guidance.</strong>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React%20Native-0.79.4-blue.svg" alt="React Native">
    <img src="https://img.shields.io/badge/Expo-53.0.12-000020.svg" alt="Expo">
    <img src="https://img.shields.io/badge/TypeScript-5.x-blue.svg" alt="TypeScript">
    <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey.svg" alt="Platform">
  </p>
</div>

## ✨ Features

- 🎯 **Epic Quests**: Transform your long-term goals into manageable, structured journeys
- 📱 **Daily Tasks**: Stay on track with personalized daily objectives and habits
- 🤖 **AI Chat Companion**: Get guidance and motivation through intelligent conversations
- 🏆 **Progress Tracking**: Visualize your achievements with beautiful progress indicators
- 🧘 **Wellness Integration**: Mindful practices built into your daily routine
- 🎨 **Beautiful UI**: Modern, intuitive interface with smooth animations
- 🔐 **Secure Authentication**: AWS Cognito integration for secure user management
- 📊 **Analytics**: Track your progress and gain insights into your habits

## 🏗️ Tech Stack

### Core Technologies
- **React Native** (0.79.4) - Cross-platform mobile development
- **Expo** (53.0.12) - Development platform and tools
- **TypeScript** - Type-safe JavaScript
- **Expo Router** - File-based routing system

### State Management & Data
- **Zustand** - Lightweight state management
- **React Query** (@tanstack/react-query) - Server state management and caching
- **React Context** - Theme, authentication, and global state
- **AsyncStorage** - Local data persistence

### UI & Animations
- **React Native Reanimated** - Smooth animations
- **Expo Linear Gradient** - Beautiful gradients
- **Lucide React Native** - Modern icon library
- **React Native Gesture Handler** - Touch interactions

### Backend Integration
- **AWS SDK** - Cloud services integration
- **Axios** - HTTP client for API calls
- **JWT Decode** - Token management
- **AWS Cognito** - Authentication service

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **iOS Simulator** (for iOS development)
- **Android Studio** (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/zik-front.git
   cd zik-front
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

### Development Commands

```bash
# Start development server
npm run dev

# Start with development client
npm run dev:dev-client

# Build for Android
npm run build:android

# Build for iOS
npm run build:ios

# Build for web
npm run build:web

# Run linter
npm run lint
```

## 📱 Platform Support

- **iOS**: iPhone and iPad support
- **Android**: Android 6.0+ (API level 23+)
- **Web**: Progressive Web App capabilities

## 🏛️ Architecture

### Directory Structure

```
app/                    # Expo Router pages
├── (tabs)/            # Tab navigation screens
├── auth/              # Authentication screens
├── epic/              # Epic quest details
├── onboarding/        # User onboarding flow
└── profile/           # User profile screens

components/            # Reusable UI components
├── onboarding/        # Onboarding-specific components
├── profile/           # Profile-specific components
├── quests/            # Quest management components
├── today/             # Daily task components
├── ui/                # Generic UI components
└── zik/               # AI chat components

src/                   # Core application logic
├── api/               # API client and endpoints
├── components/        # Shared components
├── context/           # React Context providers
├── services/          # External service integrations
├── store/             # Zustand stores
├── types/             # TypeScript type definitions
└── utils/             # Utility functions

hooks/                 # Custom React hooks
assets/                # Static assets (images, sounds, icons)
```

### Key Features Implementation

#### 🎯 Epic Quests System
- **Quest Creation**: Build complex, multi-step goals
- **Milestone Tracking**: Break down quests into manageable milestones
- **Progress Visualization**: Beautiful roadmap and progress indicators
- **AI Guidance**: Get personalized suggestions for quest completion

#### 🤖 AI Chat Integration
- **Contextual Conversations**: AI understands your goals and progress
- **Motivational Support**: Encouraging messages and guidance
- **Smart Suggestions**: Personalized recommendations based on your data
- **Chat History**: Persistent conversation storage

#### 📊 Progress & Analytics
- **Real-time Updates**: Live progress tracking across all features
- **Visual Feedback**: Animations and celebrations for achievements
- **Habit Tracking**: Monitor daily habits and streaks
- **Performance Insights**: Understand your productivity patterns

## 🔐 Security & Privacy

- **AWS Cognito** authentication with secure token management
- **JWT-based** session management
- **Encrypted storage** for sensitive data
- **Privacy-first** design with minimal data collection
- **Secure API** communication with proper authentication headers

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 🚀 Deployment

### Development Build
```bash
# Android development build
npm run build:android

# iOS development build
npm run build:ios
```

### Production Build
```bash
# Production builds via EAS
eas build --platform android --profile production
eas build --platform ios --profile production
```

## 📈 Performance Optimization

- **React Query** for efficient data fetching and caching
- **Lazy loading** for screens and components
- **Image optimization** with Expo's image handling
- **Bundle splitting** for faster app startup
- **Memory management** with proper cleanup in useEffect hooks

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/) and [React Native](https://reactnative.dev/)
- Icons by [Lucide](https://lucide.dev/)
- Powered by [AWS](https://aws.amazon.com/) cloud services
- UI inspiration from modern mobile design patterns

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/zik-front/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/zik-front/discussions)

---

<div align="center">
  <p>Made with ❤️ for personal growth and wellness</p>
  <p>© 2025 Zik. All rights reserved.</p>
</div>
