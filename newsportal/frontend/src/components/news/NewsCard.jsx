import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

function CategoryBadge({ category }) {
  if (!category) return null;
  return (
    <span
      className="category-badge text-white"
      style={{ backgroundColor: category.color || '#e11d48' }}
    >
      {category.name}
    </span>
  );
}

export function NewsCardHero({ article }) {
  if (!article) return null;
  return (
    <Link to={`/news/${article.slug}`} className="block group relative overflow-hidden rounded-xl aspect-[16/9] bg-gray-200">
      {article.featuredImage?.url ? (
        <img src={article.featuredImage.url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
          <span className="text-5xl opacity-30">📰</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-center gap-2 mb-2">
          <CategoryBadge category={article.category} />
          {article.isBreaking && (
            <span className="category-badge bg-red-600 text-white flex items-center gap-1">
              <span className="live-dot" style={{ width: 6, height: 6 }} /> LIVE
            </span>
          )}
        </div>
        <h2 className="font-headline text-white text-xl md:text-2xl font-bold leading-tight group-hover:text-primary-200 transition-colors line-clamp-3">
          {article.title}
        </h2>
        <div className="flex items-center gap-3 mt-2 text-white/70 text-xs font-sans">
          <span>{article.author?.firstName} {article.author?.lastName}</span>
          <span>•</span>
          <span>{article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : 'Just now'}</span>
          <span>•</span>
          <span>{article.readTime} min read</span>
        </div>
      </div>
    </Link>
  );
}

export function NewsCardMedium({ article }) {
  if (!article) return null;
  return (
    <Link to={`/news/${article.slug}`} className="block group news-card">
      <div className="relative overflow-hidden rounded-lg aspect-video bg-gray-200 mb-3">
        {article.featuredImage?.url ? (
          <img src={article.featuredImage.url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-3xl opacity-40">📰</span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <CategoryBadge category={article.category} />
        </div>
      </div>
      <h3 className="font-headline text-gray-900 font-semibold text-base leading-snug group-hover:text-primary-600 transition-colors line-clamp-2 mb-1">
        {article.title}
      </h3>
      <p className="text-gray-500 text-sm font-sans line-clamp-2 mb-2">{article.summary}</p>
      <div className="flex items-center gap-2 text-xs text-gray-400 font-sans">
        <span>{article.author?.firstName} {article.author?.lastName}</span>
        <span>•</span>
        <span>{article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : 'Recently'}</span>
        <span>•</span>
        <span>{article.readTime} min</span>
      </div>
    </Link>
  );
}

export function NewsCardHorizontal({ article, rank }) {
  if (!article) return null;
  return (
    <Link to={`/news/${article.slug}`} className="flex gap-3 group news-card">
      {rank !== undefined && (
        <div className="flex-shrink-0 w-8 flex items-start justify-center pt-1">
          <span className="font-headline font-bold text-2xl text-gray-200 group-hover:text-primary-200 transition-colors">
            {String(rank + 1).padStart(2, '0')}
          </span>
        </div>
      )}
      <div className="flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden bg-gray-100">
        {article.featuredImage?.url ? (
          <img src={article.featuredImage.url} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xl">📰</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-headline text-gray-900 text-sm font-semibold leading-snug group-hover:text-primary-600 transition-colors line-clamp-2 mb-1">
          {article.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-gray-400 font-sans">
          <CategoryBadge category={article.category} />
          <span>{article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : ''}</span>
        </div>
      </div>
    </Link>
  );
}

export function NewsCardList({ article }) {
  if (!article) return null;
  return (
    <Link to={`/news/${article.slug}`} className="flex gap-4 group py-4 border-b border-gray-100 last:border-b-0 news-card">
      <div className="flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden bg-gray-100">
        {article.featuredImage?.url ? (
          <img src={article.featuredImage.url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-2xl">📰</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <CategoryBadge category={article.category} />
          {article.isBreaking && <span className="category-badge bg-red-600 text-white">Breaking</span>}
        </div>
        <h3 className="font-headline text-gray-900 font-semibold text-base leading-snug group-hover:text-primary-600 transition-colors line-clamp-2 mb-1">
          {article.title}
        </h3>
        <p className="text-gray-500 text-sm font-sans line-clamp-1 mb-1.5">{article.summary}</p>
        <div className="flex items-center gap-3 text-xs text-gray-400 font-sans">
          <span>{article.author?.firstName} {article.author?.lastName}</span>
          <span>•</span>
          <span>{article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : 'Recently'}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            {article.views?.toLocaleString()}
          </span>
          <span>•</span>
          <span>❤ {article.likesCount}</span>
        </div>
      </div>
    </Link>
  );
}

export default function NewsCard({ article, variant = 'medium' }) {
  switch (variant) {
    case 'hero': return <NewsCardHero article={article} />;
    case 'horizontal': return <NewsCardHorizontal article={article} />;
    case 'list': return <NewsCardList article={article} />;
    default: return <NewsCardMedium article={article} />;
  }
}
