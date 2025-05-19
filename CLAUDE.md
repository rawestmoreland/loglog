# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LogLog is a mobile application for tracking and logging bathroom activities with social features. The app allows users to log their bathroom visits, track stats, share with friends, and view a map of activity locations.

## Tech Stack

- **Frontend**: React Native with Expo (v52) and Expo Router
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: React Query for data fetching
- **Backend**: PocketBase (custom Go backend)
- **Maps/Location**: Mapbox (@rnmapbox/maps) and Expo Location
- **Forms & Validation**: React Hook Form with Zod

## Development Commands

### App Development

```bash
# Start development server
npm start

# Start on specific platforms
npm run ios
npm run android
npm run web

# Code quality
npm run lint      # Check code quality
npm run format    # Format code with ESLint and Prettier
```

### PocketBase Backend Development

The backend uses PocketBase, a Go-based backend that can be run locally:

```bash
# Run PocketBase backend locally
cd pocketbase/base && go run . serve --http="127.0.0.1:8080"

# Or use the makefile
cd pocketbase && make run

# Run with Docker
cd pocketbase && docker-compose up
```

## Project Structure

### Key Directories

- `app/`: Expo Router screens and navigation
  - `(auth)/`: Authentication screens (login, signup)
  - `(protected)/`: App screens requiring authentication
- `components/`: Reusable React components
  - `sheets/`: Bottom sheet components
  - `nativewindui/`: UI components with NativeWind styling
- `context/`: React context providers
  - `authContext.tsx`: Authentication state
  - `seshContext.tsx`: Current poop session state
  - `locationContext.tsx`: User location handling
- `hooks/api/`: API interaction hooks with React Query
  - `usePoopSeshQueries.tsx`: Queries for poop sessions
  - `useChatMutations.tsx`: Mutations for chat functionality
- `lib/`: Utility functions, types and configurations
  - `pocketbaseConfig.tsx`: PocketBase client configuration

### Main Features

1. **Authentication**: User signup, login, account management
2. **Poop Logging**: Record bathroom sessions with "Bristol score" and other metrics
3. **Social Features**: Chat with friends, see friend activity
4. **Map View**: View global, personal, or friend activity on a map
5. **Stats**: Track personal poop statistics and history

## Data Models

Key models include:

- **PooProfile**: User profile data
- **PoopSesh**: A recorded bathroom session with metadata (time, location, bristol score)
- **Social connections**: Friend relationships between users

## Architecture Notes

1. The app uses Expo Router for navigation with a split between authenticated and unauthenticated routes
2. PocketBase handles authentication, data storage, and real-time updates
3. React Query manages server state with custom hooks in the `hooks/api/` directory
4. Bottom sheets are used extensively for UI interactions
5. NativeWind provides Tailwind-like styling capabilities

## Development Tips

1. Make sure to run the PocketBase backend during development
2. The app uses environment variables for configuration, particularly `EXPO_PUBLIC_POCKETBASE_URL` 
3. Authentication state is managed centrally via the auth context
4. Maps functionality requires a Mapbox account and API key