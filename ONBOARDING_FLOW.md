# Professional Onboarding Flow

## New Professional Flow Structure

### 1. **Splash Screen**

- App branding with animated logo
- Sets the premium tone for the app
- Duration: ~2.5 seconds

### 2. **Auth Welcome Screen** (Entry Point)

- Professional welcome with clear call-to-actions
- Options: "Get Started" (Sign Up), "Welcome Back" (Login)
- Tracks user's first interaction with the app

### 3. **Authentication Flow**

- Sign Up → Email Confirmation → Login
- Or Direct Login for returning users

### 4. **Onboarding Flow** (Post-Auth)

- **Welcome Screen**: App introduction and value proposition
- **Goals Selection**: Personalized experience setup
- **Permissions Screen**: System permissions (notifications)

### 5. **Main Application**

- User enters the main app experience

## Flow Paths

### New User Path:

```
Splash → AuthWelcome → SignUp → Confirmation → Login → Welcome → Goals → Permissions → Main App
```

### Returning User Path:

```
Splash → AuthWelcome → Login → Main App
```

## Professional Benefits

1. **Auth-First Approach**: Industry standard, builds trust
2. **Clear User Journey**: Each step has a specific purpose
3. **Personalization**: Goals selection after commitment (auth)
4. **Proper State Management**: Tracks user progress through flags

## Storage Flags Used

- `hasSeenAuthWelcome`: User has seen the initial auth screen
- `hasOnboarded`: User completed the onboarding flow
- `selectedGoals`: User's selected goals for personalization

## Why This Flow Works

1. **Professional**: Matches enterprise app patterns
2. **Conversion Optimized**: Auth commitment before extensive setup
3. **User-Friendly**: Clear progression with skip options
4. **Scalable**: Easy to add/remove onboarding steps
5. **Analytics-Ready**: Each step can be tracked for optimization
