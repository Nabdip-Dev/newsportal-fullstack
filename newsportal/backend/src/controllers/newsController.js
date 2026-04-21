const News = require('../models/News');
const Category = require('../models/Category');
const { sendApprovalEmail } = require('../utils/email');

// @GET /api/news - public
exports.getNews = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, tag, search, sort = '-publishedAt', featured, breaking, status } = req.query;
    const query = {};

    // Public only sees published
    const isAdmin = req.user && req.user.role === 'admin';
    const isReporter = req.user && req.user.role === 'reporter';

    if (status && isAdmin) {
      query.status = status;
    } else if (isReporter && status) {
      query.status = status;
      query.author = req.user._id;
    } else {
      query.status = 'published';
    }

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) query.category = cat._id;
    }
    if (tag) query.tags = { $in: [tag.toLowerCase()] };
    if (search) query.$text = { $search: search };
    if (featured === 'true') query.isFeatured = true;
    if (breaking === 'true') query.isBreaking = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await News.countDocuments(query);
    const news = await News.find(query)
      .populate('author', 'firstName lastName avatar role')
      .populate('category', 'name slug color icon')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-content -media');

    res.json({
      success: true,
      data: news,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/news/:slug
exports.getNewsBySlug = async (req, res) => {
  try {
    const news = await News.findOne({ slug: req.params.slug })
      .populate('author', 'firstName lastName avatar role bio')
      .populate('category', 'name slug color icon');

    if (!news) return res.status(404).json({ success: false, message: 'News not found.' });

    // Only published for public
    if (news.status !== 'published') {
      const isOwner = req.user && news.author._id.equals(req.user._id);
      const isAdmin = req.user && req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    // Increment views
    await News.findByIdAndUpdate(news._id, { $inc: { views: 1 } });

    // Get related news
    const related = await News.find({
      category: news.category._id,
      status: 'published',
      _id: { $ne: news._id },
    })
      .limit(4)
      .populate('author', 'firstName lastName avatar')
      .populate('category', 'name slug color')
      .select('-content');

    res.json({ success: true, data: { ...news.toObject(), views: news.views + 1 }, related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/news
exports.createNews = async (req, res) => {
  try {
    const { title, summary, content, category, tags, source, sourceUrl, location, allowComments } = req.body;
    if (!title || !summary || !content || !category) {
      return res.status(400).json({ success: false, message: 'Title, summary, content, and category are required.' });
    }
    const catExists = await Category.findById(category);
    if (!catExists) return res.status(400).json({ success: false, message: 'Category not found.' });

    const newsData = {
      title, summary, content, category,
      author: req.user._id,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      source, sourceUrl, location,
      allowComments: allowComments !== 'false',
    };

    if (req.body.featuredImageUrl) {
      newsData.featuredImage = { url: req.body.featuredImageUrl, caption: req.body.featuredImageCaption || '' };
    }

    const news = await News.create(newsData);
    await Category.findByIdAndUpdate(category, { $inc: { newsCount: 1 } });

    res.status(201).json({ success: true, message: 'News created as draft.', data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/news/:id
exports.updateNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ success: false, message: 'News not found.' });

    const isAdmin = req.user.role === 'admin';
    const isOwner = news.author.equals(req.user._id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Only admin can change status to published
    const allowedUpdates = ['title', 'summary', 'content', 'category', 'tags', 'source', 'sourceUrl', 'location', 'allowComments', 'featuredImage'];
    if (isAdmin) allowedUpdates.push('status', 'isBreaking', 'isFeatured', 'isHeadline', 'isEditorsPick', 'publishedAt');

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.status === 'published' && !news.publishedAt) {
      updates.publishedAt = new Date();
    }

    const updated = await News.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('author', 'firstName lastName avatar')
      .populate('category', 'name slug color');

    res.json({ success: true, message: 'News updated.', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/news/:id
exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ success: false, message: 'News not found.' });

    const isAdmin = req.user.role === 'admin';
    const isOwner = news.author.equals(req.user._id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await news.deleteOne();
    await Category.findByIdAndUpdate(news.category, { $inc: { newsCount: -1 } });

    res.json({ success: true, message: 'News deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/news/:id/submit
exports.submitForApproval = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ success: false, message: 'News not found.' });
    if (!news.author.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    if (!['draft', 'rejected'].includes(news.status)) {
      return res.status(400).json({ success: false, message: 'News is already submitted or published.' });
    }
    news.status = 'pending';
    await news.save();
    res.json({ success: true, message: 'News submitted for approval.', data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/news/:id/approve (Admin)
exports.approveNews = async (req, res) => {
  try {
    const { action, reason } = req.body; // action: 'approve' | 'reject'
    const news = await News.findById(req.params.id).populate('author', 'email firstName');
    if (!news) return res.status(404).json({ success: false, message: 'News not found.' });

    if (action === 'approve') {
      news.status = 'published';
      news.publishedAt = new Date();
    } else if (action === 'reject') {
      news.status = 'rejected';
      news.rejectionReason = reason || 'Does not meet our editorial standards.';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action.' });
    }
    await news.save();

    // Send email notification
    await sendApprovalEmail(
      news.author.email,
      news.author.firstName,
      'news',
      action === 'approve' ? 'approved' : 'rejected',
      news.rejectionReason
    ).catch(console.error);

    res.json({ success: true, message: `News ${action}d.`, data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/news/:id/like
exports.toggleLike = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ success: false, message: 'News not found.' });

    const userId = req.user._id;
    const hasLiked = news.likes.includes(userId);

    if (hasLiked) {
      news.likes.pull(userId);
    } else {
      news.likes.push(userId);
    }
    await news.save();

    res.json({
      success: true,
      liked: !hasLiked,
      likesCount: news.likes.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/news/:id/upload-image
exports.uploadNewsImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    res.json({
      success: true,
      message: 'Image uploaded.',
      data: { url: req.file.path, publicId: req.file.filename },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/news/trending
exports.getTrending = async (req, res) => {
  try {
    const news = await News.find({ status: 'published' })
      .sort({ views: -1, likesCount: -1 })
      .limit(10)
      .populate('author', 'firstName lastName avatar')
      .populate('category', 'name slug color')
      .select('-content');
    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/news/stats (Admin)
exports.getStats = async (req, res) => {
  try {
    const [total, published, pending, draft, rejected] = await Promise.all([
      News.countDocuments(),
      News.countDocuments({ status: 'published' }),
      News.countDocuments({ status: 'pending' }),
      News.countDocuments({ status: 'draft' }),
      News.countDocuments({ status: 'rejected' }),
    ]);
    const topViewed = await News.find({ status: 'published' }).sort({ views: -1 }).limit(5).select('title views slug');
    res.json({ success: true, data: { total, published, pending, draft, rejected, topViewed } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
