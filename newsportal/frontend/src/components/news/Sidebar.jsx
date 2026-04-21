import { useState, useEffect } from 'react';
import { newsAPI, pollAPI } from '../../services/api';
import { NewsCardHorizontal } from './NewsCard';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

function TrendingSection() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    newsAPI.trending()
      .then(res => setTrending(res.data.data?.slice(0, 6) || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <span className="text-primary-600">🔥</span>
        <h3 className="font-headline font-bold text-base text-gray-900">Trending Now</h3>
      </div>
      <div className="p-4 space-y-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="skeleton w-8 h-4 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-3/4" />
              </div>
            </div>
          ))
        ) : (
          trending.map((item, i) => (
            <NewsCardHorizontal key={item._id} article={item} rank={i} />
          ))
        )}
      </div>
    </div>
  );
}

function PollSection() {
  const [polls, setPolls] = useState([]);
  const [voted, setVoted] = useState({});
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    pollAPI.getActive()
      .then(res => setPolls(res.data.data || []))
      .catch(() => {});
  }, []);

  const handleVote = async (pollId, optionIndex) => {
    if (!isAuthenticated) { toast.error('Please login to vote'); return; }
    if (voted[pollId] !== undefined) { toast.error('Already voted'); return; }
    try {
      const res = await pollAPI.vote(pollId, optionIndex);
      setPolls(prev => prev.map(p => p._id === pollId ? res.data.data : p));
      setVoted(prev => ({ ...prev, [pollId]: optionIndex }));
      toast.success('Vote recorded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Vote failed');
    }
  };

  if (!polls.length) return null;

  const poll = polls[0];
  const totalVotes = poll.totalVotes || 1;
  const hasVoted = voted[poll._id] !== undefined;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <span>📊</span>
        <h3 className="font-headline font-bold text-base text-gray-900">Today's Poll</h3>
      </div>
      <div className="p-4">
        <p className="font-sans font-medium text-gray-800 text-sm mb-3">{poll.question}</p>
        <div className="space-y-2">
          {poll.options.map((opt, i) => {
            const pct = Math.round((opt.voteCount / totalVotes) * 100);
            return (
              <button
                key={i}
                onClick={() => handleVote(poll._id, i)}
                disabled={hasVoted}
                className="w-full text-left group relative"
              >
                <div className={`relative rounded-lg border overflow-hidden transition-all ${hasVoted ? 'cursor-default' : 'hover:border-primary-400 cursor-pointer'} ${voted[poll._id] === i ? 'border-primary-500' : 'border-gray-200'}`}>
                  {hasVoted && (
                    <div
                      className="absolute inset-0 bg-primary-50 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  )}
                  <div className="relative flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-sans text-gray-700">{opt.text}</span>
                    {hasVoted && (
                      <span className="text-xs font-bold text-primary-600 font-sans">{pct}%</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3 font-sans text-center">{poll.totalVotes} votes cast</p>
      </div>
    </div>
  );
}

function AdBanner() {
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700">
      <div className="p-5 text-center">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-sans">Advertisement</div>
        <div className="w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center mb-3">
          <span className="text-gray-500 text-sm font-sans">Your Ad Here</span>
        </div>
        <p className="text-xs text-gray-400 font-sans">Reach thousands of daily readers</p>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="space-y-5">
      <TrendingSection />
      <PollSection />
      <AdBanner />
    </aside>
  );
}
