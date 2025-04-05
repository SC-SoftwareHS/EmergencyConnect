# API Integration Documentation

This document outlines the external API integrations in the Emergency Alert System and how to configure them.

## SendGrid Email Integration

The system uses SendGrid to send real email notifications. To enable this:

1. **Required Environment Variables**:
   - `SENDGRID_API_KEY`: Your SendGrid API key

2. **Integration Points**:
   - File: `services/notificationService.js`
   - Lines: 5, 27-36, 107-142

3. **Configuration Requirements**:
   - The sender email address (`from`) must be verified in your SendGrid account
   - Your SendGrid account must have the necessary permissions to send emails
   - Currently using "test@sendgrid.net" as the sender address (line 111)

4. **Fallback Behavior**:
   - If the SendGrid API key is not provided or an error occurs, the system falls back to a simulation mode
   - The simulation simply logs the email details to the console and pretends the email was sent

## Twilio SMS Integration (Verified Working)

The system uses Twilio to send real SMS notifications and has been confirmed working. To enable this:

1. **Required Environment Variables**:
   - `TWILIO_ACCOUNT_SID`: Your Twilio account SID
   - `TWILIO_AUTH_TOKEN`: Your Twilio auth token
   - `TWILIO_PHONE_NUMBER`: Your Twilio phone number in E.164 format (e.g., +1XXXXXXXXXX)

2. **Integration Points**:
   - File: `services/notificationService.js`
   - Lines: 6, 9-24, 158-186

3. **Important Notes**:
   - The "From" number (TWILIO_PHONE_NUMBER) must be a Twilio number purchased in your account
   - Twilio does not allow sending from and to the same phone number
   - Recipients' phone numbers must be in E.164 format (e.g., +1XXXXXXXXXX)

4. **Fallback Behavior**:
   - If any of the Twilio credentials are missing or an error occurs, the system falls back to a simulation mode
   - The simulation simply logs the SMS details to the console and pretends the SMS was sent

## Push Notification Integration

Currently, push notifications are only simulated. In the future, this could be integrated with Firebase Cloud Messaging (FCM) or a similar service.

1. **Integration Points**:
   - File: `services/notificationService.js` 
   - Lines: 202-210

2. **Current Behavior**:
   - The system logs push notification details to the console and simulates successful delivery
   - No actual push notifications are sent
   - Users need a push token registered to receive push notifications

## Testing Without API Keys

All notification channels have fallback simulation mechanisms that activate when API keys aren't provided. This allows for testing the application flow without actual API integrations.

When running in simulation mode, the system:

1. Logs the notification details to the console
2. Returns a success response with `provider: 'simulated'`
3. Continues normal application flow

This enables end-to-end testing of the alert creation and notification targeting logic without requiring real API credentials.

## Testing Results

During development, we successfully verified:

1. **SMS Delivery**: Real SMS messages were successfully delivered via Twilio to recipient mobile numbers.
2. **Email Status**: Identified issues with SendGrid configuration related to sender verification.
3. **Multi-Channel Alerts**: Successfully sent alerts through multiple channels simultaneously.
4. **Fallback Mechanisms**: Confirmed graceful degradation to simulation mode when API errors occur.

## Troubleshooting

Common issues and their solutions:

1. **Twilio "To and From Cannot Be the Same" Error**: Ensure your Twilio phone number is different from recipient numbers.
2. **SendGrid 403 Forbidden**: Verify the sender email address in your SendGrid account and ensure your API key has the necessary permissions.
3. **Missing Push Tokens**: Ensure user accounts have registered push tokens before attempting to send push notifications.