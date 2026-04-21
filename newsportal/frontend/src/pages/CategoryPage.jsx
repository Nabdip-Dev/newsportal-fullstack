// CategoryPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { newsAPI, categoryAPI } from '../services/api';
import { NewsCardList } from '../components/news/NewsCard';
import Sidebar from '../components/news/Sidebar';

export function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [news, setNews] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    categoryAPI.getAll()
      .then(res => {
        const cat = (res.data.data || []).find(c => c.slug === slug);
        setCategory(cat);
      });
    newsAPI.getAll({ category: slug, limit: 12, page: 1 })
      .then(res => {
        setNews(res.data.data || []);
        setTotalPages(res.data.pagination?.pages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const loadMore = async () => {
    const nextPage = page + 1;
    const res = await newsAPI.getAll({ category: slug, limit: 12, page: nextPage });
    setNews(prev => [...prev, ...(res.data.data || [])]);
    setPage(nextPage);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Category header */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {category && (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: category.color + '20' }}>
              {category.icon}
            </div>
          )}
          <div>
            <h1 className="font-headline font-bold text-3xl text-gray-900">{category?.name || slug}</h1>
            {category?.description && <p className="text-gray-500 font-sans text-sm mt-1">{category.description}</p>}
            <p className="text-xs text-gray-400 font-sans mt-1">{category?.newsCount || news.length} articles</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex gap-4 py-4 border-b border-gray-100 animate-pulse">
                  <div className="skeleton w-24 h-20 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-full" />
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📭</div>
              <p className="font-headline text-xl text-gray-700 mb-2">No articles yet</p>
              <p className="text-gray-400 font-sans text-sm">Check back soon for the latest {category?.name} news.</p>
            </div>
          ) : (
            <>
              <div>
                {news.map(a => <NewsCardList key={a._id} article={a} />)}
              </div>
              {page < totalPages && (
                <div className="text-center mt-8">
                  <button onClick={loadMore} className="px-6 py-2.5 border border-gray-300 rounded-full text-sm font-medium font-sans text-gray-700 hover:border-primary-400 hover:text-primary-600 transition-colors">
                    Load More Stories
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-28"><Sidebar /></div>
        </div>
      </div>
    </div>
  );
}

export default CategoryPage;
