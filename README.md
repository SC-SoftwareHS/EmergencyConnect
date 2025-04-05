# Emergency Alert System

A robust emergency alert communication platform designed to streamline critical incident management and multi-channel notifications. The system provides comprehensive tools for real-time incident tracking, response coordination, and communication across various channels.

## Features

- **Real-time Alerts**: Send and receive alerts in real-time
- **Multi-channel Notifications**: Deliver alerts via Email, SMS, and Push notifications
- **Role-based Access Control**: Different access levels for admins, operators, and standard users
- **Incident Management**: Create, track, and manage incidents
- **Mobile App Support**: Mobile application for receiving alerts on the go
- **Acknowledgment System**: Track who has received and acknowledged alerts

## Technologies Used

- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: Socket.IO
- **SMS Integration**: Twilio
- **Email Integration**: SendGrid
- **Authentication**: JWT-based authentication
- **Mobile App**: React Native / Expo

## Getting Started

### Prerequisites

- Node.js 14+
- PostgreSQL
- SendGrid API Key (for email notifications)
- Twilio Account (for SMS notifications)

### Environment Variables

```
# Database
DATABASE_URL=postgres://username:password@host:port/database

# Authentication
JWT_SECRET=your_jwt_secret

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_sender_email

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### Installation

1. Clone this repository
   ```
   git clone https://github.com/yourusername/emergency-alert-system.git
   cd emergency-alert-system
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up your environment variables (create a `.env` file or set them in your hosting environment)

4. Start the server
   ```
   npm start
   ```

## API Endpoints

- **Authentication**
  - POST `/api/auth/login`: User login
  - POST `/api/auth/register`: Register new user
  - GET `/api/auth/profile`: Get current user profile

- **Alerts**
  - POST `/api/alerts`: Create a new alert
  - GET `/api/alerts`: Get all alerts
  - GET `/api/alerts/:id`: Get an alert by ID
  - POST `/api/alerts/:id/acknowledge`: Acknowledge an alert

- **Incidents**
  - POST `/api/incidents`: Create a new incident
  - GET `/api/incidents`: Get all incidents
  - GET `/api/incidents/:id`: Get an incident by ID

- **Users**
  - GET `/api/users`: Get all users (admin only)
  - PUT `/api/users/:id/notifications`: Update user notification preferences

## Mobile App

The system includes a mobile application built with React Native / Expo that allows users to:

- Receive alerts in real-time
- View alert details
- Acknowledge alerts
- Update notification preferences

## Deployment

The system can be deployed to various cloud platforms:

- Azure App Service
- AWS Elastic Beanstalk
- Heroku
- Digital Ocean

Follow the deployment instructions for your preferred platform.

## License

This project is licensed under the MIT License - see the LICENSE file for details.