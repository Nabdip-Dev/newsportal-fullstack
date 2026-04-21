const express = require('express');
const router = express.Router();
const { protect, requireVerified } = require('../middleware/auth');
const { uploadImage } = require('../config/cloudinary');
const {
  signup, verifyOTP, resendOTP, login, forgotPassword,
  resetPassword, getMe, updateProfile, applyReporter,
} = require('../controllers/authController');

router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, uploadImage.single('avatar'), updateProfile);
router.post('/apply-reporter', protect, requireVerified, applyReporter);

module.exports = router;
