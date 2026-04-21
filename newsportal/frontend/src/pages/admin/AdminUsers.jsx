import { useState, useEffect } from 'react';
import { adminAPI, categoryAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

// ═══════════════════ ADMIN USERS ═══════════════════
export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ role: '', reporterStatus: '', search: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetch = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filter };
      const res = await adminAPI.getUsers(params);
      setUsers(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, [page, filter]);

  const handleRoleChange = async (id, role) => {
    try {
      await adminAPI.updateUserRole(id, role);
      toast.success('Role updated');
      fetch();
    } catch { toast.error('Failed'); }
  };

  const handleToggleActive = async (id) => {
    try {
      await adminAPI.toggleUserActive(id);
      toast.success('Status updated');
      fetch();
    } catch { toast.error('Failed'); }
  };

  const handleReporterApprove = async (id, action) => {
    try {
      await adminAPI.approveReporter(id, action);
      toast.success(`Reporter ${action}d`);
      fetch();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input type="text" placeholder="Search users..." value={filter.search}
          onChange={e => setFilter(p => ({...p, search: e.target.value}))}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none focus:border-primary-400" />
        <select value={filter.role} onChange={e => setFilter(p => ({...p, role: e.target.value}))}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none">
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="reporter">Reporter</option>
          <option value="admin">Admin</option>
        </select>
        <select value={filter.reporterStatus} onChange={e => setFilter(p => ({...p, reporterStatus: e.target.value}))}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none">
          <option value="">All Status</option>
          <option value="pending">Pending Reporter</option>
          <option value="approved">Approved Reporter</option>
          <option value="rejected">Rejected Reporter</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['User', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 font-sans uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array(8).fill(0).map((_, i) => <tr key={i}><td colSpan={5}><div className="skeleton h-4 m-4" /></td></tr>)
            ) : users.map(u => (
              <tr key={u._id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex-shrink-0 overflow-hidden">
                      {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-primary-600 font-bold text-xs">{u.firstName?.[0]}{u.lastName?.[0]}</div>}
                    </div>
                    <div>
                      <p className="font-sans text-sm font-medium text-gray-800">{u.firstName} {u.lastName}</p>
                      <p className="font-sans text-xs text-gray-400">{formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3"><p className="font-sans text-sm text-gray-600">{u.email}</p></td>
                <td className="px-5 py-3">
                  <select value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 font-sans focus:outline-none focus:border-primary-400">
                    <option value="user">User</option>
                    <option value="reporter">Reporter</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-sans inline-flex w-fit ${u.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {u.reporterStatus === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => handleReporterApprove(u._id, 'approve')} className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-sans hover:bg-green-200">✓</button>
                        <button onClick={() => handleReporterApprove(u._id, 'reject')} className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-sans hover:bg-red-200">✗</button>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => handleToggleActive(u._id)}
                    className={`text-xs px-2 py-1 rounded-lg font-sans ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex gap-2 justify-center">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-full text-xs font-sans ${page === p ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════ ADMIN COMMENTS ═══════════════════
export function AdminComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getComments({ page, limit: 20 });
      setComments(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, [page]);

  const handleDelete = async (id) => {
    if (!confirm('Remove comment?')) return;
    try {
      await adminAPI.deleteComment(id);
      toast.success('Comment removed');
      fetch();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['Comment', 'Author', 'Article', 'Date', ''].map(h => (
              <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 font-sans uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {loading ? (
            Array(10).fill(0).map((_, i) => <tr key={i}><td colSpan={5}><div className="skeleton h-4 m-4" /></td></tr>)
          ) : comments.map(c => (
            <tr key={c._id} className="hover:bg-gray-50/50">
              <td className="px-5 py-3 max-w-xs"><p className="font-sans text-sm text-gray-700 line-clamp-2">{c.content}</p></td>
              <td className="px-5 py-3"><p className="font-sans text-sm text-gray-600">{c.author?.firstName} {c.author?.lastName}</p><p className="font-sans text-xs text-gray-400">{c.author?.email}</p></td>
              <td className="px-5 py-3"><p className="font-sans text-xs text-gray-600 line-clamp-1 max-w-[120px]">{c.news?.title}</p></td>
              <td className="px-5 py-3"><p className="font-sans text-xs text-gray-400">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</p></td>
              <td className="px-5 py-3">
                <button onClick={() => handleDelete(c._id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════ ADMIN CATEGORIES ═══════════════════
export function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#e11d48', icon: '📰' });

  const fetch = async () => {
    const res = await categoryAPI.getAll();
    setCategories(res.data.data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await categoryAPI.update(editing._id, form);
        toast.success('Updated!');
      } else {
        await categoryAPI.create(form);
        toast.success('Created!');
      }
      setModal(false); setEditing(null); setForm({ name: '', description: '', color: '#e11d48', icon: '📰' });
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete category?')) return;
    try { await categoryAPI.delete(id); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium font-sans hover:bg-primary-700">
          + Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />) :
         categories.map(cat => (
          <div key={cat._id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: cat.color + '20' }}>
              {cat.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-gray-800">{cat.name}</p>
              <p className="font-sans text-xs text-gray-400">{cat.newsCount} articles</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setEditing(cat); setForm({ name: cat.name, description: cat.description, color: cat.color, icon: cat.icon }); setModal(true); }}
                className="p-1.5 text-gray-400 hover:text-blue-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button onClick={() => handleDelete(cat._id)} className="p-1.5 text-gray-400 hover:text-red-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-headline font-bold text-lg mb-4">{editing ? 'Edit' : 'New'} Category</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Name" required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-primary-400" />
              <input type="text" placeholder="Description" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-primary-400" />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 font-sans mb-1 block">Color</label>
                  <input type="color" value={form.color} onChange={e => setForm(p => ({...p, color: e.target.value}))}
                    className="w-full h-10 border border-gray-200 rounded-xl cursor-pointer" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 font-sans mb-1 block">Icon (emoji)</label>
                  <input type="text" value={form.icon} onChange={e => setForm(p => ({...p, icon: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none text-center text-xl" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setModal(false); setEditing(null); }} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-sans hover:border-gray-300">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-xl text-sm font-sans hover:bg-primary-700">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════ ADMIN BANNERS ═══════════════════
export function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'announcement', content: '', position: 'top', backgroundColor: '#1d4ed8', textColor: '#ffffff', linkUrl: '', isActive: true });

  const fetch = async () => { const res = await adminAPI.getBanners(); setBanners(res.data.data || []); setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await adminAPI.createBanner(form); toast.success('Banner created'); setModal(false); fetch(); }
    catch { toast.error('Failed'); }
  };

  const handleToggle = async (id, isActive) => {
    try { await adminAPI.updateBanner(id, { isActive: !isActive }); fetch(); }
    catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete banner?')) return;
    try { await adminAPI.deleteBanner(id); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium font-sans hover:bg-primary-700">+ New Banner</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-gray-50 border-b border-gray-100">{['Title','Type','Position','Status','Actions'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 font-sans uppercase tracking-wide">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? Array(4).fill(0).map((_, i) => <tr key={i}><td colSpan={5}><div className="skeleton h-4 m-4" /></td></tr>) :
             banners.map(b => (
              <tr key={b._id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3"><p className="font-sans text-sm font-medium text-gray-800">{b.title}</p><p className="font-sans text-xs text-gray-400 line-clamp-1">{b.content}</p></td>
                <td className="px-5 py-3"><span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-sans">{b.type}</span></td>
                <td className="px-5 py-3"><span className="font-sans text-sm text-gray-600">{b.position}</span></td>
                <td className="px-5 py-3">
                  <button onClick={() => handleToggle(b._id, b.isActive)} className={`text-xs px-2 py-1 rounded-full font-sans ${b.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {b.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => handleDelete(b._id)} className="p-1.5 text-gray-400 hover:text-red-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-headline font-bold text-lg mb-4">New Banner</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Title*" required value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-primary-400" />
              <textarea placeholder="Content" value={form.content} onChange={e => setForm(p=>({...p,content:e.target.value}))} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-primary-400 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-sans mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none">
                    {['announcement','breaking','advertisement','hero','ticker'].map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-sans mb-1 block">Position</label>
                  <select value={form.position} onChange={e => setForm(p=>({...p,position:e.target.value}))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none">
                    {['top','hero','sidebar','footer','popup','inline'].map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <input type="url" placeholder="Link URL (optional)" value={form.linkUrl} onChange={e => setForm(p=>({...p,linkUrl:e.target.value}))} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none" />
              <div className="flex gap-3">
                <div className="flex-1"><label className="text-xs text-gray-500 font-sans mb-1 block">BG Color</label><input type="color" value={form.backgroundColor} onChange={e=>setForm(p=>({...p,backgroundColor:e.target.value}))} className="w-full h-9 border border-gray-200 rounded-xl cursor-pointer" /></div>
                <div className="flex-1"><label className="text-xs text-gray-500 font-sans mb-1 block">Text Color</label><input type="color" value={form.textColor} onChange={e=>setForm(p=>({...p,textColor:e.target.value}))} className="w-full h-9 border border-gray-200 rounded-xl cursor-pointer" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-sans">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-xl text-sm font-sans hover:bg-primary-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
