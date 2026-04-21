const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    summary: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    featuredImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      caption: { type: String, default: '' },
    },
    media: [
      {
        type: { type: String, enum: ['image', 'video'], required: true },
        url: { type: String, required: true },
        publicId: { type: String },
        caption: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'published'],
      default: 'draft',
    },
    rejectionReason: { type: String, default: '' },
    publishedAt: { type: Date },
    isBreaking: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isHeadline: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    readTime: { type: Number, default: 1 }, // minutes
    source: { type: String, default: '' },
    sourceUrl: { type: String, default: '' },
    location: { type: String, default: '' },
    allowComments: { type: Boolean, default: true },
    isEditorsPick: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-generate slug from title
newsSchema.pre('save', async function (next) {
  if (this.isModified('title') && !this.slug) {
    const slugify = require('slugify');
    let baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;
    while (await mongoose.model('News').findOne({ slug })) {
      slug = `${baseSlug}-${count}`;
      count++;
    }
    this.slug = slug;
  }
  // Calculate read time (avg 200 words/min)
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / 200);
  }
  next();
});

// Update likesCount
newsSchema.pre('save', function (next) {
  if (this.isModified('likes')) {
    this.likesCount = this.likes.length;
  }
  next();
});

newsSchema.index({ title: 'text', content: 'text', tags: 'text' });
newsSchema.index({ category: 1, status: 1 });
newsSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('News', newsSchema);
