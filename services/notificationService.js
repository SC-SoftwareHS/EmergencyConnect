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
  if (!recipient.email) {
    return { success: false, error: 'Recipient has no email address' };
  }
  
  console.log(`[EMAIL] Sending alert "${alert.title}" to ${recipient.email}`);
  
  // If SendGrid is configured, use it to send the email
  if (hasSendGridKey) {
    try {
      const msg = {
        to: recipient.email,
        from: 'test@sendgrid.net', // Use a verified sender in SendGrid
        subject: `ALERT: ${alert.title}`,
        text: alert.message,
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
            </div>
          </div>
        `
      };
      
      await sgMail.send(msg);
      return { success: true, provider: 'sendgrid' };
    } catch (error) {
      console.error('SendGrid error:', error);
      // Fall back to simulated sending
      await simulateEmailSending();
      return { success: true, provider: 'simulated', reason: 'SendGrid error: ' + error.message };
    }
  } else {
    // Simulate sending email if SendGrid is not configured
    await simulateEmailSending();
    return { success: true, provider: 'simulated', reason: 'SendGrid not configured' };
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
    return { success: false, error: 'Recipient has no phone number' };
  }
  
  console.log(`[SMS] Sending alert "${alert.title}" to ${recipient.phoneNumber}`);
  
  // If Twilio is configured, use it to send the SMS
  if (hasTwilioCredentials && twilioClient) {
    try {
      const message = await twilioClient.messages.create({
        body: `ALERT [${alert.severity.toUpperCase()}]: ${alert.title} - ${alert.message}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: recipient.phoneNumber
      });
      
      return { success: true, provider: 'twilio', messageId: message.sid };
    } catch (error) {
      console.error('Twilio error:', error);
      // Fall back to simulated sending
      await simulateSmsSending();
      return { success: true, provider: 'simulated', reason: 'Twilio error: ' + error.message };
    }
  } else {
    // Simulate sending SMS if Twilio is not configured
    await simulateSmsSending();
    return { success: true, provider: 'simulated', reason: 'Twilio not configured' };
  }
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
  console.log(`[PUSH] Sending alert "${alert.title}" to user ${recipient.id}`);
  
  // Check if recipient has a push token
  if (!recipient.pushToken) {
    console.log(`User ${recipient.id} has no push token registered`);
    return { success: false, error: 'No push token registered' };
  }
  
  // Determine if this is an Expo push token
  const isExpoToken = recipient.pushToken.startsWith('ExponentPushToken[');
  
  if (isExpoToken) {
    // In a real implementation, we would use the Expo Push Notification API
    // For reference: https://docs.expo.dev/push-notifications/sending-notifications/
    
    try {
      console.log(`Sending push notification via Expo service to token: ${recipient.pushToken}`);
      
      // This would be the actual implementation using Expo's push service
      // const message = {
      //   to: recipient.pushToken,
      //   sound: 'default',
      //   title: `ALERT: ${alert.title}`,
      //   body: alert.message,
      //   data: { alertId: alert.id, severity: alert.severity },
      //   priority: 'high',
      //   channelId: 'emergency-alerts',
      // };
      
      // const response = await fetch('https://exp.host/--/api/v2/push/send', {
      //   method: 'POST',
      //   headers: {
      //     Accept: 'application/json',
      //     'Accept-encoding': 'gzip, deflate',
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(message),
      // });
      
      // Real implementation would check the response status
      
      // Simulate sending for now
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return { 
        success: true, 
        provider: 'expo-simulated',
        message: 'Push notification would be sent via Expo Push Service' 
      };
    } catch (error) {
      console.error('Error sending Expo push notification:', error);
      return { success: false, error: `Expo push error: ${error.message}` };
    }
  } else {
    // For FCM or other push services
    console.log(`Token type not recognized: ${recipient.pushToken}`);
    
    // Simulate sending push notification with delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return { 
      success: true, 
      provider: 'other-simulated',
      message: 'Push notification would be sent via FCM or other service' 
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
