/**
 * User model for the emergency alert system
 * Represents a user in the system with role-based permissions
 */
class User {
  constructor(id, username, email, password, role, channels = { email: true, sms: false, push: false }, phoneNumber = null, pushToken = null) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password; // In a real app, this would be hashed
    this.role = role; // 'admin', 'operator', or 'subscriber'
    this.channels = channels; // notification preferences
    this.phoneNumber = phoneNumber;
    this.pushToken = pushToken; // Token for push notifications (e.g., Expo Push Token)
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Check if the user has admin privileges
   * @returns {boolean} True if user is an admin
   */
  isAdmin() {
    return this.role === 'admin';
  }

  /**
   * Check if the user has operator privileges
   * @returns {boolean} True if user is an operator or admin
   */
  isOperator() {
    return this.role === 'operator' || this.role === 'admin';
  }

  /**
   * Get a sanitized version of the user without sensitive information
   * @returns {Object} User object without password
   */
  getSafeUser() {
    const { password, ...safeUser } = this;
    return safeUser;
  }

  /**
   * Update user information
   * @param {Object} updates - Fields to update
   */
  update(updates) {
    const allowedUpdates = ['username', 'email', 'phoneNumber', 'channels', 'role', 'pushToken'];
    
    for (const key in updates) {
      if (allowedUpdates.includes(key)) {
        this[key] = updates[key];
      }
    }
    
    this.updatedAt = new Date();
  }
  
  /**
   * Register a push notification token for this user
   * @param {string} token - Push notification token
   */
  registerPushToken(token) {
    if (token && token !== this.pushToken) {
      this.pushToken = token;
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }
}

module.exports = User;
