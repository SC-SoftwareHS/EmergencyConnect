/**
 * Authentication routes for the emergency alert system
 */
const express = require('express');
const { login, register, getProfile, updateProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Login a user and get a token
 * @access Public
 */
router.post('/login', login);

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', register);

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', authenticate, updateProfile);

module.exports = router;
