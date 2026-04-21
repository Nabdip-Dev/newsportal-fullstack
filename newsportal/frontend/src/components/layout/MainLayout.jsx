import { Outlet } from 'react-router-dom';
import Header from './Header';
import Navbar from './Navbar';
import Footer from './Footer';
import BreakingNewsTicker from '../news/BreakingNewsTicker';
import AnnouncementBanner from '../news/AnnouncementBanner';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f7f4]">
      <AnnouncementBanner />
      <Header />
      <BreakingNewsTicker />
      <Navbar />
      <main className="flex-1 page-enter">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
