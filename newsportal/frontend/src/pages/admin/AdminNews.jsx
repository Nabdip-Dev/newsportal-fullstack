import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { newsAPI } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  published: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function AdminNews() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [news, setNews] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1');

  // ✅ FIX 1: useCallback (prevent unnecessary re-creation)
  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 20, page, sort: '-createdAt' };
      if (status) params.status = status;

      const res = await newsAPI.getAll(params);

      setNews(res.data?.data || []);
      setPagination(res.data?.pagination || {});
    } catch (err) {
      toast.error('Failed to load news');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  // ✅ FIX 2: debounce (prevent too many requests)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNews();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchNews]);

  const handleApprove = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await newsAPI.approve(id, { action: 'approve' });
      toast.success('News approved!');
      fetchNews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(prev => ({ ...prev, [rejectModal]: true }));
    try {
      await newsAPI.approve(rejectModal, {
        action: 'reject',
        reason: rejectReason
      });
      toast.success('News rejected');
      setRejectModal(null);
      setRejectReason('');
      fetchNews();
    } catch {
      toast.error('Failed');
    } finally {
      setActionLoading(prev => ({ ...prev, [rejectModal]: false }));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this article?')) return;
    try {
      await newsAPI.delete(id);
      toast.success('Deleted');
      fetchNews();
    } catch {
      toast.error('Failed');
    }
  };

  const STATUSES = ['', 'pending', 'published', 'draft', 'rejected'];

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setSearchParams(s ? { status: s } : {})}
            className={`px-3 py-1.5 rounded-full text-sm ${
              status === s
                ? 'bg-blue-600 text-white'
                : 'bg-white border text-gray-600'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th>Title</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan="4">Loading...</td>
            </tr>
          ) : news.length === 0 ? (
            <tr>
              <td colSpan="4">No news found</td>
            </tr>
          ) : (
            news.map(item => (
              <tr key={item._id}>
                <td>{item.title}</td>

                <td>
                  <span className={STATUS_COLORS[item.status]}>
                    {item.status}
                  </span>
                </td>

                <td>
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true
                  })}
                </td>

                <td>
                  <button onClick={() => handleApprove(item._id)}>
                    Approve
                  </button>

                  <button onClick={() => setRejectModal(item._id)}>
                    Reject
                  </button>

                  <button onClick={() => handleDelete(item._id)}>
                    Delete
                  </button>

                  <Link to={`/news/${item.slug}`} target="_blank">
                    View
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-5">
            <h2>Reject Reason</h2>

            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />

            <button onClick={handleReject}>Submit</button>
            <button onClick={() => setRejectModal(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}