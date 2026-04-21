import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', bio: user?.bio || '' });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('firstName', form.firstName);
      formData.append('lastName', form.lastName);
      formData.append('bio', form.bio);
      if (avatar) formData.append('avatar', avatar);
      const res = await authAPI.updateProfile(formData);
      updateUser(res.data.data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyReporter = async () => {
    setApplyLoading(true);
    try {
      await authAPI.applyReporter();
      updateUser({ ...user, reporterStatus: 'pending' });
      toast.success('Application submitted! Awaiting admin approval.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setApplyLoading(false);
    }
  };

  const roleBadge = { user: 'bg-gray-100 text-gray-700', reporter: 'bg-blue-100 text-blue-700', admin: 'bg-primary-100 text-primary-700' };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {/* Cover */}
        <div className="h-28 bg-gradient-to-r from-primary-600 to-primary-800" />

        {/* Profile info */}
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl border-4 border-white overflow-hidden bg-primary-100 shadow-lg">
                {preview ? (
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary-600 font-bold text-2xl font-headline">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                )}
              </div>
              {editing && (
                <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer shadow">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              )}
            </div>
            <button onClick={() => setEditing(!editing)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium font-sans text-gray-700 hover:border-primary-400 hover:text-primary-600 transition-colors">
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 font-sans">First Name</label>
                  <input type="text" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none focus:border-primary-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 font-sans">Last Name</label>
                  <input type="text" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none focus:border-primary-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 font-sans">Bio</label>
                <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none focus:border-primary-400 resize-none"
                  placeholder="Tell us about yourself..." />
              </div>
              <button type="submit" disabled={loading}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium font-sans hover:bg-primary-700 disabled:opacity-60 transition-colors">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-headline font-bold text-2xl text-gray-900">{user?.firstName} {user?.lastName}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full font-sans font-medium capitalize ${roleBadge[user?.role] || 'bg-gray-100 text-gray-700'}`}>{user?.role}</span>
              </div>
              <p className="text-gray-400 text-sm font-sans mb-2">{user?.email}</p>
              {user?.bio && <p className="text-gray-600 font-sans text-sm mb-3">{user?.bio}</p>}
              <p className="text-xs text-gray-400 font-sans">Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'N/A'}</p>
            </div>
          )}

          {/* Reporter apply section */}
          {user?.role === 'user' && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans font-medium text-sm text-gray-800 mb-0.5">Become a Reporter</p>
                  <p className="text-xs text-gray-400 font-sans">Write and publish news articles on our platform.</p>
                </div>
                {user.reporterStatus === 'pending' ? (
                  <span className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-medium font-sans">Pending Review</span>
                ) : user.reporterStatus === 'rejected' ? (
                  <div className="text-right">
                    <span className="block text-xs text-red-500 mb-1 font-sans">Application rejected</span>
                    <button onClick={handleApplyReporter} disabled={applyLoading} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium font-sans hover:bg-primary-700">Reapply</button>
                  </div>
                ) : (
                  <button onClick={handleApplyReporter} disabled={applyLoading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium font-sans hover:bg-primary-700 disabled:opacity-60 transition-colors">
                    {applyLoading ? 'Applying...' : 'Apply Now'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
