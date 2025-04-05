# Emergency Alert System Mobile App

This is the mobile application component of the Emergency Alert System, built with React Native and Expo. It allows users to receive and acknowledge emergency alerts on their mobile devices.

## Features

- User authentication (login)
- Real-time alert reception via Socket.IO
- View list of active and past alerts
- Detailed view of individual alerts
- Acknowledge alerts to confirm receipt
- Push notifications for new alerts

## Prerequisites

- Node.js (v14+)
- Npm or Yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for testing)

## Installation

1. Install dependencies:

```bash
cd mobile-app
npm install
```

## Configuration

Edit the `app.json` file to configure the app:

```json
"extra": {
  "apiUrl": "http://YOUR_SERVER_IP:5000"  // Replace with your server IP address
}
```

For development using Expo Go on a physical device, you need to use your computer's local network IP address (e.g., 192.168.1.100) instead of localhost.

## Running the App

1. Start the development server:

```bash
npm start
```

2. Use the Expo Go app on your mobile device to scan the QR code displayed in the terminal, or run on an emulator by pressing 'a' for Android or 'i' for iOS.

## Testing

To test the full functionality:

1. Make sure the backend server is running
2. Log in using valid credentials from the main system
3. Test real-time functionality by creating an alert from the web interface
4. Verify that the alert appears on the mobile app in real-time
5. Test acknowledgment functionality

## Push Notifications

Push notifications are implemented using Expo Notifications. For production use:

1. Set up Firebase Cloud Messaging (for Android) and/or Apple Push Notification service (for iOS)
2. Update the backend to send notifications to the Expo Push Notification service
3. Configure the app for production builds

## Building for Production

To create standalone apps:

1. Configure app.json with your production settings
2. Build for the desired platform:

```bash
# For Android
expo build:android

# For iOS
expo build:ios
```

Follow the Expo documentation for more details on building and publishing.