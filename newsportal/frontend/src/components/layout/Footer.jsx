import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary-600 rounded flex items-center justify-center">
                <span className="text-white font-headline font-bold text-lg">N</span>
              </div>
              <span className="font-headline font-bold text-white text-xl">NewsPortal</span>
            </div>
            <p className="text-sm text-gray-400 font-sans leading-relaxed">Your trusted source for breaking news, in-depth analysis, and real-time reporting from around the world.</p>
          </div>

          {/* Sections */}
          <div>
            <h4 className="text-white font-semibold mb-4 font-sans text-sm uppercase tracking-wide">Sections</h4>
            <ul className="space-y-2 text-sm font-sans">
              {['Politics', 'Business', 'Technology', 'Sports', 'Entertainment', 'Health'].map(s => (
                <li key={s}><Link to={`/category/${s.toLowerCase()}`} className="text-gray-400 hover:text-white transition-colors">{s}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4 font-sans text-sm uppercase tracking-wide">Company</h4>
            <ul className="space-y-2 text-sm font-sans">
              {['About Us', 'Our Team', 'Careers', 'Advertise', 'Contact'].map(s => (
                <li key={s}><a href="#" className="text-gray-400 hover:text-white transition-colors">{s}</a></li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold mb-4 font-sans text-sm uppercase tracking-wide">Newsletter</h4>
            <p className="text-sm text-gray-400 mb-3 font-sans">Get the latest news delivered to your inbox.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Your email" className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 font-sans" />
              <button className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors font-sans">→</button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-sans">
          <p>© {new Date().getFullYear()} NewsPortal. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
            <a href="#" className="hover:text-white">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
