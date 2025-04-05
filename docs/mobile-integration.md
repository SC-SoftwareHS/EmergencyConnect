# Mobile App Integration

This document outlines how the mobile application integrates with the backend server of the Emergency Alert System.

## Overview

The mobile application is built with React Native and Expo, providing a cross-platform solution for both iOS and Android devices. It communicates with the backend server via RESTful API calls and maintains real-time connections through Socket.IO.

## Authentication

The mobile app uses JWT token-based authentication, just like the web application. The authentication flow is as follows:

1. User enters credentials (username and password) in the login screen
2. App sends credentials to `/api/auth/login` endpoint
3. Server validates credentials and returns a JWT token along with user data
4. App stores the token and user data in AsyncStorage for persistent sessions
5. All subsequent API requests include the JWT token in the Authorization header
6. When token expires or becomes invalid, user is redirected to the login screen

## Real-Time Communications

The mobile app establishes a Socket.IO connection to receive real-time updates about alerts:

1. After successful authentication, the app initializes a Socket.IO connection with the JWT token
2. The connection stays open as long as the app is in the foreground
3. The app listens for events such as 'newAlert', 'alertUpdate', and 'alertAcknowledged'
4. When an event is received, the app updates its state and displays notifications as needed

## API Endpoints Used

The mobile app utilizes the following API endpoints:

- **Authentication**
  - `POST /api/auth/login` - Authenticate user
  - `GET /api/auth/profile` - Get current user profile
  - `POST /api/auth/logout` - Logout user

- **Alerts**
  - `GET /api/alerts` - Get list of alerts
  - `GET /api/alerts/:id` - Get details of a specific alert
  - `POST /api/alerts/:id/acknowledge` - Acknowledge an alert

## Push Notifications

Push notifications are handled through Expo's notification service:

1. App registers for push notifications and obtains a token
2. Token is sent to the server and stored with the user's profile
3. When a new alert is created, the server sends a push notification to all targeted users
4. The Expo Push Notification service handles delivery to both iOS and Android devices

## Offline Support

The mobile app implements basic offline support:

1. When the app detects it's offline, it shows a visual indicator
2. Cached alerts are still viewable
3. Acknowledgment actions are queued and executed when connectivity is restored

## Security Considerations

The mobile app implements the following security measures:

1. All API communications use HTTPS
2. Authentication tokens are stored securely in AsyncStorage
3. Token expiration is enforced
4. No sensitive data is cached on the device
5. The app implements certificate pinning to prevent MITM attacks

## Testing and Deployment

For testing and development:
- Use Expo Go to run the app in development mode
- Connect to a development server by updating the API URL in app.json

For production:
- Build standalone apps using Expo's build service
- Configure proper push notification credentials for FCM and APNs
- Use a production server URL
