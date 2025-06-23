# API Migration Guide

This document outlines the migration from the old API structure to the new AWS HTTP API v2 unified endpoints.

## Overview

The frontend has been refactored to use a unified `quests` API that interacts with the AWS HTTP API v2 backend. The new API consolidates both tasks and goals under a single `/quests` endpoint with different `type` parameters.

## New API Configuration

- **Base URL**: `https://dxc20i9fqg.execute-api.us-east-1.amazonaws.com`
- **Authentication**: Bearer token using Cognito AccessToken (not IdToken)
- **All requests require authentication**

## Key Changes

### 1. Unified API Structure

**Old Structure:**

```
/goals  -> for goal operations
/quests -> for quest operations
```

**New Structure:**

```
/quests -> for both tasks and goals (differentiated by type parameter)
```

### 2. Authentication Token Change

**Old:** Uses Cognito `IdToken`

```typescript
config.headers.Authorization = `Bearer ${tokens.IdToken}`;
```

**New:** Uses Cognito `AccessToken`

```typescript
config.headers.Authorization = `Bearer ${tokens.AccessToken}`;
```

### 3. Data Model Changes

#### Task Interface

```typescript
// Old
interface Quest {
  questId: string;
  title: string;
  description: string;
  status: string;
}

// New
interface Task {
  taskId: string;
  userId: string;
  taskName: string;
  description: string;
  dueDate: string; // YYYY-MM-DD format
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  goalId?: string; // Optional link to a goal
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}
```

#### Goal Interface

```typescript
// Old
interface Goal {
  goalId: string;
  title: string;
  category: string;
  status: string;
}

// New
interface Goal {
  goalId: string;
  userId: string;
  goalName: string;
  description: string;
  targetDate: string; // YYYY-MM-DD format
  category: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}
```

## New API Methods

### Core Methods

#### `fetchTasksByDate(date: string)`

Fetches tasks for a specific date in YYYY-MM-DD format.

```typescript
const tasks = await questsApi.fetchTasksByDate('2025-06-23');
```

#### `createQuest(questData: CreateQuestData)`

Creates a new task or goal based on the `type` field.

```typescript
// Create a task
const task = await questsApi.createQuest({
  title: 'Complete documentation',
  dueDate: '2025-06-24',
  type: 'task',
  description: 'Write API docs',
  priority: 'high',
});

// Create a goal
const goal = await questsApi.createQuest({
  title: 'Learn TypeScript',
  dueDate: '2025-12-31',
  type: 'goal',
  description: 'Master TypeScript fundamentals',
  category: 'learning',
});
```

#### `updateQuest(questId: string, type: 'task' | 'goal', updateData: UpdateQuestData)`

Updates a task or goal.

```typescript
const updatedTask = await questsApi.updateQuest('task-123', 'task', {
  status: 'completed',
  description: 'Updated description',
});
```

#### `deleteQuest(questId: string, type: 'task' | 'goal')`

Deletes a task or goal.

```typescript
await questsApi.deleteQuest('task-123', 'task');
```

### Convenience Methods

The API provides convenience methods for common operations:

```typescript
// Task operations
const tasks = await questsApi.fetchTodayTasks();
const task = await questsApi.createTask({
  title: 'New task',
  dueDate: '2025-06-24',
  description: '',
  priority: 'medium',
});
const updatedTask = await questsApi.updateTask('task-123', {
  status: 'completed',
});
await questsApi.deleteTask('task-123');
await questsApi.completeTask('task-123');

// Goal operations
const goal = await questsApi.createGoal({
  title: 'New goal',
  dueDate: '2025-12-31',
  description: '',
  category: 'personal',
});
const updatedGoal = await questsApi.updateGoal('goal-123', {
  status: 'completed',
});
await questsApi.deleteGoal('goal-123');
await questsApi.completeGoal('goal-123');
```

## Error Handling

The new API includes comprehensive error handling:

### ApiError Class

```typescript
class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}
```

### Automatic Token Refresh

The API automatically handles token refresh on 401 errors and retries the original request.

### Retry Logic

Requests are automatically retried for 5xx server errors with exponential backoff.

### Usage Example

```typescript
try {
  const tasks = await questsApi.fetchTasksByDate('2025-06-23');
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.status}: ${error.message}`);
    if (error.status === 401) {
      // Handle authentication error
    } else if (error.status === 404) {
      // Handle not found
    }
  }
}
```

## Migration Steps for Components

### 1. Update Imports

```typescript
// Old
import { goalsApi, Goal } from '@/src/api/goals';
import { questsApi, Quest } from '@/src/api/quests';

// New
import { questsApi, Goal, Task } from '@/src/api/quests';
```

### 2. Update API Calls

#### Creating Items

```typescript
// Old - Goals
await goalsApi.createGoal({
  title: 'Learn React',
  description: 'Master React fundamentals',
  category: 'learning',
});

// New - Goals
await questsApi.createGoal({
  title: 'Learn React',
  description: 'Master React fundamentals',
  category: 'learning',
  dueDate: '2025-12-31', // Required in new API
});

// Old - Quests
await questsApi.createQuest({
  title: 'Daily task',
  description: 'Complete today',
});

// New - Tasks
await questsApi.createTask({
  title: 'Daily task',
  description: 'Complete today',
  dueDate: '2025-06-24', // Required in new API
  priority: 'medium', // Required in new API
});
```

#### Fetching Items

```typescript
// Old
const goals = await goalsApi.getGoals();
const quests = await questsApi.getQuests();

// New
const todayTasks = await questsApi.fetchTodayTasks();
const specificDateTasks = await questsApi.fetchTasksByDate('2025-06-24');

// Note: The new API doesn't have a generic "get all goals" endpoint
// Goals are fetched based on specific criteria (date-based queries will be added)
```

#### Updating Items

```typescript
// Old
await goalsApi.updateGoal('goal-123', { status: 'completed' });

// New
await questsApi.updateGoal('goal-123', { status: 'completed' });
// OR using convenience method
await questsApi.completeGoal('goal-123');
```

### 3. Update Property Names

#### Goal Properties

```typescript
// Old
goal.title → goal.goalName
goal.id → goal.goalId

// New Interface
interface Goal {
  goalId: string;    // Changed from id
  goalName: string;  // Changed from title
  targetDate: string; // Changed from dueDate
  // ... other properties
}
```

#### Task Properties

```typescript
// Old
quest.questId → task.taskId
quest.title → task.taskName

// New Interface
interface Task {
  taskId: string;    // Changed from questId
  taskName: string;  // Changed from title
  dueDate: string;   // Required format: YYYY-MM-DD
  priority: 'low' | 'medium' | 'high'; // Enum values
  status: 'pending' | 'in-progress' | 'completed'; // Enum values
  // ... other properties
}
```

## Backward Compatibility

The `goals.ts` file provides a backward compatibility wrapper that logs deprecation warnings. This allows existing components to continue working while you migrate to the new API.

```typescript
// This still works but shows deprecation warnings
import { goalsApi } from '@/src/api/goals';
const goals = await goalsApi.getGoals(); // Logs: "goalsApi.getGoals is deprecated..."
```

## Development Mode

In development mode (`EXPO_PUBLIC_DEV_MODE=true`), the API returns mock data:

- **Task fetching**: Returns sample tasks for any date
- **Quest creation**: Returns mock created objects
- **All operations**: Work offline with mock responses

## Testing

Comprehensive tests are provided in `src/api/__tests__/quests-new.test.ts` covering:

- All API methods
- Error handling scenarios
- Token refresh logic
- Retry mechanisms
- Input validation

Run tests with:

```bash
npm test src/api/__tests__/quests-new.test.ts
```

## Future Enhancements

1. **Goal Querying**: Backend will add support for fetching goals by date range
2. **Batch Operations**: Support for bulk create/update/delete operations
3. **Real-time Updates**: WebSocket support for live updates
4. **Offline Support**: Enhanced offline capabilities with sync

## Migration Checklist

- [ ] Update all component imports to use the new API
- [ ] Replace old property names (title → goalName/taskName, etc.)
- [ ] Add required fields (dueDate, priority) to creation calls
- [ ] Update React Query keys and mutations
- [ ] Test all CRUD operations
- [ ] Verify error handling works correctly
- [ ] Test token refresh functionality
- [ ] Remove deprecated API usage warnings
- [ ] Update component tests

## Support

For questions or issues during migration:

1. Check the comprehensive test suite for usage examples
2. Review the TypeScript interfaces for property names
3. Use the browser dev tools to inspect API calls
4. Enable development mode for offline testing

The new API provides better type safety, error handling, and aligns with the AWS HTTP API v2 backend architecture.
