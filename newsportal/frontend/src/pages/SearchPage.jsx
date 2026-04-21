import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { newsAPI } from '../services/api';
import { NewsCardList } from '../components/news/NewsCard';
import Sidebar from '../components/news/Sidebar';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [input, setInput] = useState(query);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setPage(1);
    newsAPI.getAll({ search: query, limit: 15, page: 1 })
      .then(res => {
        setResults(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.pages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (input.trim()) setSearchParams({ q: input.trim() });
  };

  const loadMore = async () => {
    const next = page + 1;
    const res = await newsAPI.getAll({ search: query, limit: 15, page: next });
    setResults(prev => [...prev, ...(res.data.data || [])]);
    setPage(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-2xl">
          <input
            type="text" value={input} onChange={e => setInput(e.target.value)}
            placeholder="Search for news, topics, categories..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-base font-sans focus:outline-none focus:border-primary-400 shadow-sm"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 font-sans">
            Search
          </button>
        </div>
      </form>

      {query && (
        <p className="text-sm text-gray-500 font-sans mb-6">
          {loading ? 'Searching...' : `${total} results for "${query}"`}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {!query ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">🔍</div>
              <p className="font-headline text-xl text-gray-600 mb-2">Search the news</p>
              <p className="font-sans text-sm">Enter keywords to find articles</p>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex gap-4 py-4 border-b animate-pulse">
                  <div className="skeleton w-24 h-20 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-full" />
                    <div className="skeleton h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">😔</div>
              <p className="font-headline text-xl text-gray-700 mb-2">No results found</p>
              <p className="text-gray-400 font-sans text-sm">Try different keywords or browse categories</p>
            </div>
          ) : (
            <>
              {results.map(a => <NewsCardList key={a._id} article={a} />)}
              {page < totalPages && (
                <div className="text-center mt-8">
                  <button onClick={loadMore} className="px-6 py-2.5 border border-gray-300 rounded-full text-sm font-medium font-sans hover:border-primary-400 hover:text-primary-600 transition-colors">
                    Load More
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
