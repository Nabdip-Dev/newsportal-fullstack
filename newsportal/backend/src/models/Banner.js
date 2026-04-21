const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['announcement', 'breaking', 'advertisement', 'hero', 'ticker'],
      required: true,
    },
    content: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    linkUrl: { type: String, default: '' },
    position: {
      type: String,
      enum: ['top', 'hero', 'sidebar', 'footer', 'popup', 'inline'],
      default: 'top',
    },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
    priority: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    backgroundColor: { type: String, default: '#e11d48' },
    textColor: { type: String, default: '#ffffff' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);
