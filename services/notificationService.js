/**
 * Notification service for the emergency alert system
 * Handles sending notifications via different channels
 */
const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');

// Initialize Twilio client if credentials are available
let twilioClient = null;
const hasTwilioCredentials = process.env.TWILIO_ACCOUNT_SID && 
                            process.env.TWILIO_AUTH_TOKEN && 
                            process.env.TWILIO_PHONE_NUMBER;

if (hasTwilioCredentials) {
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('Twilio client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error);
  }
}

// Initialize SendGrid if API key is available
let hasSendGridKey = !!process.env.SENDGRID_API_KEY;
if (hasSendGridKey) {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('SendGrid API key set successfully');
  } catch (error) {
    console.error('Failed to set SendGrid API key:', error);
    hasSendGridKey = false;
  }
}

/**
 * Send an alert to recipients via specified channels
 * @param {Object} alert - Alert object
 * @param {Array} recipients - Array of recipient users
 * @returns {Promise<Array>} Array of notification results
 */
const sendAlertNotifications = async (alert, recipients) => {
  const results = [];
  
  // For each recipient
  for (const recipient of recipients) {
    // For each channel in the alert
    for (const channel of alert.channels) {
      // Check if recipient has enabled this channel
      if (recipient.channels && recipient.channels[channel]) {
        try {
          let result;
          
          // Send notification via appropriate channel
          switch (channel) {
            case 'email':
              result = await sendEmailNotification(alert, recipient);
              break;
            case 'sms':
              result = await sendSmsNotification(alert, recipient);
              break;
            case 'push':
              result = await sendPushNotification(alert, recipient);
              break;
            default:
              result = { success: false, error: `Unknown channel: ${channel}` };
          }
          
          results.push({
            ...result,
            recipientId: recipient.id,
            channel
          });
        } catch (error) {
          console.error(`Failed to send ${channel} notification to user ${recipient.id}:`, error);
          
          results.push({
            success: false,
            recipientId: recipient.id,
            channel,
            error: error.message
          });
        }
      }
    }
  }
  
  return results;
};

/**
 * Send an email notification
 * @param {Object} alert - Alert object
 * @param {Object} recipient - Recipient user
 * @returns {Promise<Object>} Notification result
 */
const sendEmailNotification = async (alert, recipient) => {
  // Check if recipient has an email address
  if (!recipient.email) {
    console.warn(`[EMAIL] Cannot send alert to user ${recipient.id}: No email address found`);
    return { 
      success: false, 
      error: 'Recipient has no email address',
      recipientId: recipient.id,
      alertId: alert.id
    };
  }
  
  // Verify email format (basic validation)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipient.email)) {
    console.warn(`[EMAIL] Invalid email format for user ${recipient.id}: ${recipient.email}`);
    return { 
      success: false, 
      error: 'Invalid email format',
      recipientId: recipient.id,
      alertId: alert.id,
      email: recipient.email
    };
  }
  
  // Get SendGrid from email from environment or use default
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'harrison@sylvanitecapital.com';
  
  console.log(`[EMAIL] Preparing to send ${alert.severity} alert "${alert.title}" to ${recipient.email}`);
  
  // If SendGrid is configured, use it to send the email
  if (hasSendGridKey) {
    try {
      console.log(`[EMAIL] Sending via SendGrid from ${fromEmail} to ${recipient.email}`);
      
      // Create email content with severity color coding
      const msg = {
        to: recipient.email,
        from: fromEmail,
        subject: `ALERT [${alert.severity.toUpperCase()}]: ${alert.title}`,
        text: `ALERT [${alert.severity.toUpperCase()}]: ${alert.title}\n\n${alert.message}\n\nThis is an automated emergency alert. Please follow all instructions carefully.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: ${getSeverityColor(alert.severity)}; padding: 15px; text-align: center;">
              <h1 style="color: white; margin: 0;">${alert.title}</h1>
              <p style="color: white; margin: 5px 0 0;">Severity: ${alert.severity.toUpperCase()}</p>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
              <p style="font-size: 16px; line-height: 1.5;">${alert.message}</p>
              <p style="font-size: 14px; color: #777;">
                This is an automated emergency alert. Please follow all instructions carefully.
              </p>
              <div style="margin-top: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 4px;">
                <p style="margin: 0; font-size: 12px; color: #777;">
                  Alert ID: ${alert.id}<br>
                  Sent: ${new Date().toLocaleString()}<br>
                  System: Emergency Alert Platform
                </p>
              </div>
            </div>
          </div>
        `
      };
      
      // Add tracking settings
      msg.trackingSettings = {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      };
      
      // Send the email
      await sgMail.send(msg);
      
      console.log(`[EMAIL] Successfully sent to ${recipient.email}`);
      
      return { 
        success: true, 
        provider: 'sendgrid',
        recipientId: recipient.id,
        alertId: alert.id,
        email: recipient.email 
      };
    } catch (error) {
      console.error(`[EMAIL] SendGrid error sending to ${recipient.email}:`, error.message);
      
      // Log detailed error information if available
      if (error.response) {
        console.error('[EMAIL] SendGrid API error details:',
          '\nStatus code:', error.response.statusCode,
          '\nBody:', error.response.body && JSON.stringify(error.response.body),
          '\nHeaders:', error.response.headers && JSON.stringify(error.response.headers)
        );
      }
      
      // Fall back to simulated sending
      await simulateEmailSending();
      
      return { 
        success: false, 
        provider: 'sendgrid-error', 
        reason: 'SendGrid error: ' + error.message,
        statusCode: error.response?.statusCode,
        recipientId: recipient.id,
        alertId: alert.id,
        email: recipient.email
      };
    }
  } else {
    // Log the configuration status
    console.warn('[EMAIL] SendGrid API key is not configured');
    
    // Simulate sending email
    console.log(`[EMAIL] Simulating email delivery to ${recipient.email} (SendGrid not configured)`);
    await simulateEmailSending();
    
    return { 
      success: true, 
      provider: 'simulated', 
      reason: 'SendGrid not configured',
      recipientId: recipient.id,
      alertId: alert.id,
      email: recipient.email
    };
  }
};

/**
 * Simulate sending an email with a delay
 */
const simulateEmailSending = async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
};

/**
 * Send an SMS notification
 * @param {Object} alert - Alert object
 * @param {Object} recipient - Recipient user
 * @returns {Promise<Object>} Notification result
 */
const sendSmsNotification = async (alert, recipient) => {
  // Check if recipient has a phone number
  if (!recipient.phoneNumber) {
    console.warn(`[SMS] Cannot send alert to user ${recipient.id}: No phone number found`);
    return { 
      success: false, 
      error: 'Recipient has no phone number',
      recipientId: recipient.id,
      alertId: alert.id
    };
  }
  
  // Format the phone number if needed (ensure it has the correct format with country code)
  const phoneNumber = formatPhoneNumber(recipient.phoneNumber);
  
  console.log(`[SMS] Preparing to send ${alert.severity} alert "${alert.title}" to ${phoneNumber}`);
  
  // Create the message with character limit considerations
  const MAX_SMS_LENGTH = 160; // Standard SMS character limit
  let messageBody = `ALERT [${alert.severity.toUpperCase()}]: ${alert.title}`;
  
  // Calculate remaining characters
  const remainingChars = MAX_SMS_LENGTH - messageBody.length - 3; // 3 for " - "
  
  // Truncate message if needed
  let truncatedMessage = alert.message;
  if (truncatedMessage.length > remainingChars) {
    truncatedMessage = truncatedMessage.substring(0, remainingChars - 3) + '...';
  }
  
  // Complete message
  messageBody += ` - ${truncatedMessage}`;
  
  // If Twilio is configured, use it to send the SMS
  if (hasTwilioCredentials && twilioClient) {
    try {
      console.log(`[SMS] Sending via Twilio to ${phoneNumber}`);
      
      const message = await twilioClient.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      
      console.log(`[SMS] Successfully sent to ${phoneNumber} (Twilio SID: ${message.sid})`);
      
      return { 
        success: true, 
        provider: 'twilio', 
        messageId: message.sid,
        recipientId: recipient.id,
        alertId: alert.id,
        phoneNumber: phoneNumber
      };
    } catch (error) {
      console.error(`[SMS] Twilio error sending to ${phoneNumber}:`, error.message);
      
      if (error.code) {
        console.error(`[SMS] Twilio error code: ${error.code}`);
      }
      
      // Log specific error types for troubleshooting
      if (error.code === 21211) {
        console.error(`[SMS] Invalid phone number format: ${phoneNumber}`);
      } else if (error.code === 21608) {
        console.error(`[SMS] Unverified recipient phone number. In trial accounts, the recipient number must be verified.`);
      } else if (error.code === 21610) {
        console.error(`[SMS] Recipient has opted out of receiving messages from this number.`);
      }
      
      // Fall back to simulated sending
      await simulateSmsSending();
      return { 
        success: false, 
        provider: 'twilio-error', 
        reason: 'Twilio error: ' + error.message,
        errorCode: error.code,
        recipientId: recipient.id,
        alertId: alert.id,
        phoneNumber: phoneNumber
      };
    }
  } else {
    // Log the configuration status
    if (!hasTwilioCredentials) {
      console.warn('[SMS] Twilio credentials are not properly configured');
    } else if (!twilioClient) {
      console.warn('[SMS] Twilio client initialization failed');
    }
    
    // Simulate sending SMS
    console.log(`[SMS] Simulating SMS delivery to ${phoneNumber} (Twilio not configured)`);
    await simulateSmsSending();
    
    return { 
      success: true, 
      provider: 'simulated', 
      reason: 'Twilio not fully configured',
      recipientId: recipient.id,
      alertId: alert.id,
      phoneNumber: phoneNumber
    };
  }
};

/**
 * Format a phone number to ensure it has the correct international format
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} Properly formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
  // Strip all non-digit characters
  let digits = phoneNumber.replace(/\D/g, '');
  
  // If US number without country code, add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it already has a country code (11+ digits), ensure it starts with '+'
  if (digits.length >= 11 && !phoneNumber.startsWith('+')) {
    return `+${digits}`;
  }
  
  // Return original if it already has the '+' or couldn't be formatted
  return phoneNumber.startsWith('+') ? phoneNumber : `+${digits}`;
};

/**
 * Simulate sending an SMS with a delay
 */
const simulateSmsSending = async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
};

/**
 * Send a push notification
 * @param {Object} alert - Alert object
 * @param {Object} recipient - Recipient user
 * @returns {Promise<Object>} Notification result
 */
const sendPushNotification = async (alert, recipient) => {
  console.log(`[PUSH] Attempting to send alert "${alert.title}" to user ${recipient.id}`);
  
  // Check if recipient has a push token
  if (!recipient.pushToken) {
    console.warn(`[PUSH] Warning: User ${recipient.id} has no push token registered. Skipping push notification.`);
    return { 
      success: false, 
      error: 'No push token registered',
      recipientId: recipient.id,
      alertId: alert.id
    };
  }
  
  // Determine the token type
  const isExpoToken = recipient.pushToken.startsWith('ExponentPushToken[');
  const tokenType = isExpoToken ? 'Expo' : 'Unknown';
  
  console.log(`[PUSH] Sending ${alert.severity} alert "${alert.title}" to user ${recipient.id} via ${tokenType} token`);
  
  if (isExpoToken) {
    try {
      // In a real implementation, we would use the Expo Push Notification API
      // For reference: https://docs.expo.dev/push-notifications/sending-notifications/
      console.log(`[PUSH] Expo token detected for user ${recipient.id}: ${recipient.pushToken.substring(0, 20)}...`);
      
      // Construct the message payload
      const message = {
        to: recipient.pushToken,
        sound: 'default',
        title: `ALERT [${alert.severity.toUpperCase()}]: ${alert.title}`,
        body: alert.message,
        data: { 
          alertId: alert.id, 
          severity: alert.severity,
          createdAt: alert.createdAt,
          channels: alert.channels
        },
        priority: 'high',
        channelId: 'emergency-alerts',
        badge: 1
      };
      
      console.log(`[PUSH] Expo message payload prepared: ${JSON.stringify(message, null, 2)}`);
      
      // For now simulate sending with a delay
      // In production, we would uncomment the actual implementation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Uncomment this section when ready to send real notifications
      // const response = await fetch('https://exp.host/--/api/v2/push/send', {
      //   method: 'POST',
      //   headers: {
      //     Accept: 'application/json',
      //     'Accept-encoding': 'gzip, deflate',
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(message),
      // });
      // 
      // const responseData = await response.json();
      // console.log(`[PUSH] Expo push response: ${JSON.stringify(responseData, null, 2)}`);
      //
      // if (response.ok) {
      //   return { 
      //     success: true, 
      //     provider: 'expo',
      //     data: responseData
      //   };
      // } else {
      //   throw new Error(`Expo responded with ${response.status}: ${JSON.stringify(responseData)}`);
      // }
      
      console.log(`[PUSH] Simulated successful push notification to user ${recipient.id}`);
      return { 
        success: true, 
        provider: 'expo-simulated',
        message: 'Push notification would be sent via Expo Push Service',
        recipient: {
          id: recipient.id,
          tokenType: 'expo'
        },
        alert: {
          id: alert.id,
          title: alert.title,
          severity: alert.severity
        }
      };
    } catch (error) {
      console.error(`[PUSH] Error sending Expo push notification to user ${recipient.id}:`, error);
      return { 
        success: false, 
        error: `Expo push error: ${error.message}`,
        recipientId: recipient.id,
        alertId: alert.id
      };
    }
  } else if (recipient.pushToken) {
    // For FCM or other push services
    try {
      console.log(`[PUSH] Non-Expo token detected for user ${recipient.id}: ${recipient.pushToken.substring(0, 10)}...`);
      
      // For FCM, we would implement similar logic as the Expo example
      // For now, simulate sending with a delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`[PUSH] Simulated successful FCM/Other push notification to user ${recipient.id}`);
      return { 
        success: true, 
        provider: 'other-simulated',
        message: 'Push notification would be sent via FCM or other service',
        recipient: {
          id: recipient.id,
          tokenType: 'unknown'
        },
        alert: {
          id: alert.id,
          title: alert.title,
          severity: alert.severity
        }
      };
    } catch (error) {
      console.error(`[PUSH] Error sending FCM/Other push notification to user ${recipient.id}:`, error);
      return { 
        success: false, 
        error: `Push notification error: ${error.message}`,
        recipientId: recipient.id,
        alertId: alert.id
      };
    }
  } else {
    console.error(`[PUSH] Invalid push token format for user ${recipient.id}`);
    return { 
      success: false, 
      error: 'Invalid push token format',
      recipientId: recipient.id,
      alertId: alert.id
    };
  }
};

/**
 * Get color based on alert severity
 * @param {string} severity - Alert severity
 * @returns {string} Color hex code
 */
const getSeverityColor = (severity) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return '#cc0000'; // Dark red
    case 'high':
      return '#ff4500'; // Orange-red
    case 'medium':
      return '#ffa500'; // Orange
    case 'low':
      return '#ffcc00'; // Amber
    default:
      return '#999999'; // Gray
  }
};

module.exports = {
  sendAlertNotifications
};
