# Mobile App Testing Guide

This guide provides instructions for testing the Emergency Alert System mobile app using Expo, with the backend already deployed on Replit.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/client) app installed on your iOS or Android device
- A deployed version of the backend running on Replit

## Setup Steps

### 1. Update API Configuration

The API configuration in `mobile-app/src/config.ts` has been updated to point to the Replit deployment. Make sure it contains your actual Replit URL:

```typescript
const DEFAULT_API_URL = 'https://your-app-name.replit.app';
```

### 2. Install Dependencies

Navigate to the mobile app directory and install the necessary dependencies:

```bash
cd mobile-app
npm install
```

### 3. Start the Expo Development Server

Start the Expo development server with:

```bash
npm start
```

This will display a QR code in your terminal and launch the Expo Developer Tools in your browser.

### 4. Test on a Physical Device

#### Using Expo Go:

1. Download the Expo Go app from the [App Store](https://apps.apple.com/app/apple-store/id982107779) (iOS) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent) (Android).

2. Scan the QR code shown in your terminal:
   - **iOS**: Use your device's camera app
   - **Android**: Use the Expo Go app's QR code scanner

3. The Expo Go app will load your project. 

4. Log in using the credentials from the emergency alert system:
   - Username: admin (or another user created in your system)
   - Password: (the password you configured)

### 5. Testing in a Web Browser

You can also test the mobile app in a web browser (with limited functionality):

```bash
npm run web
```

This will open the app in your default web browser.

## Testing Key Features

### 1. Authentication

- Test logging in with admin, operator, and subscriber accounts
- Verify that each user type sees the appropriate screens

### 2. Alert Notifications

- Create a new alert in the web interface
- Verify that the mobile app receives the alert in real-time

### 3. Alert Acknowledgment

- Verify that alerts can be acknowledged from the mobile app
- Check that the acknowledgment status updates in the web interface

### 4. Push Notifications

Push notifications require additional setup:

1. Register an Expo push token for your device
2. The app automatically attempts to register the token upon login
3. Create an alert from the web interface to trigger push notifications

## Troubleshooting

### Connection Issues

If you're having trouble connecting to the Replit server:

1. Verify that the Replit server is still running
2. Check that the URL in `mobile-app/src/config.ts` matches your Replit deployment URL
3. Ensure your device has internet connection
4. Try using an explicit HTTPS URL for the server

### Authentication Problems

If login fails:

1. Check the credentials you're using
2. Verify that the authentication API endpoints are accessible 
3. Look at the console logs in the Expo developer tools for any error messages

### WebSocket Connection

For real-time alerts, the Socket.io connection must be working:

1. Check that the SOCKET_CONFIG in `mobile-app/src/config.ts` has the same URL and path as your server
2. Verify that the Socket.io server is running on the backend
3. Check the console logs for any socket connection errors

## Production Builds

For production use, you would need to create standalone app builds:

```bash
expo build:android   # For Android
expo build:ios       # For iOS (requires Apple Developer account)
```

Or with the newer EAS Build system:

```bash
eas build --platform android   # For Android
eas build --platform ios       # For iOS
```

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Socket.io Client Documentation](https://socket.io/docs/v4/client-api/)