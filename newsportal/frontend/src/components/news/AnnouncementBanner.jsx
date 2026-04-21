import { useState, useEffect } from 'react';
import { bannerAPI } from '../../services/api';

export default function AnnouncementBanner() {
  const [banners, setBanners] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    bannerAPI.getActive()
      .then(res => {
        const announcements = (res.data.data || []).filter(b => b.type === 'announcement' && b.position === 'top');
        setBanners(announcements);
      })
      .catch(() => {});
  }, []);

  if (!banners.length || dismissed) return null;

  const banner = banners[0];

  return (
    <div
      className="text-white text-sm py-2 px-4 flex items-center justify-center gap-3 relative font-sans"
      style={{ backgroundColor: banner.backgroundColor || '#1d4ed8' }}
    >
      <span className="font-medium">{banner.title}</span>
      {banner.content && <span className="opacity-80">{banner.content}</span>}
      {banner.linkUrl && (
        <a href={banner.linkUrl} className="underline font-semibold hover:opacity-80" target="_blank" rel="noreferrer">
          Learn more →
        </a>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
