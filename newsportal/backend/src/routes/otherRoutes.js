const express = require('express');
const commentRouter = express.Router();
const categoryRouter = express.Router();
const adminRouter = express.Router();
const pollRouter = express.Router();

const { protect, requireVerified, requireAdmin } = require('../middleware/auth');
const {
  getComments, createComment, deleteComment, likeComment,
} = require('../controllers/commentController');
const {
  getCategories, createCategory, updateCategory, deleteCategory,
} = require('../controllers/categoryController');
const {
  getDashboard, getUsers, updateUserRole, toggleUserActive,
  approveReporter, getComments: adminGetComments, deleteComment: adminDeleteComment,
  getBanners, getActiveBanners, createBanner, updateBanner, deleteBanner,
} = require('../controllers/adminController');
const { getActivePolls, createPoll, votePoll } = require('../controllers/pollController');

// Comment routes
commentRouter.get('/:newsId', getComments);
commentRouter.post('/', protect, requireVerified, createComment);
commentRouter.delete('/:id', protect, deleteComment);
commentRouter.post('/:id/like', protect, requireVerified, likeComment);

// Category routes
categoryRouter.get('/', getCategories);
categoryRouter.post('/', protect, requireAdmin, createCategory);
categoryRouter.put('/:id', protect, requireAdmin, updateCategory);
categoryRouter.delete('/:id', protect, requireAdmin, deleteCategory);

// Admin routes
adminRouter.get('/dashboard', protect, requireAdmin, getDashboard);
adminRouter.get('/users', protect, requireAdmin, getUsers);
adminRouter.put('/users/:id/role', protect, requireAdmin, updateUserRole);
adminRouter.put('/users/:id/toggle-active', protect, requireAdmin, toggleUserActive);
adminRouter.put('/reporters/:id/approve', protect, requireAdmin, approveReporter);
adminRouter.get('/comments', protect, requireAdmin, adminGetComments);
adminRouter.delete('/comments/:id', protect, requireAdmin, adminDeleteComment);
adminRouter.get('/banners', protect, requireAdmin, getBanners);
adminRouter.post('/banners', protect, requireAdmin, createBanner);
adminRouter.put('/banners/:id', protect, requireAdmin, updateBanner);
adminRouter.delete('/banners/:id', protect, requireAdmin, deleteBanner);

// Poll routes
pollRouter.get('/', getActivePolls);
pollRouter.post('/', protect, requireAdmin, createPoll);
pollRouter.post('/:id/vote', protect, requireVerified, votePoll);

// Public banners
const Banner = require('../models/Banner');
adminRouter.get('/banners/active', async (req, res) => {
  try {
    const now = new Date();
    const banners = await Banner.find({ isActive: true, $or: [{ endDate: { $gte: now } }, { endDate: null }] }).sort({ priority: -1 });
    res.json({ success: true, data: banners });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = { commentRouter, categoryRouter, adminRouter, pollRouter };
