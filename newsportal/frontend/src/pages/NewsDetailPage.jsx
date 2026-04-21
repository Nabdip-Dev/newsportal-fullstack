import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { newsAPI, commentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { NewsCardHorizontal } from '../components/news/NewsCard';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function NewsDetailPage() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    newsAPI.getBySlug(slug)
      .then(res => {
        const data = res.data.data;
        setArticle(data);
        setRelated(res.data.related || []);
        setLikesCount(data.likesCount || 0);
        if (isAuthenticated && user) {
          setLiked(data.likes?.includes(user._id));
        }
        return commentAPI.getByNews(data._id);
      })
      .then(res => setComments(res.data.data || []))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [slug]);

  // Socket.IO for real-time comments
  useEffect(() => {
    if (!article) return;
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current.emit('join-news', article._id);
    socketRef.current.on('comment-added', (data) => {
      if (data.newsId === article._id && data.comment?.author?._id !== user?._id) {
        setComments(prev => [data.comment, ...prev]);
      }
    });
    return () => {
      socketRef.current?.emit('leave-news', article._id);
      socketRef.current?.disconnect();
    };
  }, [article?._id]);

  const handleLike = async () => {
    if (!isAuthenticated) { toast.error('Please login to like'); return; }
    try {
      const res = await newsAPI.like(article._id);
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch { toast.error('Failed to like'); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to comment'); return; }
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await commentAPI.create({
        newsId: article._id,
        content: newComment.trim(),
        parentCommentId: replyTo?._id,
      });
      const comment = res.data.data;
      if (replyTo) {
        setComments(prev => prev.map(c => c._id === replyTo._id ? { ...c, replies: [...(c.replies || []), comment] } : c));
      } else {
        setComments(prev => [comment, ...prev]);
      }
      socketRef.current?.emit('new-comment', { newsId: article._id, comment });
      setNewComment('');
      setReplyTo(null);
      toast.success('Comment posted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (id) => {
    try {
      await commentAPI.delete(id);
      setComments(prev => prev.filter(c => c._id !== id));
      toast.success('Comment deleted');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="skeleton h-8 w-3/4 mb-4" />
      <div className="skeleton h-4 w-1/2 mb-6" />
      <div className="skeleton aspect-video rounded-xl mb-8" />
      {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-4 w-full mb-3" />)}
    </div>
  );
  if (!article) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Article */}
        <article className="lg:col-span-2">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-400 font-sans mb-4">
            <Link to="/" className="hover:text-primary-600">Home</Link>
            <span>/</span>
            {article.category && <Link to={`/category/${article.category.slug}`} className="hover:text-primary-600">{article.category.name}</Link>}
            <span>/</span>
            <span className="text-gray-600 truncate max-w-48">{article.title}</span>
          </nav>

          {/* Category + Breaking */}
          <div className="flex items-center gap-2 mb-3">
            {article.category && (
              <Link to={`/category/${article.category.slug}`}>
                <span className="category-badge text-white" style={{ backgroundColor: article.category.color }}>
                  {article.category.name}
                </span>
              </Link>
            )}
            {article.isBreaking && (
              <span className="category-badge bg-red-600 text-white flex items-center gap-1">
                <span className="live-dot" style={{ width: 6, height: 6 }} /> BREAKING
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
            {article.title}
          </h1>

          {/* Summary */}
          <p className="font-body text-xl text-gray-600 leading-relaxed mb-5 italic border-l-4 border-primary-200 pl-4">
            {article.summary}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 py-4 border-t border-b border-gray-100 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 overflow-hidden">
                {article.author?.avatar
                  ? <img src={article.author.avatar} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-primary-600 font-bold text-xs">{article.author?.firstName?.[0]}</div>
                }
              </div>
              <div>
                <p className="font-sans font-medium text-sm text-gray-800">{article.author?.firstName} {article.author?.lastName}</p>
                <p className="font-sans text-xs text-gray-400 capitalize">{article.author?.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400 font-sans ml-auto">
              {article.publishedAt && <span>{format(new Date(article.publishedAt), 'MMM dd, yyyy')}</span>}
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {article.readTime} min read
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                {article.views?.toLocaleString()} views
              </span>
            </div>
          </div>

          {/* Featured image */}
          {article.featuredImage?.url && (
            <figure className="mb-6">
              <img src={article.featuredImage.url} alt={article.title} className="w-full rounded-xl" />
              {article.featuredImage.caption && (
                <figcaption className="text-xs text-gray-400 text-center mt-2 font-sans italic">{article.featuredImage.caption}</figcaption>
              )}
            </figure>
          )}

          {/* Content */}
          <div className="news-content" dangerouslySetInnerHTML={{ __html: article.content }} />

          {/* Tags */}
          {article.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-100">
              {article.tags.map(tag => (
                <Link key={tag} to={`/search?q=${tag}`}
                  className="px-3 py-1 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-600 text-xs rounded-full font-sans transition-colors">
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Source */}
          {article.source && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm font-sans text-gray-600">
              Source: {article.sourceUrl ? <a href={article.sourceUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">{article.source}</a> : article.source}
            </div>
          )}

          {/* Like & Share */}
          <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-100">
            <button onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border font-sans text-sm font-medium transition-all ${liked ? 'bg-primary-50 border-primary-300 text-primary-600' : 'border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600'}`}>
              <svg className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} viewBox="0 0 24 24" stroke="currentColor" fill={liked ? 'currentColor' : 'none'}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {likesCount} {liked ? 'Liked' : 'Like'}
            </button>
            <button onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success('Link copied!'); }}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-gray-300 font-sans text-sm transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              Share
            </button>
            <span className="text-xs text-gray-400 font-sans ml-auto">{article.commentsCount || comments.length} comments</span>
          </div>

          {/* Comments */}
          {article.allowComments && (
            <section className="mt-8">
              <h3 className="font-headline font-bold text-xl text-gray-900 mb-5">
                Discussion ({article.commentsCount || comments.length})
              </h3>

              {/* Comment form */}
              <form onSubmit={handleComment} className="mb-8">
                {replyTo && (
                  <div className="flex items-center gap-2 mb-2 text-sm text-gray-500 font-sans">
                    <span>Replying to <strong>{replyTo.author?.firstName}</strong></span>
                    <button type="button" onClick={() => setReplyTo(null)} className="text-primary-600 hover:underline">Cancel</button>
                  </div>
                )}
                {isAuthenticated ? (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex-shrink-0 overflow-hidden">
                      {user?.avatar
                        ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-primary-600 font-bold text-xs">{user?.firstName?.[0]}</div>
                      }
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment} onChange={e => setNewComment(e.target.value)}
                        placeholder="Share your thoughts..."
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-primary-400 focus:bg-white resize-none transition-all"
                      />
                      <div className="flex justify-end mt-2">
                        <button type="submit" disabled={!newComment.trim() || submitting}
                          className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium font-sans hover:bg-primary-700 disabled:opacity-50 transition-colors">
                          {submitting ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-gray-500 text-sm font-sans mb-2">Join the discussion</p>
                    <Link to="/login" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium font-sans hover:bg-primary-700">Login to Comment</Link>
                  </div>
                )}
              </form>

              {/* Comment list */}
              <div className="space-y-5">
                {comments.map(comment => (
                  <div key={comment._id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                      {comment.author?.avatar
                        ? <img src={comment.author.avatar} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xs">{comment.author?.firstName?.[0]}</div>
                      }
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-sans font-medium text-sm text-gray-900">{comment.author?.firstName} {comment.author?.lastName}</span>
                          {comment.author?.role !== 'user' && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-sans capitalize">{comment.author?.role}</span>
                          )}
                          <span className="text-xs text-gray-400 font-sans ml-auto">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                        </div>
                        <p className="text-sm text-gray-700 font-sans leading-relaxed">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 pl-2">
                        <button onClick={() => setReplyTo(comment)} className="text-xs text-gray-400 hover:text-primary-600 font-sans transition-colors">Reply</button>
                        {(user?._id === comment.author?._id || user?.role === 'admin') && (
                          <button onClick={() => handleDeleteComment(comment._id)} className="text-xs text-gray-400 hover:text-red-500 font-sans transition-colors">Delete</button>
                        )}
                      </div>
                      {/* Replies */}
                      {comment.replies?.length > 0 && (
                        <div className="mt-3 ml-4 space-y-3">
                          {comment.replies.map(reply => (
                            <div key={reply._id} className="flex gap-2">
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                {reply.author?.avatar
                                  ? <img src={reply.author.avatar} alt="" className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xs">{reply.author?.firstName?.[0]}</div>
                                }
                              </div>
                              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-sans font-medium text-xs text-gray-900">{reply.author?.firstName} {reply.author?.lastName}</span>
                                  <span className="text-xs text-gray-400 font-sans ml-auto">{formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</span>
                                </div>
                                <p className="text-xs text-gray-700 font-sans">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-3xl mb-2">💬</div>
                    <p className="font-sans text-sm">No comments yet. Be the first!</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </article>

        {/* Related sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-28">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-5">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-headline font-bold text-base text-gray-900">Related Stories</h3>
              </div>
              <div className="p-4 space-y-4">
                {related.length > 0
                  ? related.map((a, i) => <NewsCardHorizontal key={a._id} article={a} rank={i} />)
                  : <p className="text-sm text-gray-400 font-sans">No related articles found.</p>
                }
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
