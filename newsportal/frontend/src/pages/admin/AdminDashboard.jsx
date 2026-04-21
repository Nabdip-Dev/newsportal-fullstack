import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

function StatCard({ icon, label, value, color, link }) {
  return (
    <Link to={link || '#'} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${color}`}>{icon}</div>
        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </div>
      <div className="text-3xl font-headline font-bold text-gray-900 mb-0.5">{value ?? '—'}</div>
      <div className="text-xs text-gray-400 font-sans uppercase tracking-wide">{label}</div>
    </Link>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
      </div>
    </div>
  );

  const { stats, recentNews, recentUsers, topNews } = data || {};

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon="👥" label="Total Users" value={stats?.totalUsers} color="bg-blue-50" link="/admin/users" />
        <StatCard icon="📰" label="Total News" value={stats?.totalNews} color="bg-green-50" link="/admin/news" />
        <StatCard icon="⏳" label="Pending Review" value={stats?.pendingNews} color="bg-yellow-50" link="/admin/news?status=pending" />
        <StatCard icon="🏷️" label="Categories" value={stats?.totalCategories} color="bg-purple-50" link="/admin/categories" />
        <StatCard icon="✍️" label="Reporters" value={stats?.reporters} color="bg-pink-50" link="/admin/users?role=reporter" />
        <StatCard icon="🔔" label="Pending Reporters" value={stats?.pendingReporters} color="bg-orange-50" link="/admin/users?reporterStatus=pending" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending News */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-sans font-semibold text-gray-800">Pending Approval</h3>
            <Link to="/admin/news?status=pending" className="text-xs text-primary-600 hover:underline font-sans">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentNews?.length === 0 && <p className="px-5 py-8 text-sm text-gray-400 font-sans text-center">No pending articles 🎉</p>}
            {recentNews?.map(item => (
              <div key={item._id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-medium text-gray-800 truncate">{item.title}</p>
                  <p className="font-sans text-xs text-gray-400">by {item.author?.firstName} {item.author?.lastName} · {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full font-sans">pending</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-sans font-semibold text-gray-800">Recent Users</h3>
            <Link to="/admin/users" className="text-xs text-primary-600 hover:underline font-sans">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers?.map(u => (
              <div key={u._id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex-shrink-0 overflow-hidden">
                  {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-primary-600 font-bold text-xs">{u.firstName?.[0]}{u.lastName?.[0]}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-medium text-gray-800">{u.firstName} {u.lastName}</p>
                  <p className="font-sans text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-sans capitalize ${u.role === 'admin' ? 'bg-primary-50 text-primary-700' : u.role === 'reporter' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500'}`}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top viewed */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-sans font-semibold text-gray-800">Top Viewed Articles</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {topNews?.map((item, i) => (
            <div key={item._id} className="px-5 py-3 flex items-center gap-3">
              <span className="font-headline font-bold text-xl text-gray-200 w-7 text-center">{i + 1}</span>
              <div className="flex-1">
                <Link to={`/news/${item.slug}`} className="font-sans text-sm font-medium text-gray-800 hover:text-primary-600 transition-colors">{item.title}</Link>
              </div>
              <span className="text-xs text-gray-400 font-sans">{item.views?.toLocaleString()} views</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
