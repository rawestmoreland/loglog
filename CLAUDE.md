# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### React Native App

```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Run on specific platforms
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web browser

# Linting
npm run lint
```

### PocketBase Backend

```bash
# Run PocketBase backend locally
cd pocketbase && make run

# Run PocketBase with Docker
cd pocketbase && docker-compose up

# Backend will be available at http://127.0.0.1:8080
```

## Architecture Overview

### Tech Stack

- **Frontend**: Expo Router (React Native) with file-based routing
- **Backend**: PocketBase (Go) - BaaS with real-time database
- **State Management**: React Query (@tanstack/react-query) for server state
- **Storage**: AsyncStorage for local persistence
- **Styling**: Vanilla React Native StyleSheets and Tamagui

### Core Architectural Patterns

#### Authentication Flow

Authentication uses a context-based pattern with protected routes:

1. **PocketBaseProvider** (`lib/pocketbaseConfig.tsx`): Initializes PocketBase client with AsyncAuthStore
2. **AuthContextProvider** (`context/authContext.tsx`): Manages auth state and provides `useAuth()` hook
3. **useProtectedRoute**: Automatically redirects based on auth state
   - Unauthenticated users → `/(auth)` routes
   - Authenticated users → `/(protected)` routes

The auth flow:
- PocketBase instance initializes on app startup
- Auth state is persisted to AsyncStorage via AsyncAuthStore
- Navigation is blocked until PocketBase initialization completes
- `LoadingScreen` component displays during initialization

#### Data Layer Pattern

All data fetching uses React Query with custom hooks in `hooks/api/`:

- **Queries**: `use*Queries.tsx` files (e.g., `usePooProfileQueries.tsx`)
- **Mutations**: `use*Mutations.tsx` files (e.g., `usePoopSeshMutations.tsx`)

Pattern:
```typescript
// Query hooks access PocketBase via usePocketBase()
const { pb } = usePocketBase();
return useQuery({
  queryKey: ['collection', id],
  queryFn: async () => await pb?.collection('name').getOne(id),
  enabled: !!pb
});
```

#### Route Structure

Expo Router uses file-based routing with route groups:

```
app/
  _layout.tsx              # Root layout with theme provider
  (auth)/                  # Unauthenticated routes
    _layout.tsx
    index.tsx              # Landing page
    (login)/               # Login flow
    (create-account)/      # Signup flow
  (protected)/             # Protected routes (requires auth)
    (screens)/             # Main app screens
    (tabs)/                # Tab navigation
```

Route groups (parentheses) don't appear in URL paths but provide layout nesting.

### PocketBase Backend Integration

#### Collections & Types

Core data models defined in `lib/types.ts`:

- **users**: Auth records (managed by PocketBase)
- **poo_profiles**: User profiles (one per user, auto-created via hook)
- **poop_seshes**: Activity records with location, Bristol score, timestamps
- **places**: Locations/venues for rating
- **toilet_ratings**: User ratings for places
- **follows**: Social following relationships
- **messages**: Chat/messaging between users

#### Backend Hooks (Go)

Custom logic in `pocketbase/base/main.go`:

1. **OnRecordAfterCreateSuccess("users")**: Auto-creates `poo_profiles` record when user signs up
2. **OnRecordAfterCreateSuccess("poop_seshes")**: Sends notifications to followers with active sessions
3. **Custom API Routes**:
   - `POST /api/delete-account`: Deletes user account with email confirmation
   - `GET /api/geo-conversion`: Migration helper for coordinate data

#### Environment Variables

PocketBase URL configured via environment variable:
- `EXPO_PUBLIC_POCKETBASE_URL` (defaults to production: `https://loglog-pocketbase-backend.fly.dev`)

For local development, set in `.env`:
```
EXPO_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8080
```

### State Management Philosophy

- **Server State**: React Query (no Redux/Zustand needed)
- **Auth State**: Context API via `AuthContextProvider`
- **PocketBase Client**: Context API via `PocketBaseProvider`
- **Form State**: Local component state or form libraries

### Real-time Features

PocketBase real-time subscriptions are supported via EventSource polyfill:
- `react-native-sse` package provides EventSource for React Native
- Global `EventSource` is polyfilled in `pocketbaseConfig.tsx`
- Use `pb.collection().subscribe()` for real-time updates

### Key Configuration

- **Expo Config**: `app.json` - includes new architecture enabled, typed routes experiment
- **TypeScript**: Path alias `@/*` maps to root directory
- **Theme**: Auto-switching light/dark mode via `useColorScheme` hook

## Important Notes

- The app uses Expo Router v6 with file-based routing
- New Architecture is enabled (`newArchEnabled: true`)
- Typed routes experimental feature is enabled
- React Compiler experimental feature is enabled
- PocketBase migrations are in `pocketbase/base/migrations/`
- Bristol score refers to the Bristol Stool Chart for tracking purposes
- Use vanilla React Native StyleSheets and Tamagui for styling (not NativeWind)
