import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { newsAPI, categoryAPI } from '../services/api';
import { NewsCardHero, NewsCardMedium, NewsCardList, NewsCardHorizontal } from '../components/news/NewsCard';
import Sidebar from '../components/news/Sidebar';

function SkeletonCard({ tall }) {
  return (
    <div className="animate-pulse">
      <div className={`skeleton rounded-xl ${tall ? 'aspect-video' : 'aspect-[4/3]'} mb-3`} />
      <div className="skeleton h-4 w-full mb-2" />
      <div className="skeleton h-4 w-5/6 mb-2" />
      <div className="skeleton h-3 w-1/3" />
    </div>
  );
}

function SectionTitle({ icon, title, link, linkLabel = 'View All' }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-primary-600 rounded-full" />
        <span className="text-lg mr-1">{icon}</span>
        <h2 className="font-headline font-bold text-xl text-gray-900">{title}</h2>
      </div>
      {link && (
        <Link to={link} className="text-sm text-primary-600 hover:text-primary-700 font-sans font-medium flex items-center gap-1">
          {linkLabel} <span>→</span>
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryNews, setCategoryNews] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [featuredRes, latestRes, catsRes] = await Promise.all([
          newsAPI.getAll({ limit: 5, sort: '-publishedAt', featured: true }),
          newsAPI.getAll({ limit: 10, sort: '-publishedAt' }),
          categoryAPI.getAll(),
        ]);

        let featuredData = featuredRes.data.data || [];
        // Fallback if no featured articles
        if (!featuredData.length) {
          featuredData = (latestRes.data.data || []).slice(0, 5);
        }

        setFeatured(featuredData);
        setLatest(latestRes.data.data || []);
        setCategories(catsRes.data.data?.slice(0, 4) || []);

        // Fetch news for first 4 categories
        const cats = catsRes.data.data?.slice(0, 4) || [];
        const catNewsPromises = cats.map(cat =>
          newsAPI.getAll({ category: cat.slug, limit: 4 }).then(r => ({ slug: cat.slug, data: r.data.data || [] }))
        );
        const catResults = await Promise.all(catNewsPromises);
        const catMap = {};
        catResults.forEach(({ slug, data }) => { catMap[slug] = data; });
        setCategoryNews(catMap);
      } catch (err) {
        console.error('HomePage fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const heroArticle = featured[0];
  const heroSecondary = featured.slice(1, 3);
  const featuredGrid = featured.slice(1, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* ── HERO SECTION ── */}
      <section className="mb-10">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2"><SkeletonCard tall /></div>
            <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Big hero */}
            <div className="lg:col-span-2">
              {heroArticle && <NewsCardHero article={heroArticle} />}
            </div>
            {/* Side stack */}
            <div className="space-y-4">
              {heroSecondary.map(a => (
                <NewsCardMedium key={a._id} article={a} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── MAIN CONTENT + SIDEBAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Main */}
        <div className="lg:col-span-2 space-y-10">

          {/* FEATURED GRID */}
          <section>
            <SectionTitle icon="⭐" title="Featured Stories" link="/search?featured=true" />
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {featuredGrid.map(a => <NewsCardMedium key={a._id} article={a} />)}
              </div>
            )}
          </section>

          {/* LATEST NEWS */}
          <section>
            <SectionTitle icon="🕐" title="Latest News" link="/search" />
            {loading ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_, i) => <div key={i} className="flex gap-4 py-4 border-b border-gray-100"><div className="skeleton w-24 h-20 rounded-lg flex-shrink-0" /><div className="flex-1 space-y-2"><div className="skeleton h-4 w-full" /><div className="skeleton h-4 w-3/4" /><div className="skeleton h-3 w-1/4" /></div></div>)}
              </div>
            ) : (
              <div>
                {latest.map(a => <NewsCardList key={a._id} article={a} />)}
              </div>
            )}
          </section>

          {/* CATEGORY SECTIONS */}
          {categories.map(cat => (
            <section key={cat._id}>
              <SectionTitle
                icon={cat.icon}
                title={cat.name}
                link={`/category/${cat.slug}`}
                linkLabel={`More ${cat.name} →`}
              />
              {!categoryNews[cat.slug] ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : categoryNews[cat.slug].length === 0 ? (
                <p className="text-gray-400 text-sm font-sans py-4">No articles in this category yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {categoryNews[cat.slug].slice(0, 4).map(a => (
                    <NewsCardMedium key={a._id} article={a} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-28">
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
