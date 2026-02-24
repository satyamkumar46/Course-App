# Course App – React Native (Expo + TypeScript)
A modern Course Management Mobile Application built using React Native Expo (Latest SDK) with TypeScript (strict mode).
This app supports authentication, secure token storage, course browsing, and responsive UI design. 

# Features
- User Authentication (Login / Register)
- Secure Token Storage
- Course Listing
- Course Details View
- Profile Management
- Responsive UI
- Push Notifications (Planned)

# Tech Stack
- React Native (Expo)
- TypeScript (Strict Mode)
- Expo Router (File-based navigation)
- Expo SecureStore (Sensitive data storage)
- AsyncStorage (App data persistence)
- NativeWind (Tailwind CSS for React Native)
- REST API Integration

# Setup Instructions

1. Clone the Repository
   - git clone
   - cd course-app

2. Install Dependencies
   - npm install

3. Start the Development Server
   - npx expo start


# Environment Variables Needed
-  Create a .env file in the root directory:
-  EXPO_PUBLIC_API_URL=https://api.freeapi.app/api/v1

# Key Architectural Decisions

1. Expo Router (File-Based Navigation)
   - Clean folder-based routing structure
   - Simplifies stack and tab navigation
   - Scalable for large apps
  
2. TypeScript Strict Mode
   - Improves type safety
   - Reduces runtime errors
   - Better developer experience

3. Secure Authentication Storage
   - JWT stored using Expo SecureStore
   - Prevents sensitive token exposure
   - AsyncStorage used for non-sensitive app data

4. Responsive Design Strategy
   - Custom wp() and hp() helpers
   - Safe area handling
   - Consistent spacing system
   - NativeWind utility-first styling

# Known Issues / Limitations

- Push notifications not fully implemented yet
- No offline caching for course data
- API error handling can be improved
- No unit tests implemented
- Android status bar UI overlap requires manual adjustment in some devices
- Api server issue due to which image(course thumbnail) not visible

# Screenshots of Main Screens











