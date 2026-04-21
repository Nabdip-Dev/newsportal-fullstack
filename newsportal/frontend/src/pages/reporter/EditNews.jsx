import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { newsAPI, categoryAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function EditNews() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [originalStatus, setOriginalStatus] = useState('');

  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '',
    category: '',
    tags: '',
    source: '',
    sourceUrl: '',
    location: '',
    allowComments: true,
    featuredImageUrl: '',
    featuredImageCaption: '',
  });

  useEffect(() => {
    Promise.all([
      newsAPI.getAll({ limit: 1 }), // dummy to confirm token
      categoryAPI.getAll(),
    ]).then(([, catRes]) => {
      setCategories(catRes.data.data || []);
    });

    // Load article by fetching all reporter news and filtering
    // We use a workaround: get news by slug is public, but we need by ID
    // We'll fetch pending/draft news
    const loadArticle = async () => {
      try {
        // Try getting the article from the reporter's own list
        for (const status of ['draft', 'pending', 'rejected', 'published']) {
          const res = await newsAPI.getAll({ status, limit: 100 });
          const found = res.data.data?.find(n => n._id === id);
          if (found) {
            setOriginalStatus(found.status);
            setForm({
              title: found.title || '',
              summary: found.summary || '',
              content: found.content || '',
              category: found.category?._id || found.category || '',
              tags: Array.isArray(found.tags) ? found.tags.join(', ') : '',
              source: found.source || '',
              sourceUrl: found.sourceUrl || '',
              location: found.location || '',
              allowComments: found.allowComments !== false,
              featuredImageUrl: found.featuredImage?.url || '',
              featuredImageCaption: found.featuredImage?.caption || '',
            });
            break;
          }
        }
      } catch (err) {
        toast.error('Failed to load article');
        navigate('/reporter/my-news');
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [id]);

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await newsAPI.uploadImage(formData);
      setForm(prev => ({ ...prev, featuredImageUrl: res.data.data.url }));
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setImageUploading(false);
    }
  };

  const validate = () => {
    if (!form.title.trim() || form.title.trim().length < 10) { toast.error('Title must be at least 10 characters'); return false; }
    if (!form.summary.trim()) { toast.error('Summary is required'); return false; }
    if (!form.content.trim() || form.content.trim().length < 100) { toast.error('Content must be at least 100 characters'); return false; }
    if (!form.category) { toast.error('Please select a category'); return false; }
    return true;
  };

  const buildPayload = () => ({
    title: form.title,
    summary: form.summary,
    content: form.content,
    category: form.category,
    tags: form.tags,
    source: form.source,
    sourceUrl: form.sourceUrl,
    location: form.location,
    allowComments: form.allowComments,
    featuredImage: {
      url: form.featuredImageUrl,
      caption: form.featuredImageCaption,
    },
  });

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Add a title first'); return; }
    setSaving(true);
    try {
      await newsAPI.update(id, buildPayload());
      toast.success('Article saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await newsAPI.update(id, buildPayload());
      await newsAPI.submit(id);
      toast.success('Submitted for admin approval! 🎉');
      navigate('/reporter/my-news');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const STATUS_STYLE = {
    draft: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-700',
    published: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-5 animate-pulse">
      <div className="skeleton h-10 w-1/2 rounded-xl" />
      <div className="skeleton h-64 rounded-xl" />
      <div className="skeleton h-96 rounded-xl" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/reporter/my-news" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h2 className="font-headline font-bold text-2xl text-gray-900">Edit Article</h2>
            {originalStatus && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-sans ${STATUS_STYLE[originalStatus]}`}>
                {originalStatus}
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm font-sans">
            {wordCount} words · ~{readTime} min read
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium font-sans text-gray-700 hover:border-gray-300 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : '💾 Save'}
          </button>
          {['draft', 'rejected'].includes(originalStatus) && (
            <button onClick={handleSubmit} disabled={submitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium font-sans hover:bg-primary-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Submitting...' : '🚀 Submit for Approval'}
            </button>
          )}
        </div>
      </div>

      {/* Rejection reason */}
      {originalStatus === 'rejected' && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-semibold text-red-700 font-sans mb-1">❌ Article was rejected</p>
          <p className="text-xs text-red-600 font-sans">Please fix the issues and resubmit.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="lg:col-span-2 space-y-5">

          {/* Title */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <label className="block text-xs font-semibold text-gray-500 font-sans uppercase tracking-wide mb-2">
              Article Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="Write a compelling headline..."
              maxLength={200}
              className="w-full text-xl font-headline font-semibold text-gray-900 border-0 outline-none placeholder-gray-300 bg-transparent"
            />
            <div className="text-right text-xs text-gray-300 font-sans mt-2">{form.title.length}/200</div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <label className="block text-xs font-semibold text-gray-500 font-sans uppercase tracking-wide mb-2">
              Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.summary}
              onChange={set('summary')}
              placeholder="Short summary shown in listings..."
              rows={3}
              maxLength={500}
              className="w-full font-sans text-sm text-gray-700 border-0 outline-none placeholder-gray-300 resize-none bg-transparent leading-relaxed"
            />
            <div className="text-right text-xs text-gray-300 font-sans">{form.summary.length}/500</div>
          </div>

          {/* Featured image */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <label className="block text-xs font-semibold text-gray-500 font-sans uppercase tracking-wide mb-3">
              Featured Image
            </label>
            {form.featuredImageUrl ? (
              <div className="relative">
                <img src={form.featuredImageUrl} alt="Featured" className="w-full rounded-lg aspect-video object-cover" />
                <button
                  onClick={() => setForm(prev => ({ ...prev, featuredImageUrl: '' }))}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-sm"
                >×</button>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-all">
                <div className="text-2xl mb-2">{imageUploading ? '⏳' : '🖼️'}</div>
                <p className="font-sans text-sm text-gray-500">{imageUploading ? 'Uploading...' : 'Click to upload'}</p>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={imageUploading} />
              </label>
            )}
            {form.featuredImageUrl && (
              <input type="text" value={form.featuredImageCaption} onChange={set('featuredImageCaption')}
                placeholder="Caption (optional)"
                className="w-full mt-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none focus:border-primary-400" />
            )}
            <input type="url" value={form.featuredImageUrl} onChange={set('featuredImageUrl')}
              placeholder="Or paste image URL: https://..."
              className="w-full mt-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none focus:border-primary-400" />
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <label className="block text-xs font-semibold text-gray-500 font-sans uppercase tracking-wide mb-3">
              Article Content <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200 flex-wrap">
                {[
                  { label: 'B', tag: 'strong' },
                  { label: 'I', tag: 'em' },
                  { label: 'H2', tag: 'h2' },
                  { label: 'H3', tag: 'h3' },
                  { label: '"', tag: 'blockquote' },
                  { label: 'UL', tag: 'ul' },
                ].map(({ label, tag }) => (
                  <button key={tag} type="button"
                    onClick={() => {
                      const ta = document.getElementById('edit-content');
                      const start = ta.selectionStart;
                      const end = ta.selectionEnd;
                      const sel = form.content.substring(start, end);
                      let wrapped;
                      if (tag === 'ul') wrapped = `\n<ul>\n  <li>${sel || 'Item 1'}</li>\n  <li>Item 2</li>\n</ul>\n`;
                      else if (tag === 'blockquote') wrapped = `\n<blockquote>${sel || 'Quote'}</blockquote>\n`;
                      else wrapped = `<${tag}>${sel || `${tag} text`}</${tag}>`;
                      const newContent = form.content.substring(0, start) + wrapped + form.content.substring(end);
                      setForm(prev => ({ ...prev, content: newContent }));
                    }}
                    className="px-2 py-1 text-xs font-medium font-sans text-gray-600 hover:bg-white hover:text-gray-900 rounded transition-colors border border-transparent hover:border-gray-200">
                    {label}
                  </button>
                ))}
                <span className="ml-auto text-xs text-gray-300 font-sans">HTML supported</span>
              </div>
              <textarea
                id="edit-content"
                value={form.content}
                onChange={set('content')}
                placeholder="Write your article here..."
                rows={20}
                className="w-full px-4 py-4 font-sans text-sm text-gray-700 resize-none outline-none bg-white leading-relaxed"
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400 font-sans">
              <span>{wordCount} words</span>
              <span>~{readTime} min read</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h4 className="font-sans font-semibold text-sm text-gray-800 mb-4">Article Settings</h4>
            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-500 font-sans mb-1.5 uppercase tracking-wide">Category <span className="text-red-500">*</span></label>
                <select value={form.category} onChange={set('category')}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none focus:border-primary-400">
                  <option value="">Select...</option>
                  {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>)}
                </select>
              </div>
              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-gray-500 font-sans mb-1.5 uppercase tracking-wide">Tags</label>
                <input type="text" value={form.tags} onChange={set('tags')} placeholder="tag1, tag2, tag3"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none focus:border-primary-400" />
              </div>
              {/* Source */}
              <div>
                <label className="block text-xs font-medium text-gray-500 font-sans mb-1.5 uppercase tracking-wide">Source</label>
                <input type="text" value={form.source} onChange={set('source')} placeholder="Reuters, AP..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none focus:border-primary-400" />
              </div>
              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-gray-500 font-sans mb-1.5 uppercase tracking-wide">Location</label>
                <input type="text" value={form.location} onChange={set('location')} placeholder="Dhaka, Bangladesh"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none focus:border-primary-400" />
              </div>
              {/* Comments toggle */}
              <div className="flex items-center justify-between py-2 border-t border-gray-50">
                <div>
                  <p className="font-sans text-sm text-gray-700 font-medium">Allow Comments</p>
                </div>
                <button type="button"
                  onClick={() => setForm(prev => ({ ...prev, allowComments: !prev.allowComments }))}
                  className={`w-10 h-6 rounded-full transition-colors relative ${form.allowComments ? 'bg-primary-600' : 'bg-gray-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${form.allowComments ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h4 className="font-sans font-semibold text-sm text-gray-800">Actions</h4>
            <button onClick={handleSave} disabled={saving}
              className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-medium font-sans text-gray-700 hover:border-gray-300 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
            {['draft', 'rejected'].includes(originalStatus) && (
              <button onClick={handleSubmit} disabled={submitting}
                className="w-full py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium font-sans hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {submitting ? 'Submitting...' : '🚀 Submit for Approval'}
              </button>
            )}
            {originalStatus === 'published' && (
              <Link to={`/news/${id}`} target="_blank"
                className="block w-full py-2.5 border border-green-200 text-green-700 rounded-xl text-sm font-medium font-sans text-center hover:bg-green-50 transition-colors">
                🌐 View Live Article
              </Link>
            )}
            {originalStatus === 'pending' && (
              <div className="p-3 bg-yellow-50 rounded-xl">
                <p className="text-xs text-yellow-700 font-sans text-center">⏳ Awaiting admin review</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
