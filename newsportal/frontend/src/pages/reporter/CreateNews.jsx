import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsAPI, categoryAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function CreateNews() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

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
    categoryAPI.getAll()
      .then(res => setCategories(res.data.data || []))
      .catch(() => {});
  }, []);

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: val }));
  };

  // Upload image to Cloudinary via backend
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
    if (!form.title.trim()) { toast.error('Title is required'); return false; }
    if (form.title.trim().length < 10) { toast.error('Title must be at least 10 characters'); return false; }
    if (!form.summary.trim()) { toast.error('Summary is required'); return false; }
    if (!form.content.trim()) { toast.error('Content is required'); return false; }
    if (form.content.trim().length < 100) { toast.error('Content must be at least 100 characters'); return false; }
    if (!form.category) { toast.error('Please select a category'); return false; }
    return true;
  };

  // Save as draft
  const handleSaveDraft = async () => {
    if (!form.title.trim()) { toast.error('At least add a title to save draft'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags,
        status: 'draft',
      };
      const res = await newsAPI.create(payload);
      toast.success('Saved as draft!');
      navigate(`/reporter/edit/${res.data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Save + submit for approval
  const handleSubmitForApproval = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = { ...form, tags: form.tags };
      const res = await newsAPI.create(payload);
      const newsId = res.data.data._id;
      await newsAPI.submit(newsId);
      toast.success('Article submitted for admin approval! 🎉');
      navigate('/reporter/my-news');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-headline font-bold text-2xl text-gray-900">Write New Article</h2>
          <p className="text-gray-400 text-sm font-sans mt-0.5">
            {wordCount} words · ~{readTime} min read
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium font-sans text-gray-700 hover:border-gray-300 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : '💾 Save Draft'}
          </button>
          <button
            onClick={handleSubmitForApproval}
            disabled={submitting}
            className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium font-sans hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Submitting...' : '🚀 Submit for Approval'}
          </button>
        </div>
      </div>

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
              className="w-full text-xl font-headline font-semibold text-gray-900 border-0 outline-none placeholder-gray-300 resize-none bg-transparent"
            />
            <div className="text-right text-xs text-gray-300 font-sans mt-2">{form.title.length}/200</div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <label className="block text-xs font-semibold text-gray-500 font-sans uppercase tracking-wide mb-2">
              Summary / Lead <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.summary}
              onChange={set('summary')}
              placeholder="Write a short summary (shown in article listings)..."
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
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-sm transition-colors"
                >×</button>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-all group">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🖼️</div>
                <p className="font-sans text-sm text-gray-500 mb-1">
                  {imageUploading ? 'Uploading...' : 'Click to upload image'}
                </p>
                <p className="font-sans text-xs text-gray-300">JPG, PNG, WEBP · Max 10MB</p>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={imageUploading} />
              </label>
            )}

            {form.featuredImageUrl && (
              <input
                type="text"
                value={form.featuredImageCaption}
                onChange={set('featuredImageCaption')}
                placeholder="Image caption (optional)"
                className="w-full mt-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none focus:border-primary-400"
              />
            )}

            <div className="mt-3">
              <p className="text-xs text-gray-400 font-sans mb-1.5">Or paste image URL:</p>
              <input
                type="url"
                value={form.featuredImageUrl}
                onChange={set('featuredImageUrl')}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none focus:border-primary-400"
              />
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <label className="block text-xs font-semibold text-gray-500 font-sans uppercase tracking-wide mb-3">
              Article Content <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Simple toolbar */}
              <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200 flex-wrap">
                {[
                  { label: 'B', tag: 'strong', title: 'Bold' },
                  { label: 'I', tag: 'em', title: 'Italic' },
                  { label: 'H2', tag: 'h2', title: 'Heading 2' },
                  { label: 'H3', tag: 'h3', title: 'Heading 3' },
                  { label: '"', tag: 'blockquote', title: 'Quote' },
                  { label: 'UL', tag: 'ul', title: 'Bullet list' },
                ].map(({ label, tag, title }) => (
                  <button
                    key={tag}
                    type="button"
                    title={title}
                    onClick={() => {
                      const textarea = document.getElementById('news-content');
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const selected = form.content.substring(start, end);
                      let wrapped;
                      if (tag === 'ul') {
                        wrapped = `\n<ul>\n  <li>${selected || 'Item 1'}</li>\n  <li>Item 2</li>\n</ul>\n`;
                      } else if (tag === 'blockquote') {
                        wrapped = `\n<blockquote>${selected || 'Quote text here'}</blockquote>\n`;
                      } else {
                        wrapped = `<${tag}>${selected || `${tag} text`}</${tag}>`;
                      }
                      const newContent = form.content.substring(0, start) + wrapped + form.content.substring(end);
                      setForm(prev => ({ ...prev, content: newContent }));
                    }}
                    className="px-2 py-1 text-xs font-medium font-sans text-gray-600 hover:bg-white hover:text-gray-900 rounded transition-colors border border-transparent hover:border-gray-200"
                  >
                    {label}
                  </button>
                ))}
                <span className="ml-auto text-xs text-gray-300 font-sans">HTML supported</span>
              </div>
              <textarea
                id="news-content"
                value={form.content}
                onChange={set('content')}
                placeholder="Write your article here... HTML tags like <p>, <h2>, <strong>, <em>, <blockquote> are supported."
                rows={20}
                className="w-full px-4 py-4 font-sans text-sm text-gray-700 resize-none outline-none bg-white leading-relaxed"
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400 font-sans">
              <span>{wordCount} words</span>
              <span>~{readTime} min read</span>
            </div>
          </div>
        </div>

        {/* Sidebar settings */}
        <div className="lg:col-span-1 space-y-5">

          {/* Publish settings */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h4 className="font-sans font-semibold text-sm text-gray-800 mb-4">Article Settings</h4>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-500 font-sans mb-1.5 uppercase tracking-wide">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={set('category')}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none focus:border-primary-400"
                >
                  <option value="">Select category...</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-gray-500 font-sans mb-1.5 uppercase tracking-wide">
                  Tags
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={set('tags')}
                  placeholder="politics, economy, world (comma separated)"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none focus:border-primary-400"
                />
                <p className="text-xs text-gray-400 font-sans mt-1">Separate with commas</p>
              </div>

              {/* Source */}
              <div>
                <label className="block text-xs font-medium text-gray-500 font-sans mb-1.5 uppercase tracking-wide">
                  Source
                </label>
                <input
                  type="text"
                  value={form.source}
                  onChange={set('source')}
                  placeholder="Reuters, AP News..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none focus:border-primary-400"
                />
              </div>

              {/* Source URL */}
              <div>
                <label className="block text-xs font-medium text-gray-500 font-sans mb-1.5 uppercase tracking-wide">
                  Source URL
                </label>
                <input
                  type="url"
                  value={form.sourceUrl}
                  onChange={set('sourceUrl')}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none focus:border-primary-400"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-gray-500 font-sans mb-1.5 uppercase tracking-wide">
                  Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={set('location')}
                  placeholder="Dhaka, Bangladesh"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none focus:border-primary-400"
                />
              </div>

              {/* Allow comments */}
              <div className="flex items-center justify-between py-2 border-t border-gray-50">
                <div>
                  <p className="font-sans text-sm text-gray-700 font-medium">Allow Comments</p>
                  <p className="font-sans text-xs text-gray-400">Readers can comment</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, allowComments: !prev.allowComments }))}
                  className={`w-10 h-6 rounded-full transition-colors relative ${form.allowComments ? 'bg-primary-600' : 'bg-gray-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${form.allowComments ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Submit area */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h4 className="font-sans font-semibold text-sm text-gray-800">Publish</h4>
            <div className="text-xs text-gray-500 font-sans space-y-1.5">
              <div className="flex items-center gap-2">
                <span className={form.title.trim().length >= 10 ? 'text-green-500' : 'text-gray-300'}>✓</span>
                <span className={form.title.trim().length >= 10 ? 'text-gray-700' : 'text-gray-400'}>Title (min 10 chars)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={form.summary.trim() ? 'text-green-500' : 'text-gray-300'}>✓</span>
                <span className={form.summary.trim() ? 'text-gray-700' : 'text-gray-400'}>Summary added</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={form.content.trim().length >= 100 ? 'text-green-500' : 'text-gray-300'}>✓</span>
                <span className={form.content.trim().length >= 100 ? 'text-gray-700' : 'text-gray-400'}>Content (min 100 chars)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={form.category ? 'text-green-500' : 'text-gray-300'}>✓</span>
                <span className={form.category ? 'text-gray-700' : 'text-gray-400'}>Category selected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={form.featuredImageUrl ? 'text-green-500' : 'text-gray-300'}>✓</span>
                <span className={form.featuredImageUrl ? 'text-gray-700' : 'text-gray-400'}>Featured image (optional)</span>
              </div>
            </div>

            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-medium font-sans text-gray-700 hover:border-gray-300 disabled:opacity-50 transition-colors"
            >
              {saving ? '💾 Saving...' : '💾 Save as Draft'}
            </button>
            <button
              onClick={handleSubmitForApproval}
              disabled={submitting}
              className="w-full py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium font-sans hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? '🚀 Submitting...' : '🚀 Submit for Approval'}
            </button>
            <p className="text-xs text-gray-400 font-sans text-center">
              Admin will review before publishing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
