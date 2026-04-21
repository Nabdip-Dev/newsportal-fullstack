import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { newsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const STATUS_STYLE = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  published: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  approved: 'bg-blue-100 text-blue-700',
};

export default function ReporterDashboard() {
  const { user } = useAuth();
  const [recent, setRecent] = useState([]);
  const [stats, setStats] = useState({ draft: 0, pending: 0, published: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    newsAPI.getAll({ limit: 10, sort: '-createdAt' })
      .then(res => {
        const data = res.data.data || [];
        setRecent(data.slice(0, 6));
        const counts = { draft: 0, pending: 0, published: 0, rejected: 0 };
        data.forEach(n => { if (counts[n.status] !== undefined) counts[n.status]++; });
        setStats(counts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { icon: '📝', label: 'Drafts', key: 'draft', color: 'bg-gray-50 border-gray-200', textColor: 'text-gray-700' },
    { icon: '⏳', label: 'Pending', key: 'pending', color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-700' },
    { icon: '✅', label: 'Published', key: 'published', color: 'bg-green-50 border-green-200', textColor: 'text-green-700' },
    { icon: '❌', label: 'Rejected', key: 'rejected', color: 'bg-red-50 border-red-200', textColor: 'text-red-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline font-bold text-2xl mb-1">
              Welcome back, {user?.firstName}! ✍️
            </h2>
            <p className="text-primary-100 text-sm font-sans">
              Ready to write your next story?
            </p>
          </div>
          <Link
            to="/reporter/create"
            className="px-5 py-2.5 bg-white text-primary-600 rounded-xl text-sm font-semibold font-sans hover:bg-primary-50 transition-colors shadow-sm"
          >
            + New Article
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ icon, label, key, color, textColor }) => (
          <div key={key} className={`rounded-xl border p-4 text-center ${color}`}>
            <div className="text-2xl mb-2">{icon}</div>
            <div className={`font-headline font-bold text-3xl ${textColor} mb-0.5`}>
              {loading ? '—' : stats[key]}
            </div>
            <div className="text-xs text-gray-500 font-sans uppercase tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/reporter/create"
          className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:border-primary-300 hover:shadow-sm transition-all group">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-primary-100 transition-colors">✏️</div>
          <div>
            <p className="font-sans font-semibold text-sm text-gray-800">Write Article</p>
            <p className="font-sans text-xs text-gray-400">Create new content</p>
          </div>
        </Link>
        <Link to="/reporter/my-news"
          className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:border-primary-300 hover:shadow-sm transition-all group">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-blue-100 transition-colors">📰</div>
          <div>
            <p className="font-sans font-semibold text-sm text-gray-800">My Articles</p>
            <p className="font-sans text-xs text-gray-400">Manage your work</p>
          </div>
        </Link>
        <Link to="/"
          className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:border-primary-300 hover:shadow-sm transition-all group">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-green-100 transition-colors">🌐</div>
          <div>
            <p className="font-sans font-semibold text-sm text-gray-800">View Site</p>
            <p className="font-sans text-xs text-gray-400">See live portal</p>
          </div>
        </Link>
      </div>

      {/* Recent articles */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-sans font-semibold text-gray-800">Recent Articles</h3>
          <Link to="/reporter/my-news" className="text-xs text-primary-600 hover:underline font-sans">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="px-5 py-4 flex gap-3 animate-pulse">
                <div className="skeleton flex-1 h-4" />
                <div className="skeleton w-16 h-4" />
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-sans text-sm text-gray-500 mb-3">No articles yet</p>
            <Link to="/reporter/create"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-sans hover:bg-primary-700">
              Write your first article
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map(item => (
              <div key={item._id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-medium text-gray-800 truncate">{item.title}</p>
                  <p className="font-sans text-xs text-gray-400 mt-0.5">
                    {item.category?.name} · {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                  {item.status === 'rejected' && item.rejectionReason && (
                    <p className="font-sans text-xs text-red-500 mt-1 truncate">
                      Reason: {item.rejectionReason}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-sans flex-shrink-0 ${STATUS_STYLE[item.status]}`}>
                  {item.status}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {item.status === 'published' && (
                    <Link to={`/news/${item.slug}`} target="_blank"
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="View live">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                  )}
                  {['draft', 'rejected'].includes(item.status) && (
                    <Link to={`/reporter/edit/${item._id}`}
                      className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors" title="Edit">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
        <h4 className="font-sans font-semibold text-blue-800 text-sm mb-2">💡 Reporter Tips</h4>
        <ul className="space-y-1 text-xs text-blue-700 font-sans">
          <li>• Write articles as <strong>draft</strong> first, then submit for approval when ready.</li>
          <li>• Add a <strong>featured image URL</strong> to make your article stand out.</li>
          <li>• Rejected articles can be <strong>edited and resubmitted</strong>.</li>
          <li>• Use descriptive <strong>tags</strong> to help readers find your content.</li>
        </ul>
      </div>
    </div>
  );
}
