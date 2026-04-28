import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { signUpWithEmail, signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || t('errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-border-polish text-center space-y-8"
      >
        <div className="space-y-2">
          <motion.div 
            key={mode}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-bg-polish text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border-polish shadow-inner"
          >
            {mode === 'login' ? <LogIn className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
          </motion.div>
          <h1 className="text-3xl font-black text-text-dark tracking-tighter">
            {mode === 'login' ? t('loginAction') : t('signUp')}
          </h1>
          <p className="text-text-light text-sm font-medium">
            {t('loginDesc')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-text-light uppercase tracking-widest px-1">{t('email')}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-border-polish rounded-2xl outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-bold"
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-text-light uppercase tracking-widest px-1">{t('password')}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
              <input 
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-border-polish rounded-2xl outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-bold"
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              mode === 'login' ? t('loginAction') : t('signUp')
            )}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-polish"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-black">
            <span className="px-4 bg-white text-text-light">{isRTL ? 'یان' : 'OR'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-4 bg-white border border-border-polish py-4 rounded-2xl font-bold hover:bg-bg-polish transition shadow-sm text-sm uppercase tracking-wider group"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-all" />
          {t('signInGoogle')}
        </button>

        <div className="pt-4 space-y-4">
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-xs font-bold text-primary hover:underline underline-offset-4"
          >
            {mode === 'login' ? t('dontHaveAccount') : t('alreadyHaveAccount')}
          </button>
          
          <p className="text-[10px] text-text-light leading-relaxed px-4">
            {t('termsAgreement')}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
