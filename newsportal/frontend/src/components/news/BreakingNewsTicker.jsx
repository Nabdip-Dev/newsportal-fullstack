import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { newsAPI } from '../../services/api';

export default function BreakingNewsTicker() {
  const [breakingNews, setBreakingNews] = useState([]);

  useEffect(() => {
    newsAPI.getAll({ breaking: true, limit: 8 })
      .then(res => setBreakingNews(res.data.data || []))
      .catch(() => {});
  }, []);

  if (!breakingNews.length) return null;

  const items = [...breakingNews, ...breakingNews]; // duplicate for seamless loop

  return (
    <div className="bg-primary-600 text-white py-2 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-0">
        {/* Label */}
        <div className="flex-shrink-0 flex items-center gap-2 bg-white text-primary-600 px-3 py-0.5 mr-4 rounded-sm z-10">
          <span className="live-dot" style={{ background: '#e11d48' }} />
          <span className="text-xs font-bold font-sans uppercase tracking-widest">Breaking</span>
        </div>

        {/* Ticker */}
        <div className="ticker-wrapper flex-1 relative">
          <div className="ticker-content whitespace-nowrap">
            {items.map((item, i) => (
              <span key={`${item._id}-${i}`} className="inline-block mr-12">
                <Link
                  to={`/news/${item.slug}`}
                  className="text-sm font-sans font-medium hover:underline"
                >
                  {item.title}
                </Link>
                <span className="mx-6 opacity-40">◆</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
