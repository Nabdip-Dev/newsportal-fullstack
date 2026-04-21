import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { newsAPI } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  published: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  approved: 'bg-blue-100 text-blue-700',
};

const STATUS_ICON = {
  draft: '📝',
  pending: '⏳',
  published: '✅',
  rejected: '❌',
  approved: '👍',
};

export default function MyNews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [submitting, setSubmitting] = useState(null);

  const fetchArticles = async (status = '', pg = 1) => {
    setLoading(true);
    try {
      const params = { limit: 10, page: pg, sort: '-createdAt' };
      if (status) params.status = status;
      const res = await newsAPI.getAll(params);
      setArticles(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch {
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  // Load counts for all statuses
  const loadCounts = async () => {
    try {
      const statuses = ['draft', 'pending', 'published', 'rejected'];
      const results = await Promise.all(
        statuses.map(s => newsAPI.getAll({ status: s, limit: 1 }).then(r => ({ s, count: r.data.pagination?.total || 0 })))
      );
      const c = {};
      results.forEach(({ s, count }) => { c[s] = count; });
      setCounts(c);
    } catch {}
  };

  useEffect(() => {
    fetchArticles(activeFilter, 1);
    setPage(1);
  }, [activeFilter]);

  useEffect(() => {
    loadCounts();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this article? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await newsAPI.delete(id);
      toast.success('Article deleted');
      fetchArticles(activeFilter, page);
      loadCounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleSubmit = async (id) => {
    setSubmitting(id);
    try {
      await newsAPI.submit(id);
      toast.success('Submitted for admin approval!');
      fetchArticles(activeFilter, page);
      loadCounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(null);
    }
  };

  const filters = [
    { key: '', label: 'All', count: Object.values(counts).reduce((a, b) => a + b, 0) },
    { key: 'draft', label: 'Drafts', count: counts.draft || 0 },
    { key: 'pending', label: 'Pending', count: counts.pending || 0 },
    { key: 'published', label: 'Published', count: counts.published || 0 },
    { key: 'rejected', label: 'Rejected', count: counts.rejected || 0 },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-headline font-bold text-2xl text-gray-900">My Articles</h2>
        <Link to="/reporter/create"
          className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium font-sans hover:bg-primary-700 transition-colors">
          + New Article
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-sans font-medium transition-colors ${activeFilter === f.key
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600'
            }`}
          >
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeFilter === f.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Articles list */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-5 flex gap-4 animate-pulse">
                <div className="skeleton w-20 h-16 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                  <div className="skeleton h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="font-headline text-xl text-gray-700 mb-2">No articles found</p>
            <p className="text-gray-400 font-sans text-sm mb-5">
              {activeFilter ? `No ${activeFilter} articles yet.` : 'Start writing your first article!'}
            </p>
            <Link to="/reporter/create"
              className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium font-sans hover:bg-primary-700 transition-colors">
              Write an Article
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {articles.map(article => (
              <div key={article._id} className="p-5 flex gap-4 hover:bg-gray-50/40 transition-colors">
                {/* Thumbnail */}
                <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {article.featuredImage?.url ? (
                    <img src={article.featuredImage.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📰</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sans font-semibold text-sm text-gray-900 line-clamp-2 leading-snug mb-1">
                        {article.title}
                      </h3>
                      <p className="font-sans text-xs text-gray-400 line-clamp-1 mb-2">
                        {article.summary}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-sans flex items-center gap-1 ${STATUS_STYLE[article.status]}`}>
                          <span>{STATUS_ICON[article.status]}</span>
                          {article.status}
                        </span>
                        {article.category?.name && (
                          <span className="text-xs text-gray-400 font-sans">
                            {article.category.icon} {article.category.name}
                          </span>
                        )}
                        <span className="text-xs text-gray-300 font-sans">·</span>
                        <span className="text-xs text-gray-400 font-sans">
                          {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                        </span>
                        {article.status === 'published' && (
                          <>
                            <span className="text-xs text-gray-300 font-sans">·</span>
                            <span className="text-xs text-gray-400 font-sans">
                              👁 {article.views?.toLocaleString() || 0} views
                            </span>
                            <span className="text-xs text-gray-300 font-sans">·</span>
                            <span className="text-xs text-gray-400 font-sans">
                              ❤ {article.likesCount || 0}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* View live */}
                      {article.status === 'published' && (
                        <Link to={`/news/${article.slug}`} target="_blank"
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                          title="View live">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      )}

                      {/* Edit */}
                      {['draft', 'rejected', 'pending'].includes(article.status) && (
                        <Link to={`/reporter/edit/${article._id}`}
                          className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-primary-50"
                          title="Edit">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                      )}

                      {/* Submit for approval (draft/rejected only) */}
                      {['draft', 'rejected'].includes(article.status) && (
                        <button
                          onClick={() => handleSubmit(article._id)}
                          disabled={submitting === article._id}
                          className="p-1.5 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50 disabled:opacity-50"
                          title="Submit for approval">
                          {submitting === article._id ? (
                            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                      )}

                      {/* Delete (not published) */}
                      {article.status !== 'published' && (
                        <button
                          onClick={() => handleDelete(article._id)}
                          disabled={deleting === article._id}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50"
                          title="Delete">
                          {deleting === article._id ? (
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rejection reason */}
                  {article.status === 'rejected' && article.rejectionReason && (
                    <div className="mt-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                      <p className="text-xs text-red-600 font-sans">
                        <strong>Rejection reason:</strong> {article.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-center gap-2">
            <button onClick={() => { setPage(p => p - 1); fetchArticles(activeFilter, page - 1); }}
              disabled={page === 1}
              className="w-8 h-8 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-primary-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center">
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => { setPage(p); fetchArticles(activeFilter, p); }}
                className={`w-8 h-8 rounded-full text-sm font-sans ${page === p ? 'bg-primary-600 text-white' : 'border border-gray-200 text-gray-600 hover:border-primary-300'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => { setPage(p => p + 1); fetchArticles(activeFilter, page + 1); }}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-primary-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center">
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
