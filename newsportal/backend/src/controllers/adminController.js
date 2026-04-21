const User = require('../models/User');
const News = require('../models/News');
const Comment = require('../models/Comment');
const Category = require('../models/Category');
const Banner = require('../models/Banner');
const { sendApprovalEmail } = require('../utils/email');

// @GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalNews, pendingNews, totalCategories, reporters, pendingReporters] =
      await Promise.all([
        User.countDocuments(),
        News.countDocuments(),
        News.countDocuments({ status: 'pending' }),
        Category.countDocuments(),
        User.countDocuments({ role: 'reporter' }),
        User.countDocuments({ reporterStatus: 'pending' }),
      ]);

    const recentNews = await News.find({ status: 'pending' })
      .populate('author', 'firstName lastName avatar')
      .populate('category', 'name color')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status createdAt author category');

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email role createdAt avatar');

    const topNews = await News.find({ status: 'published' })
      .sort({ views: -1 })
      .limit(5)
      .select('title views likesCount slug');

    res.json({
      success: true,
      data: {
        stats: { totalUsers, totalNews, pendingNews, totalCategories, reporters, pendingReporters },
        recentNews,
        recentUsers,
        topNews,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, reporterStatus } = req.query;
    const query = {};
    if (role) query.role = role;
    if (reporterStatus) query.reporterStatus = reporterStatus;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password -otp -otpExpires -resetPasswordOtp -resetPasswordOtpExpires');

    res.json({
      success: true,
      data: users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'reporter', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: `User role updated to ${role}.`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/admin/users/:id/toggle-active
exports.toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/admin/reporters/:id/approve
exports.approveReporter = async (req, res) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (action === 'approve') {
      user.role = 'reporter';
      user.reporterStatus = 'approved';
    } else {
      user.reporterStatus = 'rejected';
    }
    await user.save();

    await sendApprovalEmail(user.email, user.firstName, 'reporter', action === 'approve' ? 'approved' : 'rejected').catch(console.error);

    res.json({ success: true, message: `Reporter application ${action}d.`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/admin/comments
exports.getComments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Comment.countDocuments({ isDeleted: false });
    const comments = await Comment.find({ isDeleted: false })
      .populate('author', 'firstName lastName email')
      .populate('news', 'title slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: comments,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/admin/comments/:id
exports.deleteComment = async (req, res) => {
  try {
    await Comment.findByIdAndUpdate(req.params.id, { isDeleted: true, content: '[Removed by admin]' });
    res.json({ success: true, message: 'Comment removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Banner CRUD
exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ priority: -1, createdAt: -1 });
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getActiveBanners = async (req, res) => {
  try {
    const now = new Date();
    const banners = await Banner.find({
      isActive: true,
      $or: [{ endDate: { $gte: now } }, { endDate: null }],
    }).sort({ priority: -1 });
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const banner = await Banner.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found.' });
    res.json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Banner deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
