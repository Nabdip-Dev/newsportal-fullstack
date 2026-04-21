import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { categoryAPI } from '../../services/api';

const staticLinks = [
  { label: 'Home', path: '/' },
  { label: 'Breaking', path: '/category/breaking' },
];

export default function Navbar() {
  const [categories, setCategories] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    categoryAPI.getAll().then(res => setCategories(res.data.data || [])).catch(() => {});
  }, []);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-[57px] z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        {/* Desktop */}
        <div className="hidden md:flex items-center gap-0 overflow-x-auto">
          {staticLinks.map(link => (
            <Link key={link.path} to={link.path}
              className={`px-4 py-3 text-sm font-medium font-sans whitespace-nowrap border-b-2 transition-colors ${isActive(link.path) ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600 hover:text-primary-600 hover:border-primary-300'}`}>
              {link.label}
            </Link>
          ))}
          {categories.map(cat => (
            <Link key={cat._id} to={`/category/${cat.slug}`}
              className={`px-4 py-3 text-sm font-medium font-sans whitespace-nowrap border-b-2 transition-colors ${isActive(`/category/${cat.slug}`) ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600 hover:text-primary-600 hover:border-primary-300'}`}>
              <span className="mr-1">{cat.icon}</span> {cat.name}
            </Link>
          ))}
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center justify-between py-2">
          <span className="text-sm font-medium text-gray-700 font-sans">Sections</span>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1 text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-3 grid grid-cols-3 gap-2">
            {[...staticLinks, ...categories.map(c => ({ label: `${c.icon} ${c.name}`, path: `/category/${c.slug}` }))].map(link => (
              <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 text-xs font-medium font-sans rounded-lg text-center ${isActive(link.path) ? 'bg-primary-50 text-primary-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
