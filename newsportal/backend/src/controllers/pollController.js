const Poll = require('../models/Poll');

exports.getActivePolls = async (req, res) => {
  try {
    const polls = await Poll.find({ isActive: true }).sort({ createdAt: -1 }).limit(3);
    res.json({ success: true, data: polls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createPoll = async (req, res) => {
  try {
    const { question, options, endDate } = req.body;
    if (!question || !options || options.length < 2) {
      return res.status(400).json({ success: false, message: 'Question and at least 2 options required.' });
    }
    const poll = await Poll.create({
      question,
      options: options.map((o) => ({ text: o })),
      endDate,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: poll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.votePoll = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found.' });
    if (!poll.isActive) return res.status(400).json({ success: false, message: 'Poll is closed.' });

    const userId = req.user._id;
    const alreadyVoted = poll.options.some((o) => o.votes.includes(userId));
    if (alreadyVoted) return res.status(400).json({ success: false, message: 'Already voted.' });

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ success: false, message: 'Invalid option.' });
    }

    poll.options[optionIndex].votes.push(userId);
    poll.options[optionIndex].voteCount++;
    poll.totalVotes++;
    await poll.save();

    res.json({ success: true, message: 'Vote recorded.', data: poll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
