import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { icon: '📊', label: 'Dashboard', path: '/reporter' },
  { icon: '✏️', label: 'Write Article', path: '/reporter/create' },
  { icon: '📰', label: 'My Articles', path: '/reporter/my-news' },
];

export default function ReporterLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/'); };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-gray-900 flex-shrink-0 fixed top-0 left-0 bottom-0 z-50 flex flex-col">
        <div className="p-5 border-b border-gray-700">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center">
              <span className="text-white font-headline font-bold">N</span>
            </div>
            <div>
              <div className="text-white text-sm font-bold font-sans">NewsPortal</div>
              <div className="text-gray-400 text-xs font-sans">Reporter Panel</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link key={item.path} to={item.path}
              className={`admin-sidebar-link ${(item.path === '/reporter' ? location.pathname === '/reporter' : location.pathname.startsWith(item.path)) ? 'active' : ''}`}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-700">
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <p className="text-white text-xs font-medium font-sans">{user?.firstName}</p>
              <p className="text-gray-400 text-xs font-sans capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="admin-sidebar-link w-full text-red-400 hover:bg-red-900/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <div className="flex-1 ml-56">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <h1 className="font-sans font-semibold text-gray-800">
            {NAV_ITEMS.find(n => (n.path === '/reporter' ? location.pathname === '/reporter' : location.pathname.startsWith(n.path)))?.label || 'Reporter'}
          </h1>
          <Link to="/" className="text-sm text-primary-600 hover:underline font-sans">← View Site</Link>
        </header>
        <main className="p-6"><Outlet /></main>
      </div>
    </div>
  );
}
