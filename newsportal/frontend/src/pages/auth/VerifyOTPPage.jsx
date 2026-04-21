// VerifyOTPPage.jsx
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export function VerifyOTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const refs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const { login } = useAuth();

  useEffect(() => {
    if (!email) navigate('/signup');
    refs.current[0]?.focus();
    const timer = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[i] = val.slice(-1);
    setOtp(newOtp);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      refs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length !== 6) { toast.error('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      const res = await authAPI.verifyOTP({ email, otp: otpStr });
      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      toast.success('Email verified! Welcome!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      await authAPI.resendOTP({ email });
      toast.success('New OTP sent!');
      setCountdown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend');
    } finally {
      setResending(false);
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✉️</span>
          </div>
          <h2 className="font-headline font-bold text-2xl text-gray-900 mb-1">Verify your email</h2>
          <p className="text-gray-400 text-sm font-sans mb-1">We sent a 6-digit code to</p>
          <p className="text-gray-700 font-medium text-sm font-sans mb-6">{email}</p>

          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input key={i} ref={el => refs.current[i] = el}
                  type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="w-11 h-13 text-center text-xl font-bold border-2 rounded-xl font-sans transition-all focus:outline-none focus:border-primary-500"
                  style={{ height: '52px', borderColor: digit ? '#e11d48' : '#e5e7eb' }}
                />
              ))}
            </div>
            <button type="submit" disabled={loading || otp.join('').length !== 6}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium font-sans hover:bg-primary-700 disabled:opacity-60 transition-colors mb-4">
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <button onClick={handleResend} disabled={countdown > 0 || resending}
            className="text-sm font-sans text-gray-500 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {countdown > 0 ? `Resend code in ${countdown}s` : resending ? 'Sending...' : "Didn't receive it? Resend"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerifyOTPPage;
