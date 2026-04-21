import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: email, 2: otp+password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword({ email, otp, newPassword });
      toast.success('Password reset! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

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
          <h2 className="font-headline font-bold text-2xl text-gray-900 mb-1">Reset password</h2>
          <p className="text-gray-400 text-sm font-sans mb-6">{step === 1 ? "Enter your email to receive an OTP" : "Enter the OTP and your new password"}</p>

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5 font-sans uppercase tracking-wide">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                  placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium font-sans hover:bg-primary-700 disabled:opacity-60 transition-colors">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5 font-sans uppercase tracking-wide">OTP Code</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required maxLength={6}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-primary-400 focus:bg-white transition-all text-center text-xl tracking-widest font-bold"
                  placeholder="000000" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5 font-sans uppercase tracking-wide">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                  placeholder="Min. 6 characters" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5 font-sans uppercase tracking-wide">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-sans focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                  placeholder="Repeat password" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium font-sans hover:bg-primary-700 disabled:opacity-60 transition-colors">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 font-sans mt-6">
            Remember it?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
