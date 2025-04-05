/**
 * User controller for the emergency alert system
 */
const { userDB, subscriptionDB } = require('../utils/database');
const { validateUserData } = require('../utils/validators');

/**
 * Get all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllUsers = (req, res) => {
  // Get query parameters
  const { role, limit = 100 } = req.query;
  
  // Get users based on role
  let users;
  
  if (role) {
    users = userDB.getAllByRole(role);
  } else {
    users = userDB.getAll();
  }
  
  // Limit results
  users = users.slice(0, parseInt(limit));
  
  // Return success with users
  res.json({
    success: true,
    data: {
      users,
      total: users.length
    }
  });
};

/**
 * Get a user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserById = (req, res) => {
  const { id } = req.params;
  
  // Find user
  const user = userDB.findById(parseInt(id));
  
  // If user not found, return not found
  if (!user) {
    return res.status(404).json({
      success: false,
      message: `User with ID ${id} not found.`
    });
  }
  
  // Get user's subscription
  const subscription = subscriptionDB.findByUserId(user.id);
  
  // Return success with user and subscription
  res.json({
    success: true,
    data: {
      user: user.getSafeUser(),
      subscription
    }
  });
};

/**
 * Create a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createUser = (req, res) => {
  const userData = req.body;
  
  // Validate user data
  const validation = validateUserData(userData);
  
  // If validation fails, return bad request
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user data.',
      errors: validation.errors
    });
  }
  
  // Check if email already exists
  const existingUser = userDB.findByEmail(userData.email);
  
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already in use.'
    });
  }
  
  // Check if username already exists
  const existingUsername = userDB.findByUsername(userData.username);
  
  if (existingUsername) {
    return res.status(400).json({
      success: false,
      message: 'Username already in use.'
    });
  }
  
  // Create new user
  const newUser = userDB.create(userData);
  
  // Create subscription for user if categories provided
  if (userData.categories && Array.isArray(userData.categories)) {
    subscriptionDB.create({
      userId: newUser.id,
      categories: userData.categories
    });
  }
  
  // Return success with new user
  res.status(201).json({
    success: true,
    message: 'User created successfully.',
    data: {
      user: newUser.getSafeUser()
    }
  });
};

/**
 * Update a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateUser = (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Find user
  const user = userDB.findById(parseInt(id));
  
  // If user not found, return not found
  if (!user) {
    return res.status(404).json({
      success: false,
      message: `User with ID ${id} not found.`
    });
  }
  
  // Validate updates
  const validation = validateUserData({
    ...user,
    ...updates
  });
  
  // If validation fails, return bad request
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid update data.',
      errors: validation.errors
    });
  }
  
  // Update user
  const updatedUser = userDB.update(parseInt(id), updates);
  
  // Update subscription if categories provided
  if (updates.categories && Array.isArray(updates.categories)) {
    let subscription = subscriptionDB.findByUserId(user.id);
    
    if (subscription) {
      subscriptionDB.update(subscription.id, { categories: updates.categories });
    } else {
      subscriptionDB.create({
        userId: user.id,
        categories: updates.categories
      });
    }
  }
  
  // Return success with updated user
  res.json({
    success: true,
    message: 'User updated successfully.',
    data: {
      user: updatedUser.getSafeUser()
    }
  });
};

/**
 * Delete a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteUser = (req, res) => {
  const { id } = req.params;
  
  // Find user
  const user = userDB.findById(parseInt(id));
  
  // If user not found, return not found
  if (!user) {
    return res.status(404).json({
      success: false,
      message: `User with ID ${id} not found.`
    });
  }
  
  // Delete user
  userDB.delete(parseInt(id));
  
  // Delete user's subscription
  const subscription = subscriptionDB.findByUserId(parseInt(id));
  
  if (subscription) {
    subscriptionDB.delete(subscription.id);
  }
  
  // Return success
  res.json({
    success: true,
    message: 'User deleted successfully.'
  });
};

/**
 * Update user notification preferences
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateNotificationPreferences = (req, res) => {
  const { id } = req.params;
  const { channels } = req.body;
  
  // Find user
  const user = userDB.findById(parseInt(id));
  
  // If user not found, return not found
  if (!user) {
    return res.status(404).json({
      success: false,
      message: `User with ID ${id} not found.`
    });
  }
  
  // Validate channels
  if (!channels || typeof channels !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Invalid channels data. Expected an object.'
    });
  }
  
  // Update user's notification channels
  const updatedUser = userDB.update(parseInt(id), { channels });
  
  // Return success with updated user
  res.json({
    success: true,
    message: 'Notification preferences updated successfully.',
    data: {
      user: updatedUser.getSafeUser()
    }
  });
};

/**
 * Get user subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserSubscription = (req, res) => {
  const { id } = req.params;
  
  // Find user
  const user = userDB.findById(parseInt(id));
  
  // If user not found, return not found
  if (!user) {
    return res.status(404).json({
      success: false,
      message: `User with ID ${id} not found.`
    });
  }
  
  // Get user's subscription
  const subscription = subscriptionDB.findByUserId(parseInt(id));
  
  // If subscription not found, return not found
  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: `Subscription for user with ID ${id} not found.`
    });
  }
  
  // Return success with subscription
  res.json({
    success: true,
    data: {
      subscription
    }
  });
};

/**
 * Update user subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateUserSubscription = (req, res) => {
  const { id } = req.params;
  const { categories, active } = req.body;
  
  // Find user
  const user = userDB.findById(parseInt(id));
  
  // If user not found, return not found
  if (!user) {
    return res.status(404).json({
      success: false,
      message: `User with ID ${id} not found.`
    });
  }
  
  // Get user's subscription
  let subscription = subscriptionDB.findByUserId(parseInt(id));
  
  // If subscription not found, create it
  if (!subscription) {
    subscription = subscriptionDB.create({
      userId: parseInt(id),
      categories: categories || []
    });
  } else {
    // Update subscription
    const updates = {};
    
    if (categories !== undefined) {
      updates.categories = categories;
    }
    
    if (active !== undefined) {
      updates.active = active;
    }
    
    subscription = subscriptionDB.update(subscription.id, updates);
  }
  
  // Return success with updated subscription
  res.json({
    success: true,
    message: 'Subscription updated successfully.',
    data: {
      subscription
    }
  });
};

/**
 * Register a push notification token for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const registerPushToken = (req, res) => {
  const { id } = req.params;
  const { pushToken } = req.body;
  
  // Validate push token
  if (!pushToken || typeof pushToken !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Invalid push token. Expected a string.'
    });
  }
  
  // Find user
  const user = userDB.findById(parseInt(id));
  
  // If user not found, return not found
  if (!user) {
    return res.status(404).json({
      success: false,
      message: `User with ID ${id} not found.`
    });
  }
  
  // Register push token
  const tokenChanged = user.registerPushToken(pushToken);
  
  // If token was registered, update user in database
  if (tokenChanged) {
    userDB.update(parseInt(id), { pushToken });
  }
  
  // Return success
  res.json({
    success: true,
    message: tokenChanged ? 'Push token registered successfully.' : 'Push token already registered.',
    data: {
      user: user.getSafeUser()
    }
  });
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateNotificationPreferences,
  getUserSubscription,
  updateUserSubscription,
  registerPushToken
};
