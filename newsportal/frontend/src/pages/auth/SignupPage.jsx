import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authAPI.signup({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password });
      toast.success('Account created! Check your email for OTP.');
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const f = (field) => ({ value: form[field], onChange: e => setForm({...form, [field]: e.target.value}) });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-headline font-bold text-xl">N</span>
          </div>
          <span className="font-headline font-bold text-2xl text-gray-900">NewsPortal</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="font-headline font-bold text-2xl text-gray-900 mb-1">Create account</h2>
          <p className="text-gray-400 text-sm font-sans mb-6">Join our community of readers</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5 font-sans uppercase tracking-wide">First Name</label>
                <input type="text" required {...f('firstName')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                  placeholder="John" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5 font-sans uppercase tracking-wide">Last Name</label>
                <input type="text" required {...f('lastName')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                  placeholder="Doe" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 font-sans uppercase tracking-wide">Email</label>
              <input type="email" required {...f('email')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 font-sans uppercase tracking-wide">Password</label>
              <input type="password" required {...f('password')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                placeholder="Min. 6 characters" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 font-sans uppercase tracking-wide">Confirm Password</label>
              <input type="password" required {...f('confirmPassword')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                placeholder="Repeat password" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium font-sans hover:bg-primary-700 disabled:opacity-60 transition-colors mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 font-sans mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
