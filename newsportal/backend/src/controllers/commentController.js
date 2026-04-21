const Comment = require('../models/Comment');
const News = require('../models/News');

// @GET /api/comments/:newsId
exports.getComments = async (req, res) => {
  try {
    const { newsId } = req.params;
    const comments = await Comment.find({
      news: newsId,
      parentComment: null,
      isDeleted: false,
      isApproved: true,
    })
      .populate('author', 'firstName lastName avatar role')
      .populate({
        path: 'replies',
        match: { isDeleted: false },
        populate: { path: 'author', select: 'firstName lastName avatar role' },
      })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/comments
exports.createComment = async (req, res) => {
  try {
    const { newsId, content, parentCommentId } = req.body;
    if (!newsId || !content) {
      return res.status(400).json({ success: false, message: 'News ID and content are required.' });
    }
    const news = await News.findById(newsId);
    if (!news) return res.status(404).json({ success: false, message: 'News not found.' });
    if (!news.allowComments) {
      return res.status(403).json({ success: false, message: 'Comments are disabled for this article.' });
    }
    const comment = await Comment.create({
      news: newsId,
      author: req.user._id,
      content,
      parentComment: parentCommentId || null,
    });

    // If reply, add to parent's replies
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, { $push: { replies: comment._id } });
    }

    // Update news comment count
    await News.findByIdAndUpdate(newsId, { $inc: { commentsCount: 1 } });

    const populated = await Comment.findById(comment._id).populate('author', 'firstName lastName avatar role');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/comments/:id
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    const isOwner = comment.author.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    comment.isDeleted = true;
    comment.content = '[Comment deleted]';
    await comment.save();

    await News.findByIdAndUpdate(comment.news, { $inc: { commentsCount: -1 } });

    res.json({ success: true, message: 'Comment deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/comments/:id/like
exports.likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    const hasLiked = comment.likes.includes(req.user._id);
    if (hasLiked) {
      comment.likes.pull(req.user._id);
    } else {
      comment.likes.push(req.user._id);
    }
    await comment.save();
    res.json({ success: true, liked: !hasLiked, likesCount: comment.likes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
