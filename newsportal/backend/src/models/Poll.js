const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [
      {
        text: { type: String, required: true },
        votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        voteCount: { type: Number, default: 0 },
      },
    ],
    isActive: { type: Boolean, default: true },
    endDate: { type: Date },
    totalVotes: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Poll', pollSchema);
