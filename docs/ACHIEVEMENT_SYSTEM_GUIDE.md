# Poop Achievement System - Implementation Guide

## Overview

This guide outlines the architecture and implementation steps for a rule-based achievement system that automatically awards badges when users complete poop sessions that meet specific criteria.

## Architecture

### High-Level Flow

```
User creates poop sesh
    ↓
Backend hook triggered (OnRecordAfterCreateSuccess)
    ↓
Achievement service evaluates rules
    ↓
Award badges that match criteria
    ↓
Notify user of new achievements
```

### Components

1. **Achievement Rule Definitions** - JSON structure defining criteria
2. **Achievement Service** - Core logic for rule evaluation
3. **Backend Hook** - Trigger point when poop_seshes are created
4. **User Achievements Collection** - Junction table tracking earned badges
5. **Frontend Queries/Mutations** - React Query hooks for fetching/displaying

---

## Database Schema

### Existing: `achievements` Collection

```typescript
{
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  criteria: JSON; // ← This is where rules go
}
```

### New: `user_achievements` Collection

Create a junction table to track which users have earned which achievements:

```typescript
{
  id: string;
  user: relation<users>;           // Link to user
  achievement: relation<achievements>; // Link to achievement
  earned_at: datetime;              // When they earned it
  poop_sesh: relation<poop_seshes>; // Optional: which sesh earned it
}
```

**Why this approach?**
- Separates achievement definitions from user progress
- Allows same achievement to be earned by multiple users
- Enables tracking when/how achievements were earned
- Easy to query "all achievements for user X" or "all users with achievement Y"

---

## Achievement Rule Structure

### JSON Criteria Format

Store rules in the `criteria` JSON field using a flexible, extensible format:

```json
{
  "type": "simple",
  "conditions": [
    {
      "field": "bristol_score",
      "operator": "equals",
      "value": 4
    }
  ]
}
```

### Rule Types

#### 1. **Simple Rules** (single condition)

```json
{
  "type": "simple",
  "conditions": [
    {
      "field": "bristol_score",
      "operator": "equals",
      "value": 7
    }
  ]
}
```

#### 2. **Compound Rules** (multiple conditions with AND/OR)

```json
{
  "type": "compound",
  "operator": "AND",
  "conditions": [
    {
      "field": "bristol_score",
      "operator": "equals",
      "value": 4
    },
    {
      "field": "duration_minutes",
      "operator": "greater_than",
      "value": 30
    }
  ]
}
```

#### 3. **Historical Rules** (based on past behavior)

```json
{
  "type": "historical",
  "condition": {
    "metric": "total_count",
    "operator": "greater_than_or_equal",
    "value": 100
  }
}
```

#### 4. **Streak Rules**

```json
{
  "type": "streak",
  "condition": {
    "metric": "consecutive_days",
    "operator": "greater_than_or_equal",
    "value": 7
  }
}
```

#### 5. **Time-based Rules**

```json
{
  "type": "time_based",
  "condition": {
    "field": "time_of_day",
    "operator": "between",
    "value": ["06:00", "08:00"]
  }
}
```

### Supported Operators

```typescript
type Operator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal"
  | "between"
  | "in"
  | "contains";
```

### Supported Fields (from poop_seshes)

- `bristol_score` (1-7)
- `duration_minutes`
- `rating` (place rating)
- `time_of_day` (extracted from created timestamp)
- `location_type` (home, public, etc.)
- `day_of_week`

---

## Service Implementation

### File: `lib/achievement-service.ts`

#### Core Functions

```typescript
// Main entry point
evaluateAchievements(userId: string, poopSesh: PoopSesh): Promise<Achievement[]>

// Rule evaluation
evaluateRule(criteria: AchievementCriteria, context: EvaluationContext): boolean

// Check if user already has achievement
hasAchievement(userId: string, achievementId: string): Promise<boolean>

// Award achievement
awardAchievement(userId: string, achievementId: string, poopSeshId: string): Promise<void>
```

#### Evaluation Context

The context object passed to rule evaluators should include:

```typescript
interface EvaluationContext {
  currentSesh: PoopSesh;           // The sesh being evaluated
  userHistory: {
    totalCount: number;
    consecutiveDays: number;
    allSeshes: PoopSesh[];         // For complex historical queries
  };
  userAchievements: string[];      // Already earned achievement IDs
}
```

---

## Implementation Steps

### Step 1: Create Database Migration

**File:** `pocketbase/base/migrations/XXXXXX_user_achievements.go`

1. Create `user_achievements` collection
2. Add fields: user (relation), achievement (relation), earned_at (date), poop_sesh (relation)
3. Set up indexes on user + achievement (for quick "does user have this?" queries)
4. Add unique constraint on [user, achievement] to prevent duplicates

### Step 2: Define TypeScript Types

**File:** `lib/types.ts`

```typescript
// Add these interfaces
interface AchievementCriteria {
  type: 'simple' | 'compound' | 'historical' | 'streak' | 'time_based';
  operator?: 'AND' | 'OR';
  conditions?: Condition[];
  condition?: HistoricalCondition | StreakCondition | TimeCondition;
}

interface Condition {
  field: string;
  operator: Operator;
  value: any;
}

// Add more specific types as needed
```

### Step 3: Build Achievement Service (Frontend)

**File:** `lib/achievement-service.ts`

**Purpose:** Helper functions for frontend to fetch and display achievements.

```typescript
// Functions you'll need:
// - getUserAchievements(userId): Get all achievements for a user
// - getAchievementProgress(userId, achievementId): Calculate progress toward achievement
// - formatAchievementCriteria(criteria): Human-readable description
```

**Note:** This is separate from the backend service that awards achievements.

### Step 4: Backend Hook for Auto-Awarding

**File:** `pocketbase/base/main.go`

Add to existing `OnRecordAfterCreateSuccess("poop_seshes")` hook:

```go
// After creating poop_sesh:
// 1. Fetch all achievements from database
// 2. For each achievement:
//    a. Check if user already has it
//    b. Evaluate criteria against new sesh + user history
//    c. If matched, create user_achievement record
// 3. Send notification if any new achievements awarded
```

**Implementation approach:**
- Create Go helper functions for rule evaluation
- Query user's poop_sesh history for historical rules
- Use PocketBase's API to create user_achievement records
- Optionally: send push notification or create in-app notification

### Step 5: React Query Hooks

**File:** `hooks/api/useAchievementQueries.tsx`

```typescript
// Queries you'll need:
export const useGetUserAchievements = (userId: string) => {...}
export const useGetAllAchievements = () => {...}
export const useGetAchievementProgress = (userId: string) => {...}
```

**File:** `hooks/api/useAchievementMutations.tsx`

```typescript
// Probably won't need many mutations since backend auto-awards
// But maybe:
export const useManualAwardAchievement = () => {...} // For testing/admin
```

### Step 6: Populate Achievements with Criteria

**Script:** `scripts/populate-achievements.ts`

Create a script to update existing achievements with criteria JSON:

```typescript
const achievementRules = [
  {
    id: 'perfect_poop',
    criteria: {
      type: 'simple',
      conditions: [{ field: 'bristol_score', operator: 'equals', value: 4 }]
    }
  },
  {
    id: 'century_club',
    criteria: {
      type: 'historical',
      condition: { metric: 'total_count', operator: 'greater_than_or_equal', value: 100 }
    }
  },
  // ... more achievements
];

// Update each achievement record with its criteria
```

### Step 7: Frontend UI Components

**Components to build:**

1. **AchievementBadge** - Display single achievement with icon
2. **AchievementList** - Grid/list of all achievements (locked/unlocked)
3. **AchievementProgress** - Progress bar for achievements
4. **NewAchievementModal** - Celebration popup when earned
5. **AchievementDetails** - Full screen with description and rarity

**Where to add:**
- Profile screen: Show user's earned achievements
- Post-poop screen: Show newly earned achievements
- Dedicated achievements tab/screen

---

## Testing Strategy

### Unit Tests

**Rule Evaluation:**
```typescript
describe('Achievement Service', () => {
  it('should award Perfect Poop for bristol_score 4', () => {
    // Test each rule type in isolation
  });

  it('should handle compound AND conditions', () => {
    // Test complex rules
  });
});
```

### Integration Tests

**Backend Hook:**
```go
// Test that creating poop_sesh triggers achievement check
// Test that user_achievement record is created when rules match
// Test that duplicate achievements aren't awarded
```

### Manual Testing Checklist

- [ ] Create poop sesh that matches achievement criteria
- [ ] Verify user_achievement record created
- [ ] Verify achievement shows in user profile
- [ ] Test edge cases (boundary values for bristol_score, etc.)
- [ ] Test historical rules (100th poop, 7-day streak, etc.)
- [ ] Test that same achievement isn't awarded twice

---

## Example Achievement Definitions

### Starter Achievements

```javascript
[
  {
    name: "First Drop",
    description: "Log your first poop!",
    criteria: {
      type: "historical",
      condition: {
        metric: "total_count",
        operator: "equals",
        value: 1
      }
    }
  },
  {
    name: "Perfect Poop",
    description: "Achieve the legendary Bristol 4",
    criteria: {
      type: "simple",
      conditions: [
        { field: "bristol_score", operator: "equals", value: 4 }
      ]
    }
  },
  {
    name: "Early Bird",
    description: "Poop between 6am and 8am",
    criteria: {
      type: "time_based",
      condition: {
        field: "time_of_day",
        operator: "between",
        value: ["06:00", "08:00"]
      }
    }
  },
  {
    name: "Marathon Session",
    description: "Spend 30+ minutes on the throne",
    criteria: {
      type: "simple",
      conditions: [
        { field: "duration_minutes", operator: "greater_than_or_equal", value: 30 }
      ]
    }
  },
  {
    name: "Century Club",
    description: "Log 100 poops",
    criteria: {
      type: "historical",
      condition: {
        metric: "total_count",
        operator: "greater_than_or_equal",
        value: 100
      }
    }
  },
  {
    name: "Consistency Champion",
    description: "Log poops for 7 consecutive days",
    criteria: {
      type: "streak",
      condition: {
        metric: "consecutive_days",
        operator: "greater_than_or_equal",
        value: 7
      }
    }
  }
]
```

---

## Optimization Considerations

### Performance

1. **Caching:** Cache user's achievement status to avoid repeated queries
2. **Indexing:** Ensure user_achievements has proper indexes
3. **Lazy Evaluation:** Only evaluate achievements user doesn't have yet
4. **Historical Query Limits:** For "total_count" rules, use PocketBase aggregate functions instead of fetching all records

### Scalability

1. **Async Processing:** Consider queueing achievement checks for later processing
2. **Batch Awards:** If user earns multiple achievements, batch the notifications
3. **Rate Limiting:** Prevent achievement spam by limiting checks

### User Experience

1. **Progress Indicators:** Show "50/100 poops" for historical achievements
2. **Rarity Display:** Show % of users who have each achievement
3. **Secret Achievements:** Some achievements could be hidden until unlocked
4. **Celebrations:** Confetti, animations, or special UI for rare achievements

---

## Future Enhancements

### Phase 2 Features

- **Social Achievements:** "First to follow 10 people"
- **Location-based:** "Poop in 10 different places"
- **Combo Achievements:** Require multiple other achievements first
- **Seasonal/Timed:** Only available during certain periods
- **Leaderboards:** Rank users by achievement count or rarity score

### Advanced Rule Types

- **Machine Learning:** Detect unusual patterns, predict achievement likelihood
- **Composite Rules:** Achievements that require multiple different seshes
- **Probabilistic:** Random chance to earn (e.g., 1% chance per perfect poop)

---

## Common Pitfalls to Avoid

1. **Don't award same achievement twice** - Check `user_achievements` before awarding
2. **Handle timezone issues** - Store times in UTC, convert for time-based rules
3. **Validate criteria JSON** - Malformed rules can crash the service
4. **Test edge cases** - Bristol score 0, negative durations, etc.
5. **Consider deleted seshes** - What happens if sesh that earned achievement is deleted?
6. **Race conditions** - Use database constraints to prevent duplicate awards

---

## Getting Started Checklist

- [ ] Create `user_achievements` migration
- [ ] Update `lib/types.ts` with achievement interfaces
- [ ] Build basic rule evaluator (start with 'simple' type only)
- [ ] Add backend hook to `main.go`
- [ ] Test with one simple achievement (e.g., "Perfect Poop")
- [ ] Create React Query hooks
- [ ] Build basic achievement UI component
- [ ] Expand to more rule types (historical, streak, etc.)
- [ ] Populate all achievements with criteria
- [ ] Add celebration/notification UI
- [ ] Polish and add progress indicators

---

## Questions to Consider

1. **Should achievements be retroactive?** If a user has 50 poops already, should they get "First Drop" immediately?
2. **Can achievements be lost?** If someone gets 100 poops then deletes 50, do they keep Century Club?
3. **Are there achievement tiers?** Bronze/Silver/Gold versions of same achievement?
4. **How to handle cheaters?** Validation rules for suspicious patterns?
5. **Public vs private?** Can other users see your achievements?

---

## Resources

- PocketBase Collections API: https://pocketbase.io/docs/collections/
- PocketBase Hooks: https://pocketbase.io/docs/event-hooks/
- React Query Mutations: https://tanstack.com/query/latest/docs/react/guides/mutations

---

*Good luck building! This is going to be a fun feature. Start small with simple rules and expand from there.*
