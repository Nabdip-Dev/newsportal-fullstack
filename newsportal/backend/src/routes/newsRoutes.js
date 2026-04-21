const express = require('express');
const router = express.Router();
const { protect, requireVerified, requireReporter, requireAdmin } = require('../middleware/auth');
const { uploadImage } = require('../config/cloudinary');
const {
  getNews, getNewsBySlug, createNews, updateNews, deleteNews,
  submitForApproval, approveNews, toggleLike, uploadNewsImage,
  getTrending, getStats,
} = require('../controllers/newsController');

// Optional auth middleware (attach user if token present)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const { verifyToken } = require('../utils/jwt');
      const User = require('../models/User');
      const decoded = verifyToken(token);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (_) {}
  next();
};

router.get('/trending', getTrending);
router.get('/stats', protect, requireAdmin, getStats);
router.get('/', optionalAuth, getNews);
router.get('/:slug', optionalAuth, getNewsBySlug);
router.post('/', protect, requireVerified, requireReporter, createNews);
router.put('/:id', protect, requireVerified, updateNews);
router.delete('/:id', protect, requireVerified, deleteNews);
router.post('/:id/submit', protect, requireVerified, requireReporter, submitForApproval);
router.post('/:id/approve', protect, requireAdmin, approveNews);
router.post('/:id/like', protect, requireVerified, toggleLike);
router.post('/upload/image', protect, requireReporter, uploadImage.single('image'), uploadNewsImage);

module.exports = router;
